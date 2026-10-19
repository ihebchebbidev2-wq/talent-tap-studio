import { z } from 'zod';

export const ages = ['18-24', '25-34', '35-49', '50+'] as const;
export const interestOptions = ['نحكي قدّام الكاميرا', 'نمثّل في فيديوهات إعلانية', 'تصوير صور للمنتجات', 'فيديوهات UGC', 'الكل'] as const;

const isSafeHttpUrl = (value: string) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (!host || host === 'localhost' || host.startsWith('127.') || host.startsWith('0.0.0.0')) return false;
    return true;
  } catch {
    return false;
  }
};

const platformUrl = (domain: string, message: string) => z.string().trim().max(500, message).refine(value => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return isSafeHttpUrl(value) && !parsed.username && !parsed.password &&
      (host === domain || host.endsWith(`.${domain}`)) && parsed.pathname.replaceAll('/', '').length > 0;
  } catch { return false; }
}, message).default('');

const optionalUrl = z.string().trim().max(500).refine(v => !v || isSafeHttpUrl(v), 'الرابط لازم يبدأ بـ https:// ويكون آمنًا');

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, 'اكتب اسمك ولقبك').max(100),
  phone: z.string().trim().regex(/^(?:\+216\s*)?[2459][0-9\s-]{7,14}$/, 'اكتب رقم تونسي صحيح (8 أرقام)'),
  age_group: z.enum(ages, { errorMap: () => ({ message: 'اختار الفئة العمرية' }) }),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'اختار الجنس' }) }),
  city: z.string().trim().min(2, 'اكتب الولاية أو المدينة').max(100),
  instagram_url: platformUrl('instagram.com', 'اكتب رابط حساب Instagram صحيح يبدأ بـ https://'),
  facebook_url: platformUrl('facebook.com', 'اكتب رابط حساب Facebook صحيح يبدأ بـ https://'),
  tiktok_url: platformUrl('tiktok.com', 'اكتب رابط حساب TikTok صحيح يبدأ بـ https://'),
  experience: z.boolean().nullable(),
  interests: z.array(z.enum(interestOptions)).max(5),
  video_url: optionalUrl,
  notes: z.string().trim().max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: 'يلزم توافق على حفظ بياناتك وصورك' }) }),
});
export const submissionSchema = applicationSchema.extend({
  photos: z.array(z.object({ base64: z.string().min(20).max(1400000), type: z.literal('image/jpeg') })).min(2, 'حمّل صورتين على الأقل').max(3),
});