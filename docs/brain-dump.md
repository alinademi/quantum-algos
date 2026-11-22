# Brain dump

Site: **Quantum Computing Era**.
Goal: quantum computing courses, A to Z. Teach by doing, not reading.
Audience: curious beginner to dev.

## Site map

- `/`: thin home. Live detector hero + three doors: The Map, Words, Blog. Later: company page, only the hero changes.
- `/map`: The Map. All regions, lines and stops.
- `/learn/<stop>`: one page per stop.
- `/words`: A to Z. `/words/<term>`: one page per term, links to the stops that teach it.
- `/blog`: posts.

Sections self-contained. Home only links in.

## Core

One concept graph. Many views.

## The Map

Not a "course". Learning area = **The Map**. Lessons = **stops**. Paths = **lines**.

- **Regions** say what a stop is: Foundations, Gates and circuits, Algorithms, Protocols and crypto, Hardware and machines, Industry and business.
- **Lines** say the order to learn: lit paths across regions ("Road to Shor"). A stop can sit on many lines, or none.
- **3D graph:** regions are clusters in space, stops are small dot clouds, links are dotted. Click flies to a stop, hover lights its prerequisites, filter by region, light one line. Visited stops glow (localStorage).
- **Self-updating:** every stop file declares region, lines, needs, terms. The build turns that into the graph and the word index.
- **Build checks the graph:** missing prerequisite or a loop fails the deploy.
- **Fixed layout:** positions computed with a fixed seed, so the map never jumps between visits.
- **Fallback:** phones and screen readers get the same data as region lists with line badges. Crawlable.
- **Algorithms vs protocols:** protocols (teleportation, superdense coding, BB84, E91) are not algorithms.
- Content draft: `docs/curriculum.md`.

## Design: Shot Noise (chosen)

In quantum physics you only ever see dots: one per measurement. Everything is drawn that way.

- Hero: live double-slit detector, histogram converging to the predicted curve, "mark which slit" toggle.
- Type: Hanken Grotesk (text, titles at 600), Doto (dot-matrix numbers and symbols), JetBrains Mono (labels, kets).
- Palette: cool paper, ink, ultramarine signal, vermilion for myths. Light and dark.
- Dotted rules and lines, no boxes. Plates (tinted bands) hold live tools.

## Accuracy

Every claim, formula and widget gets fact-checked before it ships. Rules learned so far:

- Amplitudes add and cancel, not qubits or paths. Probability is |amplitude|², not amplitude².
- Superposition is not "a mix": a mix is plain odds. Say amplitudes, and that they can cancel.
- Which-path: a record destroys the stripes, no observer needed. Say "mark" or "record", never "watch".
- Name the start state ("started as 0, then a Hadamard gate").
- Blog facts carry a source.

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
- Track: Google Search Console, Bing Webmaster Tools.

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

## Tracking

PostHog. Generous free tier. Billing cap at $0.

- Session replay + heatmaps: clicks, scrolls, mouse.
- Custom widget events: `guess_made {correct}`, `golf_solved {gates}`, `depth_changed {level}`.
- Goal: see where people get stuck.
- Page views too. Replaces Cloudflare Web Analytics.
- Consent first (EU, Canada). Load only after yes.
- Mask typed input in replays.

## Later

- Company page on `/`.
- Sound for phase.
- 2-player entanglement games.
- CMS, accounts, leaderboards: after Grover track.

## First

1. Fix all fact-check findings in the Shot Noise sample.
2. Review `docs/curriculum.md`.
3. 3D map prototype with the curriculum data.
4. Port Shot Noise into Astro.
