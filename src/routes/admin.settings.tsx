import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/features/admin/settings';
export const Route = createFileRoute('/admin/settings')({ head: () => ({ meta: [
  { title: 'Configuration Pixel — MEGA CREATIVE' }, { name: 'description', content: 'Configuration privée de la mesure publicitaire du casting.' }, { property: 'og:title', content: 'Configuration Pixel — MEGA CREATIVE' }, { property: 'og:description', content: 'Configuration privée de la mesure publicitaire du casting.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, nofollow' },
] }), component: SettingsPage });
