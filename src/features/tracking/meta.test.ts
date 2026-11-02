import { beforeEach, describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => vi.fn());
const consent = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/features/casting/api', () => ({ api }));
vi.mock('./consent', () => ({ getRegion: async () => 'FR', readChoice: () => ({ accepted: consent.allowed }), advertisingAllowed: () => consent.allowed }));
describe('completed application measurement', () => {
  beforeEach(() => { vi.resetModules(); sessionStorage.clear(); delete window.fbq; delete window._fbq; api.mockResolvedValue({ pixel_id: '123456789', enabled: true }); consent.allowed = true; window.history.replaceState({}, '', '/casting/success'); });
  it('sends CompleteRegistration once with no applicant fields', async () => {
    const { reportCompletedApplication } = await import('./meta');
    await Promise.all([reportCompletedApplication('event-one', true), reportCompletedApplication('event-one', true)]);
    const events = window.fbq?.queue.filter(args => args[0] === 'track');
    expect(events).toEqual([['track', 'CompleteRegistration', {}, { eventID: 'event-one' }]]);
    expect(window.fbq?.queue).toContainEqual(['init', '123456789', {}, { agent: 'lovable' }]);
  });
  it('does not replay a completion blocked at its occurrence', async () => { const { reportCompletedApplication } = await import('./meta'); await reportCompletedApplication('blocked', false); expect(window.fbq).toBeUndefined(); });
  it('respects advertising withdrawal', async () => { consent.allowed = false; const { reportCompletedApplication } = await import('./meta'); await reportCompletedApplication('denied', true); expect(window.fbq).toBeUndefined(); });
  it('never initializes tracking on admin pages', async () => { window.history.replaceState({}, '', '/admin'); const { syncPixel } = await import('./meta'); expect(await syncPixel()).toBe(false); expect(window.fbq).toBeUndefined(); });
});