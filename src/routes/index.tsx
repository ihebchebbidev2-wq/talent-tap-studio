import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';
import logo from '@/assets/mega-creative-logo.png.asset.json';
import studio from '@/assets/casting-studio.jpg';
import { CastingForm } from '@/features/casting/casting-form';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'MEGA CREATIVE — Casting Tunisia | ترشّح معانا' },
    { name: 'description', content: 'تحب تشارك في تصوير الإعلانات والمحتوى؟ ترشّح مع MEGA CREATIVE في تونس وشارك صورك وتجربتك.' },
    { property: 'og:title', content: 'MEGA CREATIVE — خلّينا نتعرّفوا عليك' },
    { property: 'og:description', content: 'وجوه جديدة، فرص إبداعية. ترشّح لتصوير الإعلانات والمحتوى في تونس.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
function Index() {
  return <main className="casting-page">
    <header className="site-header"><a href="/" aria-label="MEGA CREATIVE"><img className="brand-logo" src={logo.url} alt="MEGA CREATIVE" width={500} height={500} /></a><span className="header-location"><MapPin /> TUNISIA <span>/</span> CASTING</span><Button variant="outline" asChild><a href="#application">ترشّح معانا <ArrowUpRight /></a></Button></header>
    <section className="casting-hero"><img className="hero-image" src={studio} alt="وجوه جديدة في استوديو تصوير إعلاني" width={1600} height={912} fetchPriority="high" /><div className="hero-shade" /><div className="hero-copy" dir="rtl"><span className="casting-tag"><span /> وجوه جديدة • فرص إبداعية</span><span className="hero-brand" dir="ltr">MEGA CREATIVE CASTING</span><h1>خلّينا<br />نتعرّفوا <span>عليك.</span></h1><p>تحب تشارك في تصوير الإعلانات والمحتوى؟<br />عمّر الاستمارة، وفريقنا يتّصل بيك بعد مراجعة ترشّحك.</p><Button asChild size="lg"><a href="#application">نبدأ الترشّح <ArrowDown /></a></Button></div><div className="hero-caption"><span className="caption-line" /> NEW FACES. REAL STORIES.</div><div className="hero-index" dir="ltr">CASTING CALL <span>—</span> 01</div></section>
    <div className="category-band"><span>ADVERTISING</span><span className="band-star">✳</span><span>CONTENT CREATION</span><span className="band-star">✳</span><span>UGC & LIFESTYLE</span><span className="band-star">✳</span><span>NEW TALENT</span></div>
    <CastingForm />
    <footer className="site-footer"><span>© {new Date().getFullYear()} MEGA CREATIVE</span><span dir="rtl">وجوه جديدة. حكايات حقيقية.</span><span>TUNISIA <ArrowUpRight /></span></footer>
  </main>;
}
