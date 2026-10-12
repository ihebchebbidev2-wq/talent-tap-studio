import { describe, it, expect } from 'vitest';
import { applicationSchema, submissionSchema } from './schema';
const valid = { full_name: 'Test Applicant', phone: '+216 20 123 456', age_group: '18-24', gender: 'female', city: 'Tunis', social_url: '', experience: false, interests: [], video_url: '', notes: '', consent: true };
describe('Casting validation', () => {
  it('accepts the reference fields and optional blanks', () => expect(applicationSchema.safeParse(valid).success).toBe(true));
  it('requires consent', () => expect(applicationSchema.safeParse({ ...valid, consent: false }).success).toBe(false));
  it('rejects unsafe links', () => expect(applicationSchema.safeParse({ ...valid, social_url: 'javascript:alert(1)' }).success).toBe(false));
  it('requires at least two photos', () => expect(submissionSchema.safeParse({ ...valid, photos: [] }).success).toBe(false));
  it('rejects invalid Tunisian phone numbers', () => expect(applicationSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false));
});