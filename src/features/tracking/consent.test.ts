import { describe, expect, it } from 'vitest';
import { advertisingAllowed, type AdvertisingChoice } from './consent';
describe('advertising regional permission', () => {
  it('denies France before an advertising choice', () => { expect(advertisingAllowed('FR', null)).toBe(false); });
  it('denies unresolved and Tor regions', () => { expect(advertisingAllowed('XX', null)).toBe(false); expect(advertisingAllowed('T1', null)).toBe(false); });
  it('permits Tunisia with no required regional banner', () => { expect(advertisingAllowed('TN', null)).toBe(true); });
  it('honors refusal even outside consent regions', () => { expect(advertisingAllowed('TN', { accepted: false } as AdvertisingChoice)).toBe(false); });
  it('permits a recorded acceptance in France', () => { expect(advertisingAllowed('FR', { accepted: true } as AdvertisingChoice)).toBe(true); });
});