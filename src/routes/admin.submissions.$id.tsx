import { createFileRoute } from '@tanstack/react-router';
import { Detail } from '@/features/admin/detail';
export const Route = createFileRoute('/admin/submissions/$id')({
  head: () => ({ meta: [
    { title: 'Détail de candidature — MEGA CREATIVE' },
    { name: 'description', content: 'Consultation privée du profil et des photos d’une candidature MEGA CREATIVE.' },
    { property: 'og:title', content: 'Profil casting — MEGA CREATIVE' },
    { property: 'og:description', content: 'Informations et photos privées du candidat.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }), component: DetailPage,
});
function DetailPage() { const { id } = Route.useParams(); return <Detail id={id} />; }