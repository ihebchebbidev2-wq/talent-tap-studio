import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/features/admin/users';
export const Route = createFileRoute('/admin/users')({ head: () => ({ meta: [
  { title: 'Administrateurs — MEGA CREATIVE' }, { name: 'description', content: 'Gestion privée des comptes et droits d’accès au casting.' }, { property: 'og:title', content: 'Administrateurs — MEGA CREATIVE' }, { property: 'og:description', content: 'Gestion privée des comptes et droits d’accès au casting.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, nofollow' },
] }), component: UsersPage });
