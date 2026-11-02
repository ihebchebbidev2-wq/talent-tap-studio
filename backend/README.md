# MEGA CREATIVE — Node.js API

Independent Node.js 22+ / Express / PostgreSQL service. It is not run by the Lovable app and does not use the previous Cloud database. Existing Cloud applications are not automatically migrated.

## Structure
`src/app.ts`: HTTP routes and validation; `src/security.ts`: authentication; `src/db`: PostgreSQL connection and migration runner; `migrations`: SQL; `scripts`: credential setup; `tests`: integration tests. Intake imports the shared schema from `../src/features/casting/schema.ts`; build from this repository, not from an isolated copy of the backend folder.

## Run
1. Create an empty PostgreSQL database with a dedicated application user.
2. From `backend`, run `npm install`, copy `.env.example` to `.env`, and set your private `DATABASE_URL`.
3. Run `node scripts/hash-password.mjs`, enter the requested admin password, and save the resulting hash as `ADMIN_PASSWORD_HASH`. Username defaults to the requested username. The password is never shipped to the browser or saved in source. Rotate the initially requested password before production: it was disclosed in chat.
4. Run `npm run migrate`, then `npm run dev`. For deployment: `npm run build`, then `npm run start`.
5. Set the frontend `VITE_BACKEND_URL` to the external backend origin (no `/api` suffix) and redeploy the frontend.

## Production
Use HTTPS and same-site addresses, e.g. a frontend and API on two subdomains of your own domain. Cookies are HttpOnly, Secure in production, SameSite=Lax, expire after eight hours, and session hashes live in PostgreSQL. Unrelated frontend/API domains will not work reliably with these cookies; configure same-site domains or a same-origin reverse proxy. Set `NODE_ENV=production`, `FRONTEND_ORIGINS` to exact HTTPS frontend origins, and `TRUST_PROXY=1` only when exactly one trusted reverse proxy precedes the API. No wildcard CORS. State-changing requests verify the Origin header. Rate limits are per process; run one instance or replace the store with a shared rate limiter before horizontal scaling.

All personal data and photos are private. JPEG bytes are validated, decoded, resized and metadata-stripped again on the server and saved transactionally in PostgreSQL. Back up the database with encryption and appropriate retention; photos increase database size. No public listing or photo endpoints exist.

## API
- `POST /api/applications`: validated form with 2–3 base64 JPEG photos; returns reference only.
- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- Admin-only: `GET /api/admin/stats`, `GET /api/admin/applications?q=&status=&page=`, `GET/PATCH /api/admin/applications/:id`, `GET /api/admin/photos/:id`.
- `GET /api/health`: database connectivity check.

## Administrator and tracking upgrade
Deploy the updated API and run `npm run migrate` before deploying this frontend. Migration 004 creates individual accounts, separate roles, user-linked sessions, Pixel settings, and advertising-choice evidence. Existing environment credentials initialize the first full-access account only when the accounts table is empty; later migrations never replace its password. Legacy sessions are invalidated: sign in again. Database and photo backups remain your responsibility.

The admin interface now provides `/admin/users` (create accounts, change access, disable accounts, reset passwords) and `/admin/settings` (numeric Pixel ID and enable switch). View-only users can read applications and photos but cannot change status, delete entries, manage accounts or configure tracking. API checks enforce these rules independently of the UI. Disabling, changing roles, or resetting passwords revokes that account’s sessions. Your own full-access account cannot be demoted/disabled; the last active full-access account is protected transactionally.

`DELETE /api/admin/applications/:id` permanently deletes the entry and cascades to all photos/thumbnails. It cannot recall previously downloaded images or retained backups. Photos now use `Cache-Control: no-store`.

`GET /api/tracking/settings` exposes only the public Pixel ID and enabled flag. `POST /api/tracking/consent` records a random visitor ID, advertising acceptance/refusal, region, timestamp and notice version. Notice `2026-11-02` resolves to the privacy page and cookie-choice notice in this release: Meta receives browser/IP/page/cookie data for completed-application measurement and ad optimization, never form fields/photos; accept/reject are equally available, and Cookie settings permit withdrawal. Preserve historical notice text with deployment releases. Do not delete acceptance evidence when recording later withdrawals.

The browser reports `CompleteRegistration` after a saved candidature reaches `/casting/success`, using an independent opaque event ID. No PageView, advanced matching or server uploads are installed. Consent-region and unknown-region visitors remain blocked until recorded acceptance; explicit refusals apply everywhere. Admin pages never initialize the Pixel. Do not configure automatic advanced matching or automatic form/event collection in Meta. Check dataset restrictions and Test Events in Events Manager, accept Business Tools Terms, and confirm the live domain’s traffic permissions before enabling ads. A saved Pixel setting and queued browser event are not proof of Meta receipt or attribution.

Production requires frontend/API addresses on the same site (or a same-origin proxy) for the existing SameSite=Lax cookie. Set every authorized frontend origin explicitly in `FRONTEND_ORIGINS`; unapproved mutation origins are rejected. Configure the production frontend URL before verification. The separately hosted API is not deployed automatically with the Lovable frontend.

## Tests
Set `DATABASE_URL` to a dedicated test database, `ADMIN_PASSWORD_HASH`, `TEST_ADMIN_PASSWORD` (the plain password matching that hash) and `FRONTEND_ORIGINS=http://localhost:8080`, run migrations, then `npm run test`. Tests insert and clean up their own records. Never use a production database for testing.
## Social-link upgrade
Run migrations before deploying the updated API/frontend: `003_social_links.sql` adds separate optional `instagram_url`, `facebook_url`, and `tiktok_url` fields and backfills matching historical links. Other legacy social links remain available in admin details. New submissions use only the three platform-specific fields, each validated by the shared schema.
