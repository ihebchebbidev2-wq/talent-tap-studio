import 'dotenv/config';
import { createApp } from './app';
import { pool } from './db/pool';
const port = Number(process.env['PORT'] ?? 3001);
await pool.query('SELECT 1');
const server = createApp().listen(port, () => console.info(`Backend listening on port ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => { void pool.end().then(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10000).unref();
});