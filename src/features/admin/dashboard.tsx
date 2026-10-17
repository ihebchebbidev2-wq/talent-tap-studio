import { useEffect, useState } from 'react';
import { Users, Inbox, Star, CalendarDays, Search, ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/features/casting/api';
import { ages } from '@/features/casting/schema';
import { statuses, type ApplicationSummary } from './data';
import { SubmissionCard } from './submission-card';

const emptyFilters = { status: '', age: '', gender: '', experience: '' };
export function Dashboard() {
  const [stats, setStats] = useState<{ total: number; new: number; shortlisted: number; month: number }>();
  const [list, setList] = useState<{ items: ApplicationSummary[]; total: number }>();
  const [search, setSearch] = useState(''); const [city, setCity] = useState('');
  const [textFilters, setTextFilters] = useState({ q: '', city: '' });
  const [filters, setFilters] = useState(emptyFilters); const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(() => { setTextFilters({ q: search, city }); setPage(1); }, 300); return () => clearTimeout(timer); }, [search, city]);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([api<typeof stats>('/admin/stats'), api<{ items: ApplicationSummary[]; total: number }>(`/admin/applications?${new URLSearchParams({ ...textFilters, ...filters, page: String(page) })}`)])
      .then(([s, rows]) => { if (active) { setStats(s); setList(rows); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [textFilters, filters, page, refresh]);
  const activeFilters = !!(search || city || Object.values(filters).some(Boolean));
  function resetFilters() { setSearch(''); setCity(''); setTextFilters({ q: '', city: '' }); setFilters(emptyFilters); setPage(1); }
  function changeFilter(key: keyof typeof emptyFilters, value: string) { setFilters(v => ({ ...v, [key]: value })); setPage(1); }
  const metrics = [['Candidatures', stats?.total, Users], ['À examiner', stats?.new, Inbox], ['Présélectionnées', stats?.shortlisted, Star], ['Ce mois-ci', stats?.month, CalendarDays]] as const;
  return <>
    <div className="admin-title"><div><span className="eyebrow">VUE D’ENSEMBLE</span><h1>Les prochains visages de MEGA.</h1><p>Vos candidatures, réunies au même endroit.</p></div><Button variant="outline" onClick={() => setRefresh(v => v + 1)} disabled={loading} title="Rafraîchir les données"><RefreshCw />Rafraîchir</Button></div>
    <div className="kpi-grid">{metrics.map(([label, value, Icon]) => <div className="kpi" key={label}><Icon /><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div>
    <section className="admin-submissions" aria-label="Candidatures">
      <div className="submissions-heading"><h2>Candidatures <span>{loading ? '—' : list?.total ?? '—'}</span></h2><label className="search-field"><Search /><input aria-label="Rechercher une candidature" placeholder="Nom, téléphone, référence…" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      <div className="admin-filters">
        <label>Tranche d’âge<select aria-label="Tranche d’âge" value={filters.age} onChange={e => changeFilter('age', e.target.value)}><option value="">Tous les âges</option>{ages.map(age => <option key={age} value={age}>{age} ans</option>)}</select></label>
        <label>Genre<select aria-label="Genre" value={filters.gender} onChange={e => changeFilter('gender', e.target.value)}><option value="">Tous les genres</option><option value="female">Femme</option><option value="male">Homme</option></select></label>
        <label>Ville / région<input aria-label="Ville / région" placeholder="Toutes les villes" value={city} maxLength={100} onChange={e => setCity(e.target.value)} /></label>
        <label>Statut<select aria-label="Statut" value={filters.status} onChange={e => changeFilter('status', e.target.value)}><option value="">Tous les statuts</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Expérience<select aria-label="Expérience" value={filters.experience} onChange={e => changeFilter('experience', e.target.value)}><option value="">Toutes les expériences</option><option value="true">Avec expérience</option><option value="false">Sans expérience</option></select></label>
        <Button variant="ghost" size="icon" title="Réinitialiser les filtres" aria-label="Réinitialiser les filtres" disabled={!activeFilters} onClick={resetFilters}><RotateCcw /></Button>
      </div>
      {error ? <div className="admin-empty" role="alert"><p>{error}</p><Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Réessayer</Button></div> : loading ? <div className="admin-empty" role="status">Chargement des candidatures…</div> : !list?.items.length ? <div className="admin-empty"><Inbox /><h3>{activeFilters ? 'Aucun résultat' : 'Aucune candidature pour le moment'}</h3><p>{activeFilters ? 'Aucune candidature ne correspond à ces critères.' : 'Les nouvelles candidatures apparaîtront ici.'}</p>{activeFilters && <Button variant="outline" onClick={resetFilters}><RotateCcw />Réinitialiser les filtres</Button>}</div> : <div className="submission-grid">{list.items.map(item => <SubmissionCard key={item.id} item={item} />)}</div>}
      <div className="pagination"><span>{loading ? '—' : list?.total ?? 0} candidature(s) · Page {page} / {Math.max(1, Math.ceil((list?.total ?? 0) / 20))}</span><div><Button variant="outline" size="icon" title="Page précédente" aria-label="Page précédente" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon" title="Page suivante" aria-label="Page suivante" disabled={page * 20 >= (list?.total ?? 0) || loading} onClick={() => setPage(v => v + 1)}><ChevronRight /></Button></div></div>
    </section>
  </>;
}
