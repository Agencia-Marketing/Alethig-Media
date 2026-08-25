# AGENTS — Alethig Media

## Project Overview

Marketing site for **Alethig Media**, a digital-marketing agency in Long
Island, NY (Amityville — Nassau + Suffolk counties). Bilingual service
(English/Spanish), but the site itself is Spanish-only content — there is
no English route or language switcher. Navy & gold glassmorphism design.
Built with Astro 5 (server output) + Tailwind CSS v3, deployed to
Cloudflare Workers via `@astrojs/cloudflare`. Content is edited through
Decap CMS at `/admin` — see [`README.md`](README.md) for the fuller
project write-up; this file is the quick-reference for making code
changes correctly.

There is no `html/` standalone variant and no other template lineage —
this is the only version of the site.

## Critical Conventions

- **Single source of brand truth**: all colors, fonts, and the logo live
  in [`src/config/theme.mjs`](src/config/theme.mjs) — nowhere else.
  Changing brand values there flows automatically into Tailwind
  (`tailwind.config.mjs` imports it), the CSS custom properties injected
  by [`src/layouts/Layout.astro`](src/layouts/Layout.astro), and the
  Google Fonts `<link>`. **Do not hardcode colors/fonts in markup or
  `global.css`** — use the Tailwind classes (`bg-bg-void`, `text-accent`,
  `font-display`, etc.) or the CSS vars they resolve to.
- **Tailwind is v3**, not v4 — `@tailwind base/components/utilities`
  directives in `global.css`, JS config file, no CSS-first config.
- **Content is CMS-driven JSON**, not hardcoded copy, wherever a Decap
  field exists for it: `src/content/settings/site.json` (brand, nav,
  footer, WhatsApp, social), `src/content/pages/*.json` (home, about,
  contact, gracias), `src/content/services/*.json` (5 services, schema in
  `src/content.config.ts`). The field list an editor sees in `/admin` is
  defined in `public/admin/config.yml` and must stay in sync with what
  each `.astro` page actually reads — a JSON field with no matching
  `config.yml` entry can't be edited without a git change; a
  `config.yml` entry with no matching template usage (this happened once
  with `about.json`'s `team[].img`) silently does nothing.
- **`astro preview` does not work with the Cloudflare adapter** — it
  errors immediately. To run the actual production build locally, use
  `npx wrangler dev` against `dist/` (after `npm run build`), not
  `npm run preview`.
- **`npm run build` (and `npm run dev`) auto-regenerate responsive
  images** via `prebuild`/`predev` npm hooks — see the Images section
  below. If you ever invoke `astro build`/`astro dev` directly instead
  of through npm, that step is skipped and images just render without
  `srcset` (safe fallback, not a broken build).
- **`/_image` is deliberately blocked** by `src/middleware.ts` — see
  Security below. Don't remove that middleware to "fix" image handling;
  the actual image pipeline (see Images) is build-time only and doesn't
  need that endpoint.
- **`backdrop-filter` should be paired with `-webkit-backdrop-filter`**
  for Safari — `.glass` in `global.css` does this correctly; `.btn-cyber`
  and `.input-cyber` currently don't. Match the `.glass` pattern in any
  new code; fixing the two existing gaps is a small standalone cleanup,
  not something to do incidentally while touching unrelated code.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Regenerate responsive images, then start Astro dev server at `localhost:4321` |
| `npm run build` | Regenerate responsive images, then build to `dist/` |
| `npx wrangler dev` (after build) | Serve the real `dist/` build the way Cloudflare will — use this instead of `npm run preview` |
| `npm run images:responsive` | Manually (re)run the responsive-image generator without a full build |
| `npm run cms` | Local Decap CMS proxy (`decap-server`) for editing at `/admin` without the OAuth worker |

## Design System — `src/config/theme.mjs`

Current values (navy & gold, per the brand identity manual):

- `bg-void: #000326` — page background
- `bg-depth: #060A33` — elevated/alternating section background
- `accent: #D8A62A` — gold (primary interactive)
- `accent-2: #E9C46A` — light gold (gradients/hover)
- `text-primary: #F5F1E6` — warm off-white
- `text-secondary: #A7AEC9` — legible blue-gray, ~9:1 contrast
- `text-dim: #737CAC` — dimmest tier, still WCAG AA (≥4.5:1) on both
  backgrounds at normal text sizes — don't darken this without
  re-checking contrast (footer copyright, footer links, `/contacto`
  micro-labels, and every form placeholder all use it)
- `grad-indigo` / `grad-violet` / `grad-pink` — mesh-gradient accents

Derived values (accent RGB, glow shadows, glass border tints) are
computed at runtime in `Layout.astro` from the hex values above — never
hardcode a derived rgba() elsewhere.

### Typography

- **Display/headings**: Nord (self-hosted via `@font-face` in
  `global.css`, files in `public/fonts/`) — weights 400/500/700/800
- **Body**: Montserrat (Google Fonts) — weights 400–800
- **Icons**: Material Symbols Outlined (Google Fonts, ligature-based —
  see Accessibility below for why every icon span needs `aria-hidden`)

Never substitute a different display/body font pairing without updating
`theme.mjs` — don't hardcode a font-family in a component.

### Rebranding flow

Change brand colors/fonts/logo in **one place**: `src/config/theme.mjs`.
That's it — no second file to touch (unlike some older Astro/Tailwind
templates that duplicate tokens in both a CSS `:root` block and the
Tailwind config; this project intentionally collapsed that into one
source).

## Key CSS Classes (`src/styles/global.css`)

| Class | What it does |
|---|---|
| `.mesh-bg` / `.mesh-bg-alt` | Layered radial-gradient mesh backgrounds (void vs. depth base) |
| `.glass` | Glass card: blur+saturate backdrop-filter, subtle fill/border, hover lift |
| `.card-cyber` | Glass card variant with a gradient bottom-border that fades in on hover |
| `.btn-cyber` / `.btn-cyber-solid` / `.btn-ghost` | Outlined / filled / transparent button variants |
| `.media-bright` | Shared image treatment (`filter: brightness/contrast/saturate`) — apply to every hero/content `<img>`; replaces the old per-page `opacity-80/85/90` classes, which no longer exist in this codebase |
| `.lumen-border` | Luminous gradient top border |
| `.tag-cyber` | Pill-shaped label (uppercase, accent-tinted) |
| `.reveal` / `.stagger-fade` | Scroll-triggered fade/slide-in via IntersectionObserver (see JS below); opacity+transform only, no CLS impact |
| `.gradient-text` | Accent→accent-2→pink gradient text fill |
| `.input-cyber` | Form input styling with accent focus ring |
| `.icon-wrap` | Icon-slide-on-hover gap animation |
| `.noise-overlay::before` | Fixed full-screen SVG noise texture |

## JavaScript Behaviors (`Layout.astro` `<script>`)

| Behavior | Trigger | Effect |
|---|---|---|
| Nav glassify | `scroll > 20px` | Nav gets a blurred background + shrinks height |
| Mobile menu | `#menu-btn` click | Toggles `.hidden` on `#mobile-menu` **and** updates `aria-expanded` on the button — keep both in sync if you touch this |
| Scroll reveal | IntersectionObserver, threshold 0.12 | Adds `.visible` to `.reveal`/`.stagger-fade` elements |
| Magnetic buttons | `.magnetic` mousemove | Subtle cursor-following translate on hover |

## Images

- Source assets live in `public/uploads/*.webp`, referenced by plain
  string path from CMS-editable JSON (`heroImage`, `aboutImage`, each
  service's `image`, etc.) — **not** ESM-imported from `src/`, because
  Decap CMS's media widget uploads into `public/uploads/` and needs a
  public URL; this is why the site does not use `astro:assets`/`<Image>`
  directly on these fields.
- **Responsive `srcset` is generated separately**, at build time, by
  [`scripts/generate-responsive-images.mjs`](scripts/generate-responsive-images.mjs)
  (runs via the `prebuild`/`predev` npm hooks). It resizes each source
  image to a `[480, 768, 1200]` width ladder (skipping any width ≥ the
  source's actual width), writes `name-{width}w.webp` variants next to
  the original in `public/uploads/`, and writes
  `public/uploads/_responsive-manifest.json`. Both the generated
  variants and the manifest are **gitignored** — they're build output,
  regenerated fresh on every `npm run build`/`npm run dev`, same
  philosophy as `dist/`.
- [`src/lib/responsiveImage.ts`](src/lib/responsiveImage.ts) exposes
  `getSrcSet(imagePath)`, which reads that manifest and returns a
  `srcset` string (or `undefined` if the manifest or that specific image
  isn't there — templates degrade gracefully to a plain `src`, never a
  broken build). Every page-level hero/content `<img>` uses it, paired
  with a shared `sizes="(min-width: 768px) 50vw, 100vw"` matching the
  `md:grid-cols-2` layout they sit in.
- Adding a new main image: drop the file in `public/uploads/`, reference
  it from the relevant JSON, and the next `npm run build`/`npm run dev`
  picks it up automatically — no code change needed unless it doesn't
  fit the existing 50vw/100vw layout assumption.
- LCP hero images use `fetchpriority="high"`; the below-the-fold
  `/nosotros` history image uses `loading="lazy"`.

## Security

- `src/middleware.ts` returns a 404 for any request to `/_image` or
  `/_image/*`. This blocks Astro's built-in image-transform endpoint
  (always present in the Cloudflare adapter's compiled output regardless
  of whether `astro:assets` is used), closing GHSA-88gm-j2wx-58h6 (SSRF
  via redirect-following) without needing an `astro`/`@astrojs/cloudflare`
  major upgrade. **Don't remove or narrow this middleware** — the
  responsive-image pipeline above is entirely build-time and has no
  dependency on that endpoint.
- Contact form (`/api/contact`, `src/pages/api/contact.ts`): honeypot
  field, Cloudflare Turnstile verified server-side, delivered via Resend.
  Requires `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` as Cloudflare
  Worker runtime secrets (`.dev.vars` locally, `wrangler secret put` in
  production) — see `.dev.vars.example`.
- Optional Cloudflare Web Analytics beacon in `Layout.astro`, gated
  behind a `PUBLIC_CF_BEACON_TOKEN` build-time env var — inert unless
  set (see `.env.example`).

## SEO

- `astro.config.mjs` registers `@astrojs/sitemap`, filtered to exclude
  `/gracias` (noindex) and `/api/*`. `public/robots.txt` points to it.
- `Layout.astro` emits an `AdvertisingAgency`/`LocalBusiness` JSON-LD
  block built only from fields present in `site.json` — it currently has
  **no street address, postal code, or geo coordinates**, because that
  data isn't in the repo. Don't invent placeholder values for these if
  asked to "complete" the schema; get the real data first.

## CMS (Decap)

- Config: `public/admin/config.yml`. Local editing: `npm run dev` +
  `npm run cms` → `http://localhost:4321/admin`.
- Production auth goes through a small OAuth proxy in `oauth-worker/`
  (separate Cloudflare Worker, deployed independently — see
  `oauth-worker/README.md`). Its URL is already set in `config.yml`'s
  `backend.base_url` and has been confirmed live.

## Deployment

Push to `main` → Cloudflare Workers auto-builds via `wrangler.jsonc`
(`assets` binding serves `dist/`, the compiled worker in
`dist/_worker.js` handles `/api/*` and anything else not excluded by
the auto-generated `_routes.json`).
