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
  const result = await pool.query('SELECT 1 FROM admin_sessions WHERE token_hash=$1 AND expires_at>now()', [hashToken(token)]);
  if (!result.rowCount) { res.status(401).json({ error: 'Votre session a expiré.' }); return; }
  next();
}