# MEGA CREATIVE — Node.js API

Independent Node.js 22+ / Express / PostgreSQL service. It is not run by the Lovable app and does not use the previous Cloud database. Existing Cloud applications are not automatically migrated.

## Structure
`src/app.ts`: HTTP routes and validation; `src/security.ts`: authentication; `src/db`: PostgreSQL connection and migration runner; `migrations`: SQL; `scripts`: credential setup; `tests`: integration tests. Intake imports the shared schema from `../src/features/casting/schema.ts`; build from this repository, not from an isolated copy of the backend folder.

## Run
1. Create an empty PostgreSQL database with a dedicated application user.
2. From `backend`, run `bun install`, copy `.env.example` to `.env`, and set your private `DATABASE_URL`.
3. Run `node scripts/hash-password.mjs`, enter the requested admin password, and save the resulting hash as `ADMIN_PASSWORD_HASH`. Username defaults to the requested username. The password is never shipped to the browser or saved in source. Rotate the initially requested password before production: it was disclosed in chat.
4. Run `bun run migrate`, then `bun run dev`. For deployment: `bun run build`, then `bun run start`.
5. Set the frontend `VITE_BACKEND_URL` to the external backend origin (no `/api` suffix) and redeploy the frontend.

## Production
Use HTTPS and same-site addresses, e.g. a frontend and API on two subdomains of your own domain. Cookies are HttpOnly, Secure in production, SameSite=Lax, expire after eight hours, and session hashes live in PostgreSQL. Unrelated frontend/API domains will not work reliably with these cookies; configure same-site domains or a same-origin reverse proxy. Set `NODE_ENV=production`, `FRONTEND_ORIGINS` to exact HTTPS frontend origins, and `TRUST_PROXY=1` only when exactly one trusted reverse proxy precedes the API. No wildcard CORS. State-changing requests verify the Origin header. Rate limits are per process; run one instance or replace the store with a shared rate limiter before horizontal scaling.

All personal data and photos are private. JPEG bytes are validated, decoded, resized and metadata-stripped again on the server and saved transactionally in PostgreSQL. Back up the database with encryption and appropriate retention; photos increase database size. No public listing or photo endpoints exist.

## API
- `POST /api/applications`: validated form with 2–3 base64 JPEG photos; returns reference only.
- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- Admin-only: `GET /api/admin/stats`, `GET /api/admin/applications?q=&status=&page=`, `GET/PATCH /api/admin/applications/:id`, `GET /api/admin/photos/:id`.
- `GET /api/health`: database connectivity check.

## Tests
Set `DATABASE_URL` to a dedicated test database, `ADMIN_PASSWORD_HASH`, `TEST_ADMIN_PASSWORD` (the plain password matching that hash) and `FRONTEND_ORIGINS=http://localhost:8080`, run migrations, then `bun run test`. Tests insert and clean up their own records. Never use a production database for testing.