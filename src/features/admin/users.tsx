import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/features/casting/api';
import { useAdminSession } from './session';
interface AdminUser { id: string; username: string; role: 'viewer' | 'full'; active: boolean }
function UserRow({ user, refresh }: { user: AdminUser; refresh: () => void }) {
  const session = useAdminSession(); const [role, setRole] = useState(user.role); const [active, setActive] = useState(user.active); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await api(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role, active, ...(password ? { password } : {}) }) }); setPassword(''); setMessage('Compte mis à jour.'); refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Mise à jour impossible.'); } finally { setBusy(false); }
  }
  return <form className="admin-user-row" onSubmit={save}><div><strong>{user.username}</strong>{session?.id === user.id && <small>Votre compte</small>}</div><label>Accès<select aria-label={`Accès de ${user.username}`} value={role} disabled={busy || session?.id === user.id} onChange={e => setRole(e.target.value as AdminUser['role'])}><option value="viewer">Lecture seule</option><option value="full">Accès complet</option></select></label><label className="consent-label"><input type="checkbox" aria-label={`Compte actif ${user.username}`} checked={active} disabled={busy || session?.id === user.id} onChange={e => setActive(e.target.checked)} /><span>Actif</span></label><label>Nouveau mot de passe<input aria-label={`Nouveau mot de passe ${user.username}`} type="password" autoComplete="new-password" minLength={12} maxLength={200} value={password} placeholder="Inchangé" onChange={e => setPassword(e.target.value)} /></label><Button type="submit" variant="outline" disabled={busy} title={`Enregistrer ${user.username}`}><Save />Enregistrer</Button>{message && <p role="status" className="user-message">{message}</p>}</form>;
}
export function UsersPage() {
  const session = useAdminSession(); const [items, setItems] = useState<AdminUser[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [version, setVersion] = useState(0);
  useEffect(() => { if (session?.role !== 'full') return; let active = true; api<{ items: AdminUser[] }>('/admin/users').then(data => { if (active) setItems(data.items); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [session?.role, version]);
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try { await api('/admin/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) }); form.reset(); setVersion(v => v + 1); }
    catch (err) { setError(err instanceof Error ? err.message : 'Création impossible.'); } finally { setBusy(false); }
  }
  if (session?.role !== 'full') return <div className="admin-empty" role="alert">Cette page est réservée aux comptes avec accès complet.</div>;
  return <><div className="admin-title"><div><span className="eyebrow">ÉQUIPE</span><h1>Administrateurs</h1><p>Comptes et droits d’accès.</p></div><Button variant="outline" onClick={() => setVersion(v => v + 1)}><RefreshCw />Rafraîchir</Button></div>{error && <p role="alert" className="field-error">{error}</p>}<section className="admin-settings-section"><h2>Ajouter un administrateur</h2><form className="admin-user-create" onSubmit={add}><div className="form-field"><label htmlFor="new-user">Identifiant</label><input id="new-user" name="username" required minLength={2} maxLength={60} pattern="[a-zA-Z0-9_.\-]+" autoComplete="off" /></div><div className="form-field"><label htmlFor="new-password">Mot de passe</label><input id="new-password" name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" /></div><div className="form-field"><label htmlFor="new-role">Accès</label><select id="new-role" name="role" defaultValue="viewer"><option value="viewer">Lecture seule</option><option value="full">Accès complet</option></select></div><Button type="submit" disabled={busy}><UserPlus />{busy ? 'Création…' : 'Ajouter'}</Button></form></section><section className="admin-settings-section"><h2>Comptes existants</h2>{items.map(user => <UserRow key={`${user.id}-${user.role}-${user.active}`} user={user} refresh={() => setVersion(v => v + 1)} />)}{!items.length && <p>Chargement des comptes…</p>}</section></>;
}
