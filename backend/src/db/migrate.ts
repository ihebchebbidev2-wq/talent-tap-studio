import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './pool';
try {
  await pool.query(await readFile(new URL('../../migrations/001_initial.sql', import.meta.url), 'utf8'));
  console.info('Database ready.');
} finally { await pool.end(); }