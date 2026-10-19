import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './pool';
try {
  for (const file of ['001_initial.sql', '002_thumbnails.sql', '003_social_links.sql']) {
    await pool.query(await readFile(new URL(`../../migrations/${file}`, import.meta.url), 'utf8'));
  }
  console.info('Database ready.');
} finally { await pool.end(); }
