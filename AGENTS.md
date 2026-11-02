<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep casting validation and photo presentation in `src/features/casting`; the standalone `backend` imports the same schema so client and Node intake accept identical fields.
- Validate casting fields with the shared Zod schema on both client and server to keep accepted submissions consistent.
- Store applications and photos privately through the write-only server intake; no anonymous read policies, so personal data stays out of public pages.
- Compress photos to JPEG in the browser before submission to reduce transfer size and strip image metadata.
- Keep brand styling in global semantic CSS tokens and button variants so visual changes stay consistent.
- Import the shared brand logo as a bundled asset in public and admin headers so its display does not depend on CDN asset delivery.

- Keep casting translations in a browser-safe localization module and switch presentation labels without changing validated submission values, so languages remain compatible with the existing intake.
- Deploy `backend` separately as Node.js with PostgreSQL; frontend REST calls use `VITE_BACKEND_URL` and never fall back to Cloud intake, so deployment boundaries stay explicit.
- Verify database-backed individual admin credentials only in Node.js using password hashes and user-linked opaque HttpOnly sessions; read current separate-table roles on every admin request so disabled/restricted users cannot bypass UI controls.
- Filter and paginate admin submissions in PostgreSQL and return only a protected first-photo identifier with each summary, so cards stay lightweight and private.
- Store a small thumbnail beside each applicant photo and serve photos with no-store caching so disabled sessions/deleted entries cannot remain accessible through the browser cache.

- Store separate platform-specific social URLs; retain legacy social_url only for historical data so upgrades preserve existing applicants.
- Keep advertising consent and Meta browser reporting in a browser-safe tracking module; require region/choice permission, durable acceptance evidence, public-route allowlisting and opaque completion IDs without applicant data.
- Keep success receipts in session storage with a bounded lifetime and no applicant identifiers in URLs; only successful intake creates a receipt, never direct success-page visits.
- Keep account and Pixel configuration APIs in a focused Node router with full-access authorization; migrate the environment admin once without replacing established database passwords.
