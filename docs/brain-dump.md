# Brain dump

Site: **Quantum Computing Era**.
Goal: quantum computing courses, A to Z. Teach by doing, not reading.
Audience: curious beginner to dev.

## Site map

- `/`: home. Now: course intro + metro map. Later: company page.
- `/learn`: courses. Later secondary.
- `/blog`: posts. Needed now.

Sections self-contained. Home only links in, owns no course or blog code.

## Core

One concept graph. Many views.

## Course structure

- **Metro map** (`/learn` home). Lines = tracks: Physics, Gates, Algorithms, Hardware, Crypto. Shared stops = shared prereqs.
- **Periodic table**: A-Z terms. Tile opens live demo, not definition.
- **Depth dial**: Kid / Student / Engineer per page. Text and math swap.

## Page kit

- **4 ways**: one state as words, ket, matrix, circuit. Linked.
- **Guess, then run**: predict, run 1000 shots, watch histogram fill.
- **Scrubber**: step through algorithm like video. State each step.
- **Gate golf**: reach target state, fewest gates.
- **Myth trap**: open with wrong belief, break it.

## Stack

- Astro + MDX. Content collections: `lessons`, `posts`.
- Concept graph from lesson frontmatter: `prereqs`, `track`.
- Widgets: React islands, only where needed.
- Simulator: own tiny TS state-vector sim.
- Bloch sphere: three.js via react-three-fiber.
- Math: KaTeX.
- Metro map, charts: plain SVG, stations placed by hand.
- Progress: localStorage. No backend, no accounts.
- Deploy: GitHub Actions to Cloudflare Pages. Never direct.

## CSS

These rules beat any design skill.

- Mobile first. `min-width` breakpoints only. No `max-width` queries.
- Classless first: style elements. Class only when no element fits.
- Tokens for color, space, type, radius. No magic numbers.
- Few breakpoints, fixed, listed once.
- Component styles scoped in Astro, so selectors stay classless.
- Terse. Every rule earns its place. No utility soup.

## SEO, AEO, GEO

- Static HTML. Widgets sit beside text, never wrap it.
- One `<Seo>` component in base layout: title, description, canonical, Open Graph. No plugin.
- `@astrojs/sitemap` + `robots.txt`.
- JSON-LD: `Course`, `DefinedTerm` (A-Z), `FAQPage` (myths), `BlogPosting`, `Organization`.
- AEO: page opens with 2-line plain answer. Question headings.
- Depth dial: all 3 levels in HTML, toggle by CSS. JS swap hides text from bots.
- GEO: `llms.txt`, allow AI bots, cite sources, author + date.
- Cloudflare blocks AI bots by default on new domains. Turn off.
- Track: Google Search Console, Bing Webmaster Tools, Cloudflare Web Analytics.

## Images

- `astro:assets` `<Image>` / `<Picture>` for every raster image. Built and shrunk at build time.
- Files in `src/assets`, not `public/`. `public/` skips optimizing.
- Big images: `<Picture formats={['avif', 'webp']}>` + `widths` + `sizes`.
- Always width + height. No layout shift.
- `alt` always. Empty only for decor.
- Lazy by default. Above fold: `loading="eager"` + `fetchpriority="high"`.
- Diagrams: inline SVG, not `<Image>`.
- OG image per page: 1200x630.

## Accessibility

Target: WCAG 2.2 AA, every page.

- Semantic HTML first. Native elements before ARIA.
- `lang`, landmarks, headings in order, skip link.
- All works by keyboard. Visible `:focus-visible`.
- Contrast: 4.5:1 text, 3:1 UI and graphics. Checked once, in tokens.
- Never color alone. Phase color also gets a label.
- `rem` units. Works at 200% zoom and 320px wide.
- Targets 24x24px min.
- Drag always has a click or key option.
- Widgets: key controls + text readout of state (`aria-live="polite"`).
- 3D and canvas: text alternative.
- Respect `prefers-reduced-motion`. Animations can pause.
- Depth dial: native radio buttons.
- Math: KaTeX MathML. Video: captions.
- Test: axe in CI fails the build. Plus manual keyboard and screen reader (VoiceOver, NVDA).

## Later

- Company page on `/`.
- Sound for phase.
- 2-player entanglement games.
- CMS, accounts, leaderboards: after Grover track.

## First

Grover track + blog shell.
