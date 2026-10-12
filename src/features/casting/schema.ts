import { z } from 'zod';

export const ages = ['18-24', '25-34', '35-49', '50+'] as const;
export const interestOptions = ['نحكي قدّام الكاميرا', 'نمثّل في فيديوهات إعلانية', 'تصوير صور للمنتجات', 'فيديوهات UGC', 'الكل'] as const;
const optionalUrl = z.string().trim().max(500).refine(v => !v || /^https?:\/\//.test(v) && z.string().url().safeParse(v).success, 'الرابط لازم يبدأ بـ https://');
export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, 'اكتب اسمك ولقبك').max(100),
  phone: z.string().trim().regex(/^(?:\+216\s*)?[2459][0-9\s-]{7,14}$/, 'اكتب رقم تونسي صحيح (8 أرقام)'),
  age_group: z.enum(ages, { errorMap: () => ({ message: 'اختار الفئة العمرية' }) }),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'اختار الجنس' }) }),
  city: z.string().trim().min(2, 'اكتب الولاية أو المدينة').max(100),
  social_url: optionalUrl,
  experience: z.boolean().nullable(),
  interests: z.array(z.enum(interestOptions)).max(5),
  video_url: optionalUrl,
  notes: z.string().trim().max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: 'يلزم توافق على حفظ بياناتك وصورك' }) }),
});
export const submissionSchema = applicationSchema.extend({
  photos: z.array(z.object({ base64: z.string().min(20).max(1400000), type: z.literal('image/jpeg') })).min(2, 'حمّل صورتين على الأقل').max(3),
});