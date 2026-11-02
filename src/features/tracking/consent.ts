import { api } from '@/features/casting/api';
export const noticeVersion = '2026-11-02';
export const consentRegions = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LI LV LT LU MT NL NO PL PT RO SK SI ES SE GB CH'.split(' '));
export interface AdvertisingChoice { visitor_id: string; accepted: boolean; region: string; notice_version: string; at: string; evidence_id: string }
const key = 'mega-advertising-choice';
export const choiceEvent = 'mega-advertising-choice';
export const settingsEvent = 'mega-cookie-settings';
export function readChoice(): AdvertisingChoice | null {
  try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v && typeof v.accepted === 'boolean' && typeof v.evidence_id === 'string' && v.notice_version === noticeVersion ? v : null; } catch { return null; }
}
export function advertisingAllowed(region: string, choice: AdvertisingChoice | null): boolean {
  if (choice) return choice.accepted;
  return /^[A-Z]{2}$/.test(region) && !['XX', 'T1'].includes(region) && !consentRegions.has(region);
}
let regionPromise: Promise<string> | undefined;
export function getRegion() {
  regionPromise ??= (async () => {
    try {
      const response = await fetch('/cdn-cgi/trace', { signal: AbortSignal.timeout(2000), cache: 'no-store' });
      if (!response.ok) return 'XX';
      const text = await response.text();
      const host = /^h=(.+)$/m.exec(text)?.[1];
      const region = /^loc=([A-Z]{2})$/m.exec(text)?.[1];
      return host === location.host && region && region !== 'T1' ? region : 'XX';
    } catch { return 'XX'; }
  })();
  return regionPromise;
}
export async function saveChoice(accepted: boolean, region: string) {
  const old = readChoice();
  const visitor_id = old?.visitor_id ?? crypto.randomUUID();
  const payload = { visitor_id, accepted, region, notice_version: noticeVersion };
  const requestId = crypto.randomUUID();
  localStorage.setItem('mega-advertising-pending', requestId);
  // Acceptance requires a durable record. A failed withdrawal still denies locally immediately.
  if (!accepted) {
    localStorage.setItem(key, JSON.stringify({ ...payload, at: new Date().toISOString(), evidence_id: old?.evidence_id ?? 'pending' }));
    window.dispatchEvent(new Event(choiceEvent));
  }
  const result = await api<{ id: string }>('/tracking/consent', { method: 'POST', body: JSON.stringify(payload) });
  if (localStorage.getItem('mega-advertising-pending') !== requestId) return;
  localStorage.setItem(key, JSON.stringify({ ...payload, at: new Date().toISOString(), evidence_id: result.id }));
  window.dispatchEvent(new Event(choiceEvent));
}