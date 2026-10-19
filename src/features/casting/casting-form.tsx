import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, UserRound, Clapperboard, Images, ShieldCheck, Check, LoaderCircle, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applicationSchema, ages, interestOptions } from './schema';
import { submitApplication, backendUrl } from './api';
import { PhotoUpload, type CastingPhoto } from './photo-upload';
import { translate, type Language } from './localization';

export function CastingForm({ language }: { language: Language }) {
  const t = (key: string) => translate(language, key);
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const [values, setValues] = useState({ full_name: '', phone: '', city: '', instagram_url: '', facebook_url: '', tiktok_url: '', video_url: '', notes: '', age_group: '', gender: '', experience: null as boolean | null, interests: [] as string[], consent: false });
  const [photos, setPhotos] = useState<CastingPhoto[]>([]);
  const photoRef = useRef(photos);
  useEffect(() => { photoRef.current = photos; }, [photos]);
  useEffect(() => () => photoRef.current.forEach(p => URL.revokeObjectURL(p.preview)), []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState('');
  const set = (key: keyof typeof values, value: string | boolean | string[] | null) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: '' })); };
  const completed = [values.full_name && values.phone && values.age_group && values.gender && values.city, values.experience !== null || values.interests.length > 0 || values.instagram_url || values.facebook_url || values.tiktok_url, photos.length >= 2].filter(Boolean).length;
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = applicationSchema.safeParse(values);
    const next: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach(issue => { next[String(issue.path[0])] = (/[\u0600-\u06ff]/.test(issue.message) ? issue.message : 'تأكّد من هذا الحقل'); });
    if (photos.length < 2) next['photos'] = 'حمّل صورتين على الأقل باش نكمّلوا الترشّح';
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => { const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]'); invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' }); (invalid?.matches('input') ? invalid : invalid?.querySelector<HTMLElement>('button, input'))?.focus({ preventScroll: true }); }); return; }
    if (!parsed.success) return;
    setSending(true);
    try {
      const encoded = await Promise.all(photos.map(async p => {
        const bytes = new Uint8Array(await p.file.arrayBuffer());
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return { base64: btoa(binary), type: 'image/jpeg' as const };
      }));
      const result = await submitApplication({ ...parsed.data, photos: encoded });
      setReference(result.reference);
      document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' });
    } catch { setErrors({ submit: backendUrl ? 'ما نجّمش نبعثوا الترشّح توّا. بياناتك مازالت هنا، عاود جرّب.' : 'الخدمة تتفعّل بعد ربط الخادم. بياناتك مازالت هنا.' }); }
    finally { setSending(false); }
  }
  const field = (name: 'full_name' | 'phone' | 'city' | 'instagram_url' | 'facebook_url' | 'tiktok_url' | 'video_url', label: string, placeholder: string, required = false) => <div className="form-field">
    <label htmlFor={name}>{t(label)} {required ? <span className="required">*</span> : <span className="optional">{t('اختياري')}</span>}</label>
    <input id={name} name={name} value={values[name]} onChange={e => set(name, e.target.value)} onBlur={() => {
      if (!name.includes('url')) return;
      const result = applicationSchema.shape[name].safeParse(values[name]);
      setErrors(current => ({ ...current, [name]: result.success ? '' : result.error.issues[0]?.message ?? 'تأكّد من هذا الحقل' }));
    }} placeholder={t(placeholder)} maxLength={name.includes('url') ? 500 : 100} type={name === 'phone' ? 'tel' : name.includes('url') ? 'url' : 'text'} dir={name === 'phone' || name.includes('url') ? 'ltr' : direction} autoComplete={name === 'full_name' ? 'name' : name === 'phone' ? 'tel' : name === 'city' ? 'address-level2' : 'off'} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} />
    {errors[name] && <p id={`${name}-error`} className="field-error">{t(errors[name])}</p>}
  </div>;
  if (reference) return <section id="application" className="success-section" dir={direction}><CircleCheck /><span className="eyebrow">{t('ترشّحك وصلنا')}</span><h2>{t('شكراً، خلّينا نتلاقاو قريب!')}</h2><p>{t('حفظنا بياناتك وصورك. فريقنا يراجع ترشّحك ويتّصل بيك بخصوصه.')}</p><span className="reference">{t('رقم الترشّح:')}<b dir="ltr">{reference}</b></span></section>;
  return <section id="application" className="application-layout" dir={direction}>
    <aside className="application-aside"><span className="eyebrow">{t('الفصل الجاي')}</span><h2>{t('البداية من هنا')}<span className="accent-dot">.</span></h2><p>{t('وجه جديد، طاقة جديدة. نحبّوا نتعرّفوا عليك.')}</p><div className="section-nav">{['معلوماتك الأساسية', 'تجربتك واهتماماتك', 'صورك وأعمالك'].map((label, i) => <a href={`#section-${i + 1}`} key={label}><span dir="ltr">0{i + 1}</span>{t(label)}<ArrowLeft /></a>)}</div><div className="aside-privacy"><ShieldCheck /><p>{t('المعلومات متاحة فقط للفريق المسؤول على مراجعة الترشّحات.')}</p></div></aside>
    <form onSubmit={handleSubmit} noValidate className="casting-form"><div className="form-intro"><span>{t('استمارة الترشّح')}</span><span className="completion">{completed} / 3 <span>{t('أقسام')}</span></span></div><div className="progress-track"><div className={`progress-fill progress-${completed}`} /></div>
      <fieldset disabled={sending} id="section-1" className="form-section"><legend className="sr-only">{t('معلوماتك الأساسية')}</legend><div className="section-heading"><span className="section-icon"><UserRound /></span><div><span className="section-count">01 / {t('معلوماتك الأساسية')}</span><h3>{t('معلوماتك الأساسية')}</h3></div></div><div className="fields-grid">{field('full_name', 'الاسم واللقب', 'اكتب اسمك ولقبك', true)}{field('phone', 'رقم الهاتف / WhatsApp', '+216 XX XXX XXX', true)}</div>
      <div className="form-field"><label id="age-label">{t('الفئة العمرية')}<span className="required">*</span></label><div className="choice-row age-choices" role="radiogroup" aria-labelledby="age-label" aria-invalid={!!errors['age_group']}>{ages.map((age, i) => <Button type="button" variant="choice" role="radio" aria-checked={values.age_group === age} data-selected={values.age_group === age} key={age} onClick={() => set('age_group', age)}><span className="radio-dot" />{t(['18–24 سنة', '25–34 سنة', '35–49 سنة', '50 سنة فما فوق'][i] ?? age)}</Button>)}</div>{errors['age_group'] && <p className="field-error">{t(errors['age_group'])}</p>}</div>
      <div className="fields-grid"><div className="form-field"><label id="gender-label">{t('الجنس')}<span className="required">*</span></label><div className="choice-row" role="radiogroup" aria-labelledby="gender-label" aria-invalid={!!errors['gender']}>{([['male', 'ذكر'], ['female', 'أنثى']] as const).map(([value, label]) => <Button variant="choice" type="button" role="radio" aria-checked={values.gender === value} data-selected={values.gender === value} key={value} onClick={() => set('gender', value)}><span className="radio-dot" />{t(label)}</Button>)}</div>{errors['gender'] && <p className="field-error">{t(errors['gender'])}</p>}</div>{field('city', 'الولاية / المدينة', 'مثال: تونس، المرسى', true)}</div></fieldset>
      <fieldset disabled={sending} id="section-2" className="form-section"><legend className="sr-only">{t('تجربتك واهتماماتك')}</legend><div className="section-heading"><span className="section-icon"><Clapperboard /></span><div><span className="section-count">02 / {t('تجربتك واهتماماتك')}</span><h3>{t('تجربتك واهتماماتك')}</h3></div></div>{field('instagram_url', 'رابط حسابك على Instagram', 'https://www.instagram.com/username/')}{field('facebook_url', 'رابط حسابك على Facebook', 'https://www.facebook.com/username')}{field('tiktok_url', 'رابط حسابك على TikTok', 'https://www.tiktok.com/@username')}<p className="field-hint">{t('اختياري، إذا عندك حساب تحب تشاركه معانا.')}</p><div className="form-field"><label id="experience-label">{t('عندك تجربة سابقة في التصوير؟')}</label><div className="choice-row" role="radiogroup" aria-labelledby="experience-label">{[true, false].map(value => <Button variant="choice" type="button" role="radio" aria-checked={values.experience === value} data-selected={values.experience === value} key={String(value)} onClick={() => set('experience', value)}><span className="radio-dot" />{t(value ? 'نعم' : 'لا')}</Button>)}</div></div><div className="form-field"><label>{t('شنوّة نوع التصوير اللي ترتاح فيه؟')}</label><p className="field-hint">{t('تنجم تختار أكثر من إجابة.')}</p><div className="interest-choices">{interestOptions.map(option => <Button variant="choice" type="button" role="checkbox" aria-checked={values.interests.includes(option)} data-selected={values.interests.includes(option)} key={option} onClick={() => set('interests', values.interests.includes(option) ? values.interests.filter(v => v !== option) : [...values.interests, option])}><span className="check-box">{values.interests.includes(option) && <Check />}</span>{t(option)}</Button>)}</div></div></fieldset>
      <fieldset disabled={sending} id="section-3" className="form-section"><legend className="sr-only">{t('صورك وأعمالك')}</legend><div className="section-heading"><span className="section-icon"><Images /></span><div><span className="section-count">03 / {t('صورك وأعمالك')}</span><h3>{t('صورك وأعمالك')}</h3></div></div><div className="form-field" aria-invalid={!!errors['photos']}><label>{t('حمّل تصاور واضحة ليك (2–3 صور)')}<span className="required">*</span></label><PhotoUpload language={language} photos={photos} onChange={p => { setPhotos(p); setErrors(e => ({ ...e, photos: '' })); }} disabled={sending} />{errors['photos'] && <p className="field-error">{t(errors['photos'])}</p>}</div>{field('video_url', 'رابط فيديو تعريفي أو تصوير سابق', 'https://')}<p className="field-hint">{t('اختياري. تأكّد أن الرابط ينجم يتفتح.')}</p><div className="form-field"><label htmlFor="notes">{t('معلومات إضافية')}<span className="optional">{t('اختياري')}</span></label><textarea id="notes" placeholder={t('حاجة أخرى تحبّنا نعرفوها عليك؟')} maxLength={2000} value={values.notes} onChange={e => set('notes', e.target.value)} rows={4} /><span className="character-count">{values.notes.length} / 2000</span></div></fieldset>
      <div className="form-submit"><label className="consent-label"><input type="checkbox" checked={values.consent} onChange={e => set('consent', e.target.checked)} disabled={sending} aria-invalid={!!errors['consent']} /><span>{t('أوافق على حفظ بياناتي وصوري لتقييم الترشّح والتواصل معايا بخصوصه. الصور لا تُنشر دون موافقة منفصلة.')}</span></label>{errors['consent'] && <p className="field-error">{t(errors['consent'])}</p>}{errors['submit'] && <p className="field-error" role="alert">{t(errors['submit'])}</p>}<Button variant="submit" size="lg" type="submit" disabled={sending}>{sending ? <><LoaderCircle className="animate-spin" />{t('جاري إرسال الترشّح…')}</> : <>{t('إرسال الترشّح')}<ArrowLeft /></>}</Button><p className="submit-privacy"><ShieldCheck />{t('بياناتك وصورك في أمان، ومتاحة فقط لفريقنا.')}</p></div>
    </form>
  </section>;
}