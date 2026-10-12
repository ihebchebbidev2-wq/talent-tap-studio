import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/features/admin/dashboard';
export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [
    { title: 'Candidatures et suivi — MEGA CREATIVE' },
    { name: 'description', content: 'Suivi privé des candidatures, indicateurs et présélections MEGA CREATIVE.' },
    { property: 'og:title', content: 'Suivi casting — MEGA CREATIVE' },
    { property: 'og:description', content: 'Gestion privée des candidatures et présélections.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }), component: Dashboard,
});