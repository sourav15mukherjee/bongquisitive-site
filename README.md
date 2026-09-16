# Bongquisitive — The Glass Lab (v2)

The official site of **BONGQUISITIVE SOLUTIONS PRIVATE LIMITED** — an independent
research & design lab in Kolkata building tools and games that sharpen your mind.

A liquid-glass, keyboard-first single-page experience with separate legal pages.

## Quick start

```bash
npm install
npm run dev        # dev server
npm run build      # regenerate legal pages + build to dist/
npm run preview    # serve the production build
```

Deploy `dist/` to Netlify (config in `netlify.toml`) or any static host.

## The experience

| Feature | How to see it |
|---|---|
| Liquid-glass hero | 7 metaball blobs refract the wordmark; move the cursor (blobs follow), click (ripples) |
| Command palette | `Ctrl/Cmd + K` or `/` — fuzzy-search sections, projects, research, actions |
| Keyboard navigation | `1`–`5` jump to sections · `j` / `k` next/previous · `Enter` on a card opens details |
| Shortcuts cheat sheet | `?` |
| Close anything | `Esc` |
| Easter egg | type `glass` anywhere |
| Mouse layer | 3D-tilting glass cards with sheen, magnetic buttons, cursor glow, scroll rail |

## Editing content

- **Projects & research entries:** `src/data/content.ts` (palette, modals, search all read from it)
- **Home-page card blurbs:** `index.html` (keep in sync with `content.ts`)
- **Legal pages:** edit `legal/fragments/*.html`, then `node scripts/build-legal.mjs`
  (runs automatically before every build). The shared shell is `legal/template.html`.
- **Colors/type/spacing tokens:** `src/styles/tokens.css`

## Architecture

```
index.html               home (hero → lab → experiments → research → contact)
contact.html  404.html   standalone pages (old URLs preserved)
privacy/terms/refunds/cookies/dmca/disclosures.html   generated — do not edit
legal/                   template + content fragments for the generator
src/styles/              tokens → base → components → hero → legal (bundled via bundle.css)
src/js/hero.ts           WebGL metaball hero (raw GL, no libraries)
src/js/gl.ts             minimal WebGL helper
src/js/interactions.ts   reveal-on-scroll, tilt, magnetic buttons, cursor
src/js/overlays.ts       palette, shortcuts sheet, project modal, toasts
src/js/keyboard.ts       global shortcuts + easter egg
src/js/nav.ts            header state, section spy, smooth scrolling
public/                  favicon, robots.txt, sitemap.xml
```

## Fallbacks & accessibility

- No WebGL → animated CSS-gradient blobs; no JS → fully readable static page.
- `prefers-reduced-motion` → single static hero frame, no animations.
- Full keyboard operability, ARIA roles/labels, focus trap in overlays, skip link,
  visible focus rings; custom cursor extras are skipped on touch devices.

## Before going live

1. Set the real domain in `src/data/content.ts` (`SITE.domain`), `index.html`
   (canonical + OG + JSON-LD), and `public/sitemap.xml` (currently `bongquisitive.com`).
2. Contact form uses Netlify Forms (`data-netlify`) — on another host, swap for a
   mailto or a form service.
3. Stripe: CTAs are structured so Payment Links can be dropped into project cards /
   modals via `src/data/content.ts` without any redesign (`links` array per project).
