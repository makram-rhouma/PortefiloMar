# Meriem Jaballah — Portfolio & CMS

Repo: https://github.com/makram-rhouma/PortefiloMar · Production: https://mariem-jabalha.netlify.app

Multilingual (EN · FR · AR/RTL · TR) personal portfolio with an admin CMS at `/admin`.
Stack: React 19 + TypeScript + Vite + Tailwind CSS 4 + Framer Motion + Supabase (Auth, Postgres, Storage). Hosted on Netlify.
Technical base reused from Sarah Jaballah's portfolio; content, media, database and accounts are Meriem's own (Supabase project `hxoswnpscqpzjwqeyiox`).

## Install & run
```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

## Environment variables (set in `.env` locally and in Netlify → Environment variables; never commit values)
| Name | What |
|---|---|
| `VITE_SUPABASE_URL` | `https://hxoswnpscqpzjwqeyiox.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (public) key — Dashboard → Project Settings → API keys. Never a secret/service-role key |
| `VITE_PUBLIC_SITE_URL` | Production URL (canonical + QR default) |

## Scripts
| | |
|---|---|
| `npm run build` / `npm run typecheck` / `npm run lint` / `npm test` | production build, TypeScript, oxlint, Vitest |
| `node scripts/e2e.mjs <url> [shotsDir]` | Chrome end-to-end checks (320→1440 px, bottom dock, menu, EN/FR/AR/TR + RTL, gallery, lightbox, QR, form, `/admin`) |
| `node scripts/admin-shots.mjs <url> <dir>` | admin screenshots with a mocked, read-only session |
| `npm run seed` | regenerate `supabase/migrations/*_seed.sql` from `src/content/defaults.ts` |
| `bash scripts/mockup-visuals.sh` | rebuild `public/media/illus/` from the mockup (`../maquette portifilio.png`) with Real-ESRGAN ×4 |
| `node scripts/og-image.mjs` | regenerate the social preview image and touch icon |

## Database (Supabase project `hxoswnpscqpzjwqeyiox`)
Run in Dashboard → SQL Editor, in order (idempotent, never drops data):
1. `supabase/migrations/20261124000001_schema.sql` — tables `site_settings`, `portfolio_sections`, `content_drafts`, `experiences`, `services`, `certificates`, `education`, `skills`, `languages`, `social_links`, `media_assets`, `portfolio_items`, `contact_messages` (subject, read, archived), the `admins` role table + `is_admin()`, RLS and the `meriem-portfolio-media` bucket (public read, admin-only write, 50 MB, image/video/PDF allow-list).
2. `supabase/migrations/20261124000002_seed.sql` — CV content (insert-only).

Security: visitors read visible rows only and can only insert contact messages; every write is checked in the database by RLS (`is_admin()`), never by the frontend alone.

### Admin account
1. Dashboard → Authentication → Users → Add user (mariem.jabalha@gmail.com, a strong password, “Auto confirm user”). No user becomes admin automatically.
2. Run `supabase/admin_setup.sql` (admin email: mariem.jabalha@gmail.com): expect `is_admin = true`.
3. Optional: `supabase/admin_check.sql` (same email) — rolled-back RLS self-check, expect “All admin checks passed”.
4. Password recovery: “Forgot password?” on `/admin` sends a Supabase reset link (Authentication → URL Configuration must list the production URL).

## Media
- No original photo or video of Meriem was in the workspace. `public/media/illus/` holds 8 illustrative visuals extracted from the owner's mockup and upscaled ×4: AI-generated people, **not photos of Meriem**; the UI labels them “Illustration” (`is_illustration = true`). Replace them from the admin media library.
- Certificates: no document is invented. Real PDFs/images are uploaded per certificate from Admin → Certificates.
- Phone, email, WhatsApp and social links are not in the CV: they stay empty until set in Admin → Site settings / Social links.

## Deploy (Netlify project `mariem-jabalha`)
`netlify.toml`: build `npm run build`, publish `dist`, Node 22, SPA fallback (so `/admin` survives a refresh), cache headers. Deploys from the GitHub repo once linked (Project configuration → Build & deploy → Link repository).
