import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pool } from './pool';
try {
  for (const file of ['001_initial.sql', '002_thumbnails.sql', '003_social_links.sql', '004_admin_users_tracking.sql', '005_visitor_tracking.sql']) {
    await pool.query(await readFile(new URL(`../../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const hash = process.env['ADMIN_PASSWORD_HASH'];
  if (!(await pool.query('SELECT 1 FROM admin_users LIMIT 1')).rowCount) {
    if (!hash || !/^[a-f0-9]+:[a-f0-9]{128}$/.test(hash)) throw new Error('Set a valid ADMIN_PASSWORD_HASH to initialize the first administrator.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('LOCK TABLE admin_users IN SHARE ROW EXCLUSIVE MODE');
      if (!(await client.query('SELECT 1 FROM admin_users LIMIT 1')).rowCount) {
        const id = randomUUID();
        await client.query('INSERT INTO admin_users(id,username,password_hash) VALUES ($1,$2,$3)', [id, (process.env['ADMIN_USERNAME'] ?? 'Mega').trim().toLowerCase(), hash]);
        await client.query("INSERT INTO admin_user_roles(user_id,role) VALUES ($1,'full')", [id]);
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  console.info('Database ready.');
} finally { await pool.end(); }
