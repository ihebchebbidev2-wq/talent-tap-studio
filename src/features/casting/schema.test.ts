import { describe, it, expect } from 'vitest';
import { applicationSchema, submissionSchema } from './schema';
const valid = { full_name: 'Test Applicant', phone: '+216 20 123 456', age_group: '18-24', gender: 'female', city: 'Tunis', instagram_url: '', facebook_url: '', tiktok_url: '', experience: false, interests: [], video_url: '', notes: '', consent: true };
describe('Casting validation', () => {
  it('accepts the reference fields and optional blanks', () => expect(applicationSchema.safeParse(valid).success).toBe(true));
  it.each([
    ['instagram_url', 'https://www.instagram.com/creator_name/', 'https://facebook.com/creator'],
    ['facebook_url', 'https://facebook.com/creator.name', 'https://www.tiktok.com/@creator'],
    ['tiktok_url', 'https://www.tiktok.com/@creator', 'https://instagram.com/creator'],
  ])('validates %s only against its own platform', (field, good, wrongPlatform) => {
    expect(applicationSchema.safeParse({ ...valid, [field]: good }).success).toBe(true);
    for (const bad of [wrongPlatform, 'javascript:alert(1)', good.replace('https:', 'http:'), good.replace('.com', '.com.evil.com'), good.split('/').slice(0, 3).join('/')]) {
      expect(applicationSchema.safeParse({ ...valid, [field]: bad }).success).toBe(false);
    }
  });
  it('requires consent', () => expect(applicationSchema.safeParse({ ...valid, consent: false }).success).toBe(false));
  it('requires at least two photos', () => expect(submissionSchema.safeParse({ ...valid, photos: [] }).success).toBe(false));
  it('rejects invalid Tunisian phone numbers', () => expect(applicationSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false));
});