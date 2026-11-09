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

## Project rules
- The panel has no database of its own: signed-in admins read/write through the bot's existing Express API (`/api/dashboard`, `/api/dashboard/guild-data`, Bearer Discord token) via server functions in `src/lib/minako/bot.functions.ts`; Discord OAuth runs on this site (`/auth/login`, `/auth/callback`) with the token sealed in an httpOnly cookie. Panel<->bot field conversion lives only in `src/lib/minako/bot-mapping.ts` (full panel config also sent as `panel`). Signed-out visitors get a localStorage demo. Why: the bot's Postgres is the single source of truth.
- Validation rules mirror the bot's limits and live only in `src/lib/minako/validation.ts`, covered by `src/test/minako-rules.test.ts`. Why: one source of truth for what the bot accepts.
- Sounds are synthesized with Web Audio in `src/lib/minako/sound.ts` (no audio files); music never auto-starts. Why: browser autoplay policies and zero external assets.
- Terms/Privacy texts are source files in `src/content/*.txt`, rendered via `parseLegal`; update the .txt to change the pages. Why: the owner edits them as plain text.
- Giveaway message blocks use the bot's four supported shapes; publishing and template saving require an advertised API V2 capability to avoid silently losing blocks. Markdown preview replaces custom emoji text nodes with Discord CDN images and preserves code literals.
- Navigation metadata (category, section titles, search keywords) lives in `src/components/minako/modules.ts`; SectionCard titles must match `sections` there so search/focus chips can jump to them. Collapse state and recents are per-browser (`src/lib/minako/sections.ts`). Why: one list drives sidebar, mobile tabs and search.
- `/` is a public landing page (outside AppShell, decided in `__root.tsx`); the admin panel lives under `/painel/*`, and legacy module URLs (`/semana`, `/sorteios`, …) are kept as 301 redirects. Why: separate public site from the panel without breaking saved links.
- Home-screen support uses only a public manifest and mascot icons linked from the root head; launch at `/painel` with root scope and no app-shell service worker. Why: installation must preserve Discord login and avoid offline or stale preview caches.
