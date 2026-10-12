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
- Keep casting validation, photo preparation, presentation, and server submission in `src/features/casting` so public pages stay separate from intake logic.
- Validate casting fields with the shared Zod schema on both client and server to keep accepted submissions consistent.
- Store applications and photos privately through the write-only server intake; no anonymous read policies, so personal data stays out of public pages.
- Compress photos to JPEG in the browser before submission to reduce transfer size and strip image metadata.
- Keep brand styling in global semantic CSS tokens and button variants so visual changes stay consistent.

- Keep casting translations in a browser-safe localization module and switch presentation labels without changing validated submission values, so languages remain compatible with the existing intake.
