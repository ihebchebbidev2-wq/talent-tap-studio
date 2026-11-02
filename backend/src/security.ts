import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db/pool';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex || !/^[a-f0-9]{128}$/.test(hex)) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(expected, actual);
}
export function sessionToken(req: Request) {
  return req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('mega_session='))?.slice(13) ?? '';
}
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = sessionToken(req);
  if (!/^[a-f0-9]{64}$/.test(token)) { res.status(401).json({ error: 'Veuillez vous connecter.' }); return; }
  const result = await pool.query('SELECT u.id,u.username,r.role FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id JOIN admin_user_roles r ON r.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true', [hashToken(token)]);
  if (!result.rowCount) { res.status(401).json({ error: 'Votre session a expiré.' }); return; }
  res.locals['admin'] = result.rows[0];
  next();
}

export function requireFullAccess(_req: Request, res: Response, next: NextFunction) {
  if (res.locals['admin']?.role !== 'full') { res.status(403).json({ error: 'Votre compte dispose uniquement d’un accès en lecture.' }); return; }
  next();
}