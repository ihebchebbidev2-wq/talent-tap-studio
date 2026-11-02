import { api } from '@/features/casting/api';
import { advertisingAllowed, getRegion, readChoice } from './consent';
type Pixel = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: Pixel; loaded?: boolean; version?: string };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }
let initialized = '';
let config: { pixel_id: string; enabled: boolean } | null = null;
export const publicTrackingPath = (path: string) => path === '/' || path === '/casting/success';
export async function syncPixel() {
  if (!publicTrackingPath(location.pathname)) { window.fbq?.('consent', 'revoke'); return false; }
  const region = await getRegion();
  if (!advertisingAllowed(region, readChoice())) { window.fbq?.('consent', 'revoke'); return false; }
  try { config = await api('/tracking/settings'); } catch { return false; }
  if (!config?.enabled || !/^\d{5,25}$/.test(config.pixel_id)) { window.fbq?.('consent', 'revoke'); return false; }
  // Recheck after asynchronous reads: withdrawal must win over a pending initialization.
  if (!publicTrackingPath(location.pathname) || !advertisingAllowed(region, readChoice())) return false;
  if (initialized && initialized !== config.pixel_id) { window.fbq?.('consent', 'revoke'); return false; }
  if (!window.fbq) {
    const pixel: Pixel = Object.assign((...args: unknown[]) => { if (pixel.callMethod) pixel.callMethod.apply(pixel, args); else pixel.queue.push(args); }, { queue: [] as unknown[][], loaded: true, version: '2.0' });
    pixel.push = pixel; window.fbq = pixel; window._fbq = pixel;
    const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; script.id = 'mega-meta-pixel'; document.head.appendChild(script);
  }
  window.fbq('consent', 'grant');
  if (!initialized) {
    window.fbq('set', 'autoConfig', false, config.pixel_id);
    window.fbq('init', config.pixel_id, {}, { agent: 'lovable' });
    initialized = config.pixel_id;
  }
  return true;
}
export async function reportCompletedApplication(eventId: string, allowedAtCompletion: boolean) {
  const key = `mega-completion-${eventId}`;
  if (!allowedAtCompletion || !publicTrackingPath(location.pathname) || sessionStorage.getItem(key)) return;
  if (!await syncPixel()) return;
  if (!advertisingAllowed(await getRegion(), readChoice()) || !publicTrackingPath(location.pathname) || sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, 'attempted');
  // No name, phone, age, social link, photos, application reference or matching data.
  window.fbq?.('track', 'CompleteRegistration', {}, { eventID: eventId });
}