import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CircleCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/mega-creative-logo.webp';
import { readReceipt } from '@/features/casting/receipt';
import { translate } from '@/features/casting/localization';
import { CookieControls } from '@/features/tracking/cookie-controls';
import { reportCompletedApplication } from '@/features/tracking/meta';
export const Route = createFileRoute('/casting/success')({ head: () => ({ meta: [
  { title: 'Candidature reçue — MEGA CREATIVE' }, { name: 'description', content: 'Confirmation de réception de votre candidature au casting MEGA CREATIVE.' },
  { property: 'og:title', content: 'Candidature reçue — MEGA CREATIVE' }, { property: 'og:description', content: 'Confirmation de candidature au casting.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, nofollow' },
] }), component: Success });
function Success() {
  const [receipt, setReceipt] = useState<ReturnType<typeof readReceipt>>(null); const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const value = readReceipt(); setReceipt(value); setLoaded(true);
    document.documentElement.lang = value?.language === 'ar' ? 'ar-TN' : 'fr'; document.documentElement.dir = value?.language === 'ar' ? 'rtl' : 'ltr';
    if (value) void reportCompletedApplication(value.event_id, value.advertising_allowed);
    requestAnimationFrame(() => document.getElementById('success-heading')?.focus());
  }, []);
  const lang = receipt?.language ?? 'fr'; const t = (key: string) => translate(lang, key);
  return <main className="casting-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}><header className="site-header"><Link to="/"><img src={logo} className="brand-logo" alt="MEGA CREATIVE" /></Link></header><section className="success-section" aria-live="polite">{receipt && <CircleCheck />}<span className="eyebrow">MEGA CREATIVE · CASTING</span><h1 id="success-heading" tabIndex={-1}>{!loaded ? '…' : receipt ? t('شكراً، خلّينا نتلاقاو قريب!') : 'Aucune confirmation disponible'}</h1><p>{receipt ? t('حفظنا بياناتك وصورك. فريقنا يراجع ترشّحك ويتّصل بيك بخصوصه.') : 'Cette page confirme uniquement les candidatures envoyées depuis ce navigateur.'}</p>{receipt && <span className="reference">{t('رقم الترشّح:')} <b dir="ltr">{receipt.reference}</b></span>}<Button asChild variant="outline" className="mt-8"><Link to="/"><ArrowLeft />{lang === 'ar' ? 'الرجوع للكاستينغ' : 'Retour au casting'}</Link></Button></section><footer className="site-footer"><span>MEGA CREATIVE</span><Link to="/privacy">{lang === 'ar' ? 'سياسة الخصوصية' : 'Confidentialité'}</Link><CookieControls language={lang} /></footer></main>;
}