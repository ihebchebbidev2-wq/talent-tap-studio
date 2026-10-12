import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/features/admin/admin-layout';
export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Administration casting — MEGA CREATIVE' },
    { name: 'description', content: 'Espace privé de gestion des candidatures MEGA CREATIVE.' },
    { property: 'og:title', content: 'Administration — MEGA CREATIVE' },
    { property: 'og:description', content: 'Espace privé de l’équipe casting.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: () => <AdminLayout><Outlet /></AdminLayout>,
});