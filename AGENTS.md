# AGENTS — Alethig Media

## Project Overview

Marketing site for **Alethig Media**, a digital-marketing agency in Long
Island, NY (Amityville — Nassau + Suffolk counties). Bilingual service
(English/Spanish) — and the site itself is fully bilingual too: parallel
`/es/` and `/en/` route trees, a manual language switcher, and browser-language
detection at `/`. See **Bilingual Routing (ES/EN)** below for how that's
wired. Navy & gold glassmorphism design. Built with Astro 5 (server
output) + Tailwind CSS v3, deployed to Cloudflare Workers via
`@astrojs/cloudflare`. Content is edited through Decap CMS at `/admin` —
see [`README.md`](README.md) for the fuller project write-up; this file
is the quick-reference for making code changes correctly.

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
  field exists for it: `src/content/settings/site.json` (brand/contact/
  WhatsApp/social facts, shared across both languages, never translated)
  plus `site.es.json`/`site.en.json` (nav, footer, CTA copy — one per
  language); `src/content/pages/<name>.es.json` / `<name>.en.json` (home,
  about, contact, gracias/thank-you, alethig-media-os); `src/content/services/{es,en}/*.json`
  (5 services × 2 languages, schema in `src/content.config.ts`). The
  field list an editor sees in `/admin` is defined in
  `public/admin/config.yml` and must stay in sync with what each `.astro`
  page actually reads — a JSON field with no matching `config.yml` entry
  can't be edited without a git change; a `config.yml` entry with no
  matching template usage (this happened once with `about.json`'s
  `team[].img`) silently does nothing.
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

## Bilingual Routing (ES/EN)

- Two parallel route trees, `src/pages/es/*` and `src/pages/en/*`, each a
  full copy of the site in one language. **Slugs are translated, not
  mirrored** — the ES and EN paths for the same page are deliberately
  different strings:

  | ES | EN |
  |---|---|
  | `/es/` | `/en/` |
  | `/es/contacto/` | `/en/contact/` |
  | `/es/nosotros/` | `/en/about/` |
  | `/es/gracias/` (noindex) | `/en/thank-you/` (noindex) |
  | `/es/alethig-media-os/` | `/en/alethig-media-os/` |
  | `/es/servicios/desarrollo-web/` | `/en/services/web-development/` |
  | `/es/servicios/diseno-de-marca/` | `/en/services/brand-design/` |
  | `/es/servicios/manejo-de-redes-sociales/` | `/en/services/social-media-management/` |
  | `/es/servicios/produccion-de-video/` | `/en/services/video-production/` |
  | `/es/servicios/publicidad-pagada/` | `/en/services/paid-advertising/` |

  This exact table is duplicated in three places that must stay in sync
  if a slug ever changes: each page's own `altHref` prop passed to
  `Layout`, the `LOCALE_PAIRS` array in `astro.config.mjs` (sitemap
  hreflang), and the services' `urlSlug` field (English side only — the
  Spanish public URL is the content-collection `id` directly, so the
  same filename pairs `src/content/services/es/<id>.json` with
  `src/content/services/en/<id>.json` regardless of the English
  `urlSlug`).
- `src/lib/basePath.ts`'s `withBase(base, href)` prefixes shared,
  unprefixed hrefs from content JSON (`/contacto`, `/#servicios`, …) with
  the active locale's base (`/es` or `/en`) at render time — this is why
  content JSON hrefs are written without a locale prefix; never
  hardcode `/es/...` or `/en/...` in a template except the language
  switcher itself (see below), or an internal link will point outside
  the visitor's current locale.
- `Layout.astro` takes `locale` (`'es' | 'en'`, default `'es'`) and
  `altHref` (the current page's equivalent URL in the *other* language —
  every `/es/*` and `/en/*` page passes its own, per the table above).
  From these it derives: `<html lang>`, which of `site.es.json` /
  `site.en.json` supplies nav/footer/CTA copy, `og:locale`
  (`es_US`/`en_US`), the hreflang `<link>` tags (see SEO below), and the
  ES/EN switcher itself (desktop pill + mobile row) — clicking either
  language sets a `pref_lang` cookie (1 year, `path=/`) and navigates
  straight to `altHref`/the current page, never to the other language's
  homepage. That cookie is the only thing that can override the
  language a visitor lands on — the switcher itself never redirects
  behind the scenes.
- `src/pages/index.astro` (bare `/`) is a `prerender: false` dispatcher,
  not a page: it reads `pref_lang`, falls back to `Accept-Language`, and
  otherwise defaults to Spanish, then issues a 307 to `/es/` or `/en/`.
  It must stay non-prerendered — a prerendered `/` is served as a static
  file straight from Cloudflare's ASSETS binding, bypassing the Worker
  (and this logic) entirely, the same reason the legacy redirects below
  use Astro's `redirects` config instead of `src/middleware.ts`. `/es/`
  and `/en/` are never redirected by this logic (only the bare `/` path
  matches it) — crawlers and direct links always get the real page.
- Legacy pre-bilingual URLs (`/contacto`, `/nosotros`, `/servicios/*`,
  etc.) permanently 301-redirect to their `/es/...` equivalent via the
  `redirects` map in `astro.config.mjs` — not middleware, for the same
  prerender/ASSETS-binding reason as `/`.
- `src/pages/api/contact.ts` reads a hidden `locale` form field (`es`/
  `en`, set per-page) to pick the no-JS fallback redirect targets
  (`/es/contacto/`↔`/es/gracias/` vs `/en/contact/`↔`/en/thank-you/`) —
  these are full path pairs, not a shared prefix, because the path
  segments themselves differ by language. The internal notification
  email always stays in Spanish (business-internal, not visitor-facing)
  but includes the visitor's locale as a line in the message.

## SEO

- `astro.config.mjs` registers `@astrojs/sitemap`, filtered to exclude
  `/es/gracias/` and `/en/thank-you/` (both noindex) and `/api/*`.
  Legacy redirect paths never appear in the sitemap on their own — the
  integration only walks route-manifest entries of type `"page"`, and
  redirects aren't that type. `public/robots.txt` points to it.
- The sitemap also writes `<xhtml:link>` language-alternate entries per
  page (`serialize` in `astro.config.mjs`, using the same `LOCALE_PAIRS`
  table as the routing section above), **not** `@astrojs/sitemap`'s
  built-in `i18n` option — that option pairs pages by matching the path
  that remains after stripping the locale prefix, which only works when
  both languages share the same slug. This site's slugs are translated
  (`contacto`/`contact`, `desarrollo-web`/`web-development`, …), so the
  built-in matching would silently drop alternates for 9 of the 10 page
  pairs. If a page pair is ever added, add it to `LOCALE_PAIRS`, not to
  an `i18n:` config block.
- `Layout.astro` also emits per-page `<link rel="alternate" hreflang="…">`
  tags (`es`, `en`, and `x-default` → `/`) built from the same
  `locale`/`altHref` props as the switcher — reciprocal by construction,
  since both pages of a pair reference each other's `altHref`. These are
  emitted on every page including the two noindex thank-you pages
  (hreflang and sitemap inclusion are independent: a page can declare
  its language alternate without being crawlable itself).
- `Layout.astro` emits an `AdvertisingAgency`/`LocalBusiness` JSON-LD
  block built only from fields present in `site.json` — it currently has
  **no street address, postal code, or geo coordinates**, because that
  data isn't in the repo. Don't invent placeholder values for these if
  asked to "complete" the schema; get the real data first. The schema's
  `description` field already follows the active locale (it's the same
  `description` prop passed into `Layout` per page); the shared facts
  (`site.json`) are intentionally identical text in both languages
  (e.g. the "Amityville, Long Island, NY" place name).

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
