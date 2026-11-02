import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { advertisingAllowed, choiceEvent, getRegion, readChoice, saveChoice, settingsEvent } from './consent';
import { syncPixel } from './meta';
import type { Language } from '@/features/casting/localization';
export function CookieControls({ language = 'fr' }: { language?: Language }) {
  const [open, setOpen] = useState(false); const [region, setRegion] = useState('XX'); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const ar = language === 'ar';
  useEffect(() => {
    let active = true;
    getRegion().then(value => { if (active) { setRegion(value); setOpen(!readChoice() && !advertisingAllowed(value, null)); void syncPixel(); } });
    const show = () => setOpen(true);
    const change = () => { void syncPixel(); };
    window.addEventListener(settingsEvent, show); window.addEventListener(choiceEvent, change); window.addEventListener('storage', change);
    return () => { active = false; window.removeEventListener(settingsEvent, show); window.removeEventListener(choiceEvent, change); window.removeEventListener('storage', change); };
  }, []);
  async function choose(accept: boolean) {
    setBusy(true); setError('');
    try { await saveChoice(accept, region); setOpen(false); }
    catch { setError(ar ? 'ما نجّمناش نحفظوا اختيارك. التتبّع الاختياري معطّل، عاود جرّب.' : 'Votre choix n’a pas pu être enregistré. Le suivi facultatif reste désactivé, veuillez réessayer.'); }
    finally { setBusy(false); }
  }
  return <><Button variant="link" onClick={() => setOpen(true)}>{ar ? 'إعدادات ملفات الارتباط' : 'Paramètres des cookies'}</Button>{open && <section className="cookie-notice" aria-label={ar ? 'اختيارات الخصوصية' : 'Choix de confidentialité'} dir={ar ? 'rtl' : 'ltr'}><h2>{ar ? 'اختيارك للخصوصية' : 'Votre choix de confidentialité'}</h2><p>{ar ? 'بموافقتك، Meta يقيس الترشّحات المكتملة لتحسين إعلانات Facebook وInstagram. ما نبعثوش معلوماتك ولا صورك. الرفض ما يمنعش الترشّح. تنجم تبدّل اختيارك من إعدادات ملفات الارتباط.' : 'Avec votre accord, Meta mesure les candidatures finalisées pour optimiser les publicités Facebook et Instagram. Vos informations et photos ne sont pas transmises. Refuser ne bloque pas votre candidature. Vous pouvez changer votre choix dans les paramètres des cookies.'}</p><Link to="/privacy">{ar ? 'سياسة الخصوصية' : 'Politique de confidentialité'}</Link>{error && <p className="field-error" role="alert">{error}</p>}<div className="cookie-actions"><Button variant="outline" disabled={busy} onClick={() => choose(false)}>{ar ? 'نرفض' : 'Refuser'}</Button><Button variant="outline" disabled={busy} onClick={() => choose(true)}>{ar ? 'نوافق' : 'Accepter'}</Button><Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>{ar ? 'إغلاق' : 'Fermer'}</Button></div></section>}</>;
}