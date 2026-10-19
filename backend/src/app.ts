import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { ages, submissionSchema } from '../../src/features/casting/schema';
import { pool } from './db/pool';
import { hashToken, requireAdmin, sessionToken, verifyPassword } from './security';

export function createApp() {
  const app = express();
  const origins = (process.env['FRONTEND_ORIGINS'] ?? 'http://localhost:8080').split(',').map(v => v.trim());
  const production = process.env['NODE_ENV'] === 'production';
  const username = process.env['ADMIN_USERNAME'] ?? 'Mega';
  const passwordHash = process.env['ADMIN_PASSWORD_HASH'];
  if (!passwordHash) throw new Error('Set ADMIN_PASSWORD_HASH before starting the backend.');
  if (production && origins.some(origin => !origin.startsWith('https://'))) throw new Error('Production origins must use HTTPS.');
  if (process.env['TRUST_PROXY'] === '1') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  } as const;
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.headers.origin) {
      res.status(403).json({ error: 'Origine non autorisée.' }); return;
    }
    next();
  });
  app.use(express.json({ limit: '5mb' }));
  const cookie = { httpOnly: true, secure: production, sameSite: 'lax' as const, path: '/api', maxAge: 8 * 60 * 60 * 1000 };
  app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }); });
  app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }), (req, res) => {
    const parsed = z.object({ username: z.string().max(100), password: z.string().max(200) }).safeParse(req.body);
    if (!parsed.success || !verifyPassword(parsed.data.password, passwordHash) || parsed.data.username !== username) {
      res.status(401).json({ error: 'Identifiants incorrects.' }); return;
    }
    return (async () => {
      const token = randomBytes(32).toString('hex');
      await pool.query('DELETE FROM admin_sessions WHERE expires_at<=now()');
      await pool.query("INSERT INTO admin_sessions(token_hash, expires_at) VALUES ($1, now()+interval '8 hours')", [hashToken(token)]);
      res.cookie('mega_session', token, cookie).json({ username });
    })();
  });
  app.get('/api/auth/session', requireAdmin, (_req, res) => res.json({ username }));
  app.post('/api/auth/logout', requireAdmin, async (req, res) => {
    await pool.query('DELETE FROM admin_sessions WHERE token_hash=$1', [hashToken(sessionToken(req))]);
    res.clearCookie('mega_session', { ...cookie, maxAge: undefined }).json({ ok: true });
  });
  app.post('/api/applications', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Veuillez vérifier les informations et les photos.' }); return; }
    const data = parsed.data;
    let images: { image: Buffer; thumb: Buffer }[];
    try {
      images = await Promise.all(data.photos.map(async photo => {
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(photo.base64)) throw new Error('Invalid encoding');
        const buffer = Buffer.from(photo.base64, 'base64');
        if (buffer.length > 1048576 || buffer[0] !== 255 || buffer[1] !== 216) throw new Error('Invalid JPEG');
        const source = sharp(buffer, { limitInputPixels: 25_000_000 });
        const metadata = await source.metadata();
        if (metadata.format !== 'jpeg') throw new Error('Invalid format');
        const rotated = source.rotate();
        const [image, thumb] = await Promise.all([
          rotated.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer(),
          rotated.clone().resize(480, 600, { fit: 'cover', position: 'attention' }).jpeg({ quality: 72, mozjpeg: true }).toBuffer(),
        ]);
        return { image, thumb };
      }));
    } catch { res.status(400).json({ error: 'Une photo est invalide. Choisissez une autre image JPEG.' }); return; }
    const id = randomUUID(); const reference = id.replaceAll('-', '').slice(0, 12).toUpperCase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO applications(id,reference,full_name,phone,age_group,gender,city,instagram_url,facebook_url,tiktok_url,experience,interests,video_url,notes,consent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)', [id, reference, data.full_name, data.phone, data.age_group, data.gender, data.city, data.instagram_url, data.facebook_url, data.tiktok_url, data.experience, data.interests, data.video_url, data.notes, data.consent]);
      if (images.length) {
        const values = images.map((_, i) => `($${i * 5 + 1},$${i * 5 + 2},$${i * 5 + 3},$${i * 5 + 4},$${i * 5 + 5})`).join(',');
        await client.query(`INSERT INTO application_photos(id,application_id,position,image,thumb) VALUES ${values}`, images.flatMap((p, position) => [randomUUID(), id, position, p.image, p.thumb]));
      }
      await client.query('COMMIT'); res.status(201).json({ reference });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  });
  app.use('/api/admin', requireAdmin);
  app.get('/api/admin/stats', async (_req, res) => {
    const result = await pool.query("SELECT count(*)::int total, count(*) FILTER(WHERE status='new')::int new, count(*) FILTER(WHERE status='shortlisted')::int shortlisted, count(*) FILTER(WHERE created_at>=date_trunc('month',now()))::int AS \"month\" FROM applications");
    res.json(result.rows[0]);
  });
  app.get('/api/admin/applications', async (req, res) => {
    const parsed = z.object({
      q: z.string().trim().max(100).default(''),
      status: z.enum(['','new','reviewing','shortlisted','rejected']).default(''),
      age: z.enum(['', ...ages]).default(''),
      gender: z.enum(['', 'male', 'female']).default(''),
      city: z.string().trim().max(100).default(''),
      experience: z.enum(['', 'true', 'false']).default(''),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    }).safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: 'Filtres invalides.' }); return; }
    const { q, status, age, gender, city, experience, page } = parsed.data;
    const search = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const citySearch = `%${city.replace(/[\\%_]/g, '\\$&')}%`;
    const args = [search, status, age, gender, citySearch, experience === '' ? null : experience === 'true'];
    const where = "WHERE (a.full_name ILIKE $1 OR a.phone ILIKE $1 OR a.city ILIKE $1 OR a.reference ILIKE $1) AND ($2='' OR a.status=$2) AND ($3='' OR a.age_group=$3) AND ($4='' OR a.gender=$4) AND a.city ILIKE $5 AND ($6::boolean IS NULL OR a.experience=$6::boolean)";
    const [rows, count] = await Promise.all([
      pool.query(`SELECT a.id,a.reference,a.full_name,a.phone,a.city,a.age_group,a.gender,a.status,a.created_at, (SELECT p.id FROM application_photos p WHERE p.application_id=a.id ORDER BY p.position LIMIT 1) AS photo_id FROM applications a ${where} ORDER BY a.created_at DESC,a.id DESC LIMIT 20 OFFSET $7`, [...args, (page - 1) * 20]),
      pool.query(`SELECT count(*)::int total FROM applications a ${where}`, args),
    ]);
    res.json({ items: rows.rows, total: count.rows[0].total, page });
  });
  app.get('/api/admin/applications/:id', async (req, res) => {
    if (!z.string().uuid().safeParse(req.params['id']).success) { res.status(404).json({ error: 'Candidature introuvable.' }); return; }
    const result = await pool.query('SELECT * FROM applications WHERE id=$1', [req.params['id']]);
    if (!result.rowCount) { res.status(404).json({ error: 'Candidature introuvable.' }); return; }
    const photos = await pool.query('SELECT id,position FROM application_photos WHERE application_id=$1 ORDER BY position', [req.params['id']]);
    res.json({ ...result.rows[0], photos: photos.rows });
  });
  app.patch('/api/admin/applications/:id', async (req, res) => {
    const parsed = z.object({ status: z.enum(['new','reviewing','shortlisted','rejected']) }).safeParse(req.body);
    if (!parsed.success || !z.string().uuid().safeParse(req.params['id']).success) { res.status(400).json({ error: 'Statut invalide.' }); return; }
    const result = await pool.query('UPDATE applications SET status=$1 WHERE id=$2 RETURNING status', [parsed.data.status, req.params['id']]);
    if (!result.rowCount) { res.status(404).json({ error: 'Candidature introuvable.' }); return; }
    res.json(result.rows[0]);
  });
  app.get('/api/admin/photos/:id', async (req, res) => {
    if (!z.string().uuid().safeParse(req.params['id']).success) { res.sendStatus(404); return; }
    const thumb = req.query['size'] === 'thumb';
    const result = await pool.query(thumb ? 'SELECT COALESCE(thumb,image) AS image FROM application_photos WHERE id=$1' : 'SELECT image FROM application_photos WHERE id=$1', [req.params['id']]);
    if (!result.rowCount) { res.sendStatus(404); return; }
    // Photos never change once stored, so the browser may keep its private copy.
    res.set('Cache-Control', 'private, max-age=604800, immutable').type('image/jpeg').send(result.rows[0].image);
  });
  app.use((_req, res) => res.status(404).json({ error: 'Page introuvable.' }));
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Request failed:', error.name);
    const status = error.status && error.status < 500 ? error.status : 500;
    res.status(status).json({ error: status === 413 ? 'Les photos sont trop volumineuses.' : status === 429 ? 'Trop de tentatives. Réessayez plus tard.' : 'Le service est momentanément indisponible.' });
  });
  return app;
}