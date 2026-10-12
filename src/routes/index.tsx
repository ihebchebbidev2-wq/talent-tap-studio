import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, MapPin, Globe2 } from 'lucide-react';
import logo from '@/assets/mega-creative-logo.png.asset.json';
import studio from '@/assets/casting-studio.jpg';
import frenchFlag from '@/assets/flags/fr.png';
import tunisianFlag from '@/assets/flags/tn.png';
import { CastingForm } from '@/features/casting/casting-form';
import { translate, type Language } from '@/features/casting/localization';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'MEGA CREATIVE — Casting Tunisia | Apply now' },
    { name: 'description', content: 'Apply for advertising, content creation and UGC projects with MEGA CREATIVE in Tunisia. Share your profile in English, French or Arabic.' },
    { property: 'og:title', content: 'MEGA CREATIVE — Casting Tunisia' },
    { property: 'og:description', content: 'New faces. Real stories. Apply for creative projects in Tunisia in English, French or Arabic.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
function Index() {
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: string) => translate(language, key);
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.lang = language === 'ar' ? 'ar-TN' : language;
    document.documentElement.dir = direction;
  }, [language, direction]);
  return <main className="casting-page" lang={language} dir={direction}>
    <header className="site-header" dir="ltr">
      <a href="/" aria-label="MEGA CREATIVE"><img className="brand-logo" src={logo.url} alt="MEGA CREATIVE" width={500} height={500} /></a>
      <span className="header-location"><MapPin /> {t('تونس')} <span>/</span> {t('كاستينغ')}</span>
      <nav className="language-switcher" aria-label="Language">
        {(['en', 'fr', 'ar'] as const).map(lang => <Button key={lang} type="button" variant="ghost" className="language-button" aria-label={lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'} title={lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'} aria-pressed={language === lang} onClick={() => setLanguage(lang)}>
          {lang === 'en' ? <Globe2 /> : <img src={lang === 'fr' ? frenchFlag : tunisianFlag} alt="" width={22} height={15} />}<span>{lang.toUpperCase()}</span>
        </Button>)}
      </nav>
    </header>
    <section className="casting-hero">
      <img className="hero-image" src={studio} alt={t('وجوه جديدة في استوديو تصوير إعلاني')} width={1600} height={912} fetchPriority="high" /><div className="hero-shade" />
      <div className="hero-copy"><span className="casting-tag">{t('وجوه جديدة • فرص إبداعية')}</span><h1 dir="ltr">MEGA CREATIVE<span>CASTING</span></h1><p className="hero-lead">{t('خلّينا نتعرّفوا عليك.')}</p><p>{t('تحب تشارك في تصوير الإعلانات والمحتوى؟')}<br />{t('عمّر الاستمارة، وفريقنا يتّصل بيك بعد مراجعة ترشّحك.')}</p><Button asChild size="lg"><a href="#application">{t('نبدأ الترشّح')} <ArrowDown /></a></Button></div>
      <div className="hero-caption" dir="ltr"><span className="caption-line" /> {t('وجوه جديدة. حكايات حقيقية.')}</div>
    </section>
    <div className="category-band">{['تصوير إعلانات', 'صناعة محتوى', 'UGC ولايف ستايل', 'مواهب جديدة'].map(label => <span key={label}>{t(label)}</span>)}</div>
    <CastingForm language={language} />
    <footer className="site-footer"><span dir="ltr">© {new Date().getFullYear()} MEGA CREATIVE</span><span>{t('وجوه جديدة. حكايات حقيقية.')}</span><span>{t('تونس')} <ArrowUpRight /></span></footer>
  </main>;
}
