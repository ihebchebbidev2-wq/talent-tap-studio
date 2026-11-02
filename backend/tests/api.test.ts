import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

const server = createApp().listen(0);
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Missing test server');
const base = `http://localhost:${address.port}/api`;
const origin = 'http://localhost:8080';
const password = process.env['TEST_ADMIN_PASSWORD'];
if (!password) throw new Error('Set TEST_ADMIN_PASSWORD for integration tests.');
let cookie = ''; let id = '';
const request = (path: string, method = 'GET', data?: unknown, authenticated = true) => fetch(`${base}${path}`, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(authenticated && cookie ? { Cookie: cookie } : {}) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
after(async () => { if (id) await pool.query('DELETE FROM applications WHERE id=$1', [id]); if (cookie) await request('/auth/logout', 'POST'); await new Promise<void>(resolve => server.close(() => resolve())); await pool.end(); });
test('accepts only configured frontend origins', async () => {
  const preflight = await fetch(`${base}/auth/session`, { method: 'OPTIONS', headers: { Origin: 'https://www.megacreative.art', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(preflight.status, 404);
  assert.equal(preflight.headers.get('access-control-allow-origin'), null);
  const trusted = await fetch(`${base}/auth/session`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } });
  assert.equal(trusted.headers.get('access-control-allow-origin'), origin);
  assert.equal(trusted.headers.get('access-control-allow-credentials'), 'true');
});

test('private intake and complete admin lifecycle', async () => {
  assert.equal((await request('/admin/stats', 'GET', undefined, false)).status, 401);
  assert.equal((await request('/auth/login', 'POST', { username: 'Mega', password: 'incorrect-test-value' })).status, 401);
  const login = await request('/auth/login', 'POST', { username: 'Mega', password });
  assert.equal(login.status, 200); cookie = login.headers.get('set-cookie')?.split(';')[0] ?? '';
  assert.ok(login.headers.get('set-cookie')?.includes('HttpOnly'));
  assert.equal((await request('/auth/session')).status, 200);
  assert.equal((await request('/applications', 'POST', {})).status, 400);
  const jpeg = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  const body = { full_name: 'Integration applicant', phone: '+216 25 123 456', age_group: '25-34', gender: 'female', city: 'Tunis', instagram_url: 'https://www.instagram.com/creator_name/', facebook_url: 'https://www.facebook.com/creator.name', tiktok_url: 'https://www.tiktok.com/@creator', experience: true, interests: ['فيديوهات UGC'], video_url: '', notes: 'Integration notes', consent: true, photos: [1, 2].map(() => ({ base64: jpeg.toString('base64'), type: 'image/jpeg' })) };
  for (const field of ['instagram_url', 'facebook_url', 'tiktok_url']) {
    assert.equal((await request('/applications', 'POST', { ...body, [field]: 'https://example.org/profile' }, false)).status, 400);
  }
  const submitted = await request('/applications', 'POST', body, false);
  assert.equal(submitted.status, 201);
  const { reference } = await submitted.json() as { reference: string };
  const list = await (await request(`/admin/applications?q=${reference}`)).json() as { items: { id: string; photo_id: string }[]; total: number };
  assert.equal(list.total, 1); id = list.items[0]?.id ?? ''; assert.ok(id);
  const detail = await (await request(`/admin/applications/${id}`)).json() as { full_name: string; notes: string; instagram_url: string; facebook_url: string; tiktok_url: string; photos: { id: string }[] };
  assert.equal(detail.full_name, body.full_name); assert.equal(detail.notes, body.notes); assert.equal(detail.photos.length, 2);
  assert.equal(detail.instagram_url, body.instagram_url);
  assert.equal(detail.facebook_url, body.facebook_url);
  assert.equal(detail.tiktok_url, body.tiktok_url);
  const photoId = detail.photos[0]?.id;
  assert.equal(list.items[0]?.photo_id, photoId);
  const matching = await (await request(`/admin/applications?${new URLSearchParams({ q: reference, age: '25-34', gender: 'female', city: 'tUn', experience: 'true', status: 'new' })}`)).json() as { total: number };
  assert.equal(matching.total, 1);
  for (const filter of ['age=50%2B', 'gender=male', 'city=Sfax', 'experience=false', 'status=rejected', 'page=2']) {
    const filtered = await (await request(`/admin/applications?q=${reference}&${filter}`)).json() as { items: unknown[]; total: number };
    assert.equal(filtered.items.length, 0);
    assert.equal(filtered.total, filter === 'page=2' ? 1 : 0);
  }
  for (const filter of ['age=17', 'gender=other', 'experience=yes', 'page=0']) assert.equal((await request(`/admin/applications?${filter}`)).status, 400);
  assert.equal((await request('/admin/applications?age=25-34', 'GET', undefined, false)).status, 401);
  assert.equal((await request(`/admin/photos/${photoId}`, 'GET', undefined, false)).status, 401);
  assert.equal((await request(`/admin/photos/${photoId}`)).headers.get('content-type'), 'image/jpeg');
  assert.equal((await request(`/admin/applications/${id}`, 'PATCH', { status: 'shortlisted' })).status, 200);
  const updated = await (await request(`/admin/applications/${id}`)).json() as { status: string };
  assert.equal(updated.status, 'shortlisted');
  const crossOriginPatch = await fetch(`${base}/admin/applications/${id}`, { method: 'PATCH', headers: { Origin: 'https://www.megacreative.art', Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
  assert.equal(crossOriginPatch.status, 403);
  const viewerPassword = 'Disposable-viewer-password-2026';
  const viewerUsername = `viewer_${Date.now()}`;
  const createdUser = await request('/admin/users', 'POST', { username: viewerUsername, password: viewerPassword, role: 'viewer' });
  assert.equal(createdUser.status, 201);
  const viewerId = (await createdUser.json() as { id: string }).id;
  const viewerLogin = await request('/auth/login', 'POST', { username: viewerUsername, password: viewerPassword }, false);
  assert.equal(viewerLogin.status, 200);
  const viewerCookie = viewerLogin.headers.get('set-cookie')?.split(';')[0] ?? '';
  const viewerRequest = (path: string, method = 'GET', data?: unknown) => fetch(`${base}${path}`, { method, headers: { Origin: origin, Cookie: viewerCookie, 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  try {
    assert.equal((await viewerRequest('/admin/stats')).status, 200);
    assert.equal((await viewerRequest(`/admin/applications/${id}`)).status, 200);
    assert.equal((await viewerRequest(`/admin/photos/${photoId}`)).status, 200);
    assert.equal((await viewerRequest(`/admin/applications/${id}`, 'PATCH', { status: 'rejected' })).status, 403);
    assert.equal((await viewerRequest(`/admin/applications/${id}`, 'DELETE')).status, 403);
    assert.equal((await viewerRequest('/admin/users')).status, 403);
    assert.equal((await viewerRequest('/admin/users', 'POST', { username: 'escalation', password: viewerPassword, role: 'full' })).status, 403);
    assert.equal((await viewerRequest(`/admin/users/${viewerId}`, 'PATCH', { role: 'full', active: true })).status, 403);
    assert.equal((await viewerRequest('/admin/settings')).status, 403);
    assert.equal((await viewerRequest('/admin/settings', 'PUT', { pixel_id: '123456789', enabled: true })).status, 403);
    assert.equal((await request('/admin/settings', 'PUT', { pixel_id: '', enabled: true })).status, 400);
    assert.equal((await request('/admin/settings', 'PUT', { pixel_id: '123456789', enabled: false })).status, 200);
    const publicSettings = await (await request('/tracking/settings', 'GET', undefined, false)).json() as { pixel_id: string; enabled: boolean };
    assert.equal(publicSettings.pixel_id, '123456789'); assert.equal(publicSettings.enabled, false);
    const self = await (await request('/auth/session')).json() as { id: string };
    assert.equal((await request(`/admin/users/${self.id}`, 'PATCH', { role: 'viewer', active: false })).status, 409);
    assert.equal((await request(`/admin/users/${viewerId}`, 'PATCH', { role: 'viewer', active: false })).status, 200);
    assert.equal((await viewerRequest('/admin/stats')).status, 401);
    assert.equal((await request(`/admin/photos/${photoId}`)).headers.get('cache-control'), 'no-store');
    assert.equal((await request(`/admin/applications/${id}`, 'DELETE')).status, 200);
    assert.equal((await request(`/admin/applications/${id}`)).status, 404);
    assert.equal((await request(`/admin/photos/${photoId}`)).status, 404);
    const photoCount = await pool.query('SELECT count(*)::int total FROM application_photos WHERE application_id=$1', [id]);
    assert.equal(photoCount.rows[0].total, 0);
  } finally { await pool.query('DELETE FROM admin_users WHERE id=$1', [viewerId]); }
  assert.equal((await request('/auth/logout', 'POST')).status, 200);
  assert.equal((await request('/admin/stats')).status, 401);
});