import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { LogOut, LockKeyhole, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/mega-creative-logo.webp';
import { api, backendUrl } from '@/features/casting/api';
import { AdminSessionContext, type AdminSession } from './session';
import { useQueryClient } from '@tanstack/react-query';

export function AdminLayout({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    document.documentElement.lang = 'fr'; document.documentElement.dir = 'ltr';
    window.fbq?.('consent', 'revoke');
    api<AdminSession>('/auth/session').then(value => { setSession(value); setState('ready'); }).catch(() => setState('login'));
    const expired = () => { setSession(null); setState('login'); queryClient.clear(); };
    window.addEventListener('mega-session-expired', expired);
    return () => window.removeEventListener('mega-session-expired', expired);
  }, [queryClient]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { const value = await api<AdminSession>('/auth/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) }); setSession(value); setState('ready'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Connexion impossible.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await queryClient.cancelQueries(); queryClient.clear(); await api('/auth/logout', { method: 'POST' }); setSession(null); setState('login'); }
    catch { setError('Déconnexion impossible. Veuillez réessayer.'); }
    finally { setBusy(false); }
  }
  return <main className="admin-page" lang="fr" dir="ltr"><header className="admin-header"><Link to="/" aria-label="MEGA CREATIVE"><img src={logo} alt="MEGA CREATIVE" /></Link><span>Espace casting <b>{session ? `${session.username} · ${session.role === 'full' ? 'Accès complet' : 'Lecture seule'}` : 'Administration'}</b></span>{state === 'ready' && <Button variant="outline" disabled={busy} onClick={logout}><LogOut />Déconnexion</Button>}</header>{state === 'ready' && <nav className="admin-nav" aria-label="Administration"><Button asChild variant="ghost"><Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: 'active' }}>Candidatures</Link></Button>{session?.role === 'full' && <><Button asChild variant="ghost"><Link to="/admin/users" activeProps={{ className: 'active' }}>Administrateurs</Link></Button><Button asChild variant="ghost"><Link to="/admin/settings" activeProps={{ className: 'active' }}>Pixel Meta</Link></Button></>}</nav>}
    {state === 'loading' ? <div className="admin-loading" role="status">Chargement de votre espace…</div> : state === 'login' ? <section className="admin-login"><span className="admin-lock"><LockKeyhole /></span><span className="eyebrow">MEGA CREATIVE</span><h1>Bienvenue dans votre espace.</h1><p>Connectez-vous pour consulter les candidatures.</p><form onSubmit={login}><div className="form-field"><label htmlFor="admin-user">Nom d’utilisateur</label><input id="admin-user" name="username" required autoComplete="username" maxLength={100} /></div><div className="form-field"><label htmlFor="admin-pass">Mot de passe</label><div className="password-field"><input id="admin-pass" name="password" required type={visible ? 'text' : 'password'} autoComplete="current-password" maxLength={200} /><Button type="button" variant="ghost" size="icon" onClick={() => setVisible(!visible)} title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{visible ? <EyeOff /> : <Eye />}</Button></div></div>{!backendUrl && <p className="admin-notice">La connexion sera disponible une fois le serveur configuré.</p>}{error && <p className="field-error" role="alert">{error}</p>}<Button className="admin-login-submit" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button></form><Button asChild variant="link"><Link to="/"><ArrowLeft />Retour au casting</Link></Button></section> : <AdminSessionContext.Provider value={session}><div className="admin-content">{error && <p className="field-error" role="alert">{error}</p>}{children}</div></AdminSessionContext.Provider>}
  </main>;
}