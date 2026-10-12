import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Inbox, Star, CalendarDays, Search, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/features/casting/api';
import { statuses, date, type Application } from './data';

export function Dashboard() {
  const [stats, setStats] = useState<{ total: number; new: number; shortlisted: number; month: number }>();
  const [list, setList] = useState<{ items: Application[]; total: number }>();
  const [search, setSearch] = useState(''); const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([api<typeof stats>('/admin/stats'), api<{ items: Application[]; total: number }>(`/admin/applications?${new URLSearchParams({ q, status, page: String(page) })}`)])
      .then(([s, rows]) => { if (active) { setStats(s); setList(rows); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, status, page, refresh]);
  const metrics = [['Candidatures', stats?.total, Users], ['À examiner', stats?.new, Inbox], ['Présélectionnées', stats?.shortlisted, Star], ['Ce mois-ci', stats?.month, CalendarDays]] as const;
  return <><div className="admin-title"><div><span className="eyebrow">VUE D’ENSEMBLE</span><h1>Les prochains visages de MEGA.</h1><p>Vos candidatures, réunies au même endroit.</p></div><Button variant="outline" onClick={() => setRefresh(v => v + 1)} disabled={loading}><RefreshCw />Actualiser</Button></div><div className="kpi-grid">{metrics.map(([label, value, Icon]) => <div className="kpi" key={label}><Icon /><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div>
    <section className="admin-submissions"><div className="submissions-heading"><h2>Candidatures <span>{list?.total ?? '—'}</span></h2><div className="admin-filters"><label className="search-field"><Search /><input aria-label="Rechercher une candidature" placeholder="Nom, ville, téléphone…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filtrer par statut" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tous les statuts</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
    {error ? <div className="admin-empty" role="alert"><p>{error}</p><Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Réessayer</Button></div> : loading ? <div className="admin-empty" role="status">Chargement des candidatures…</div> : !list?.items.length ? <div className="admin-empty"><Inbox /><h3>{q || status ? 'Aucun résultat' : 'Aucune candidature pour le moment'}</h3><p>{q || status ? 'Essayez un autre nom ou un autre statut.' : 'Les nouvelles candidatures apparaîtront ici.'}</p></div> : <div className="table-scroll"><table className="submissions-table"><thead><tr><th>Candidat·e</th><th>Ville</th><th>Âge</th><th>Reçue le</th><th>Statut</th><th><span className="sr-only">Consulter</span></th></tr></thead><tbody>{list.items.map(item => <tr key={item.id}><td><Link to="/admin/submissions/$id" params={{ id: item.id }} className="applicant-name">{item.full_name}</Link><small>{item.phone}</small></td><td>{item.city}</td><td>{item.age_group}</td><td>{date(item.created_at)}</td><td><span className={`status-badge status-${item.status}`}>{statuses[item.status]}</span></td><td><Button asChild variant="ghost" size="icon"><Link to="/admin/submissions/$id" params={{ id: item.id }} aria-label={`Consulter ${item.full_name}`} title={`Consulter ${item.full_name}`}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table></div>}
    <div className="pagination"><span>{list?.total ?? 0} candidature(s) · Page {page} / {Math.max(1, Math.ceil((list?.total ?? 0) / 20))}</span><div><Button variant="outline" size="icon" title="Page précédente" aria-label="Page précédente" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon" title="Page suivante" aria-label="Page suivante" disabled={page * 20 >= (list?.total ?? 0) || loading} onClick={() => setPage(v => v + 1)}><ChevronRight /></Button></div></div></section></>;
}