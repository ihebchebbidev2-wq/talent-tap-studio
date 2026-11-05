import { Router } from 'express';
import { randomUUID, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import { pool } from './db/pool';
import { requireFullAccess } from './security';

const derive = promisify(scrypt);
const username = z.string().trim().min(2).max(60).regex(/^[a-zA-Z0-9_.-]+$/).transform(v => v.toLowerCase());
const password = z.string().min(12).max(200);
const role = z.enum(['viewer', 'full']);
const settingsSchema = z.object({ pixel_id: z.string().trim().regex(/^$|^\d{5,25}$/), enabled: z.boolean() }).refine(v => !v.enabled || !!v.pixel_id);
export const adminRoutes = Router();
adminRoutes.get('/visitors', async (req, res) => {
  const range = typeof req.query['range'] === 'string' && ['24h', '7d', '30d', 'all'].includes(req.query['range']) ? req.query['range'] : 'all';
  const intervalClause = range === '24h' ? "created_at >= now() - interval '24 hours'" : range === '7d' ? "created_at >= now() - interval '7 days'" : range === '30d' ? "created_at >= now() - interval '30 days'" : 'true';
  const formIntervalClause = range === '24h' ? "last_active_at >= now() - interval '24 hours'" : range === '7d' ? "last_active_at >= now() - interval '7 days'" : range === '30d' ? "last_active_at >= now() - interval '30 days'" : 'true';

  const [statsResult, regionsResult, devicesResult, eventsResult, abandonedResult, recentResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(DISTINCT visitor_id)::int as total_visitors,
        COUNT(DISTINCT session_id)::int as total_sessions,
        COUNT(*)::int as total_events,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int as page_views,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'form_start')::int as form_starts,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'form_submit')::int as form_submits,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'form_abandon')::int as form_abandoned
      FROM visitor_events
      WHERE ${intervalClause}
    `),
    pool.query(`
      SELECT COALESCE(NULLIF(region, ''), 'XX') as region, COUNT(DISTINCT visitor_id)::int as visitors, COUNT(*)::int as events
      FROM visitor_events
      WHERE ${intervalClause}
      GROUP BY region
      ORDER BY visitors DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT device, COUNT(DISTINCT visitor_id)::int as visitors, COUNT(*)::int as events
      FROM visitor_events
      WHERE ${intervalClause}
      GROUP BY device
      ORDER BY visitors DESC
    `),
    pool.query(`
      SELECT event_type, COUNT(*)::int as count
      FROM visitor_events
      WHERE ${intervalClause}
      GROUP BY event_type
      ORDER BY count DESC
    `),
    pool.query(`
      SELECT session_id, visitor_id, region, city, device, started_at, last_active_at,
             last_step, completed_sections, fields_filled, abandoned, metadata
      FROM form_sessions
      WHERE submitted = false AND ${formIntervalClause}
      ORDER BY last_active_at DESC
      LIMIT 50
    `),
    pool.query(`
      SELECT id, visitor_id, session_id, event_type, path, region, city, device, browser, metadata, created_at
      FROM visitor_events
      ORDER BY created_at DESC
      LIMIT 40
    `)
  ]);

  const stats = statsResult.rows[0];
  const abandonedCount = await pool.query(`SELECT COUNT(*)::int as count FROM form_sessions WHERE submitted = false AND ${formIntervalClause}`);
  stats.form_abandoned = Math.max(stats.form_abandoned, abandonedCount.rows[0].count);

  res.json({
    stats,
    regions: regionsResult.rows,
    devices: devicesResult.rows,
    eventTypes: eventsResult.rows,
    abandonedForms: abandonedResult.rows,
    recentEvents: recentResult.rows,
  });
});
adminRoutes.use(['/users', '/settings'], requireFullAccess);
adminRoutes.get('/users', async (_req, res) => {
  const result = await pool.query('SELECT u.id,u.username,u.active,u.created_at,r.role FROM admin_users u JOIN admin_user_roles r ON r.user_id=u.id ORDER BY u.created_at,u.id');
  res.json({ items: result.rows });
});
adminRoutes.post('/users', async (req, res) => {
  const parsed = z.object({ username, password, role }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Identifiant invalide ou mot de passe trop court (12 caractères minimum).' }); return; }
  const salt = randomBytes(16).toString('hex');
  const hash = `${salt}:${(await derive(parsed.data.password, salt, 64) as Buffer).toString('hex')}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = randomUUID();
    await client.query('INSERT INTO admin_users(id,username,password_hash) VALUES ($1,$2,$3)', [id, parsed.data.username, hash]);
    await client.query('INSERT INTO admin_user_roles(user_id,role) VALUES ($1,$2)', [id, parsed.data.role]);
    await client.query('COMMIT'); res.status(201).json({ id });
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') { res.status(409).json({ error: 'Cet identifiant existe déjà.' }); return; }
    throw error;
  } finally { client.release(); }
});
adminRoutes.patch('/users/:id', async (req, res) => {
  const parsed = z.object({ role, active: z.boolean(), password: password.optional() }).safeParse(req.body);
  if (!parsed.success || !z.string().uuid().safeParse(req.params['id']).success) { res.status(400).json({ error: 'Configuration de compte invalide.' }); return; }
  const id = req.params['id'];
  if (id === res.locals['admin'].id && (!parsed.data.active || parsed.data.role !== 'full')) { res.status(409).json({ error: 'Vous ne pouvez pas retirer votre propre accès complet.' }); return; }
  let passwordHash: string | null = null;
  if (parsed.data.password) { const salt = randomBytes(16).toString('hex'); passwordHash = `${salt}:${(await derive(parsed.data.password, salt, 64) as Buffer).toString('hex')}`; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize role changes so concurrent requests cannot remove the last full-access account.
    await client.query('LOCK TABLE admin_users,admin_user_roles IN SHARE ROW EXCLUSIVE MODE');
    const target = await client.query('SELECT u.active,r.role FROM admin_users u JOIN admin_user_roles r ON r.user_id=u.id WHERE u.id=$1', [id]);
    if (!target.rowCount) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Compte introuvable.' }); return; }
    const full = await client.query("SELECT count(*)::int total FROM admin_users u JOIN admin_user_roles r ON r.user_id=u.id WHERE u.active AND r.role='full'");
    if (target.rows[0].active && target.rows[0].role === 'full' && (!parsed.data.active || parsed.data.role !== 'full') && full.rows[0].total <= 1) {
      await client.query('ROLLBACK'); res.status(409).json({ error: 'Le dernier compte avec accès complet doit rester actif.' }); return;
    }
    await client.query('UPDATE admin_users SET active=$1,password_hash=COALESCE($2,password_hash) WHERE id=$3', [parsed.data.active, passwordHash, id]);
    await client.query('UPDATE admin_user_roles SET role=$1 WHERE user_id=$2', [parsed.data.role, id]);
    if (!parsed.data.active || passwordHash || target.rows[0].role !== parsed.data.role) await client.query('DELETE FROM admin_sessions WHERE user_id=$1', [id]);
    await client.query('COMMIT'); res.json({ ok: true });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});
adminRoutes.get('/settings', async (_req, res) => { res.json((await pool.query('SELECT pixel_id,enabled,updated_at FROM tracking_settings WHERE singleton=true')).rows[0]); });
adminRoutes.put('/settings', async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Indiquez un identifiant Pixel valide avant de l’activer.' }); return; }
  const result = await pool.query('UPDATE tracking_settings SET pixel_id=$1,enabled=$2,updated_at=now() WHERE singleton=true RETURNING pixel_id,enabled,updated_at', [parsed.data.pixel_id, parsed.data.enabled]);
  res.json(result.rows[0]);
});