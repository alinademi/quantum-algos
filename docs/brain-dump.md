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

- **Regions** (12) say what a stop is: Math toolkit, Foundations, Gates and circuits, Algorithms, Theory, Quantum information, Protocols and crypto, Networks and sensing, Hardware and machines, Error correction, Software and tools, Industry and business.
- **Lines** say the order to learn: paths across regions ("Road to Shor"). A stop can sit on many lines.
- **The Map page is a catalog:** search box, region chips, "only stops on" line filter, and two views: By region (tiles) and By line (dotted tracks, top-down on phones).
- **Tiles:** dot-cloud icon (more links, more dots), Open or Soon, learn first, leads to, line badges. Each tile has its own link (`/map#bb84`).
- **Long link lists:** show 3, best first (next on a shared line, then easiest). Fold the rest under "N more", grouped by region with its color dot. Same on stop pages.
- **Each stop page** shows where it sits: learn first, this stop, leads to.
- **Self-updating:** every stop file declares region, lines, needs, terms. The build turns that into The Map, the word index and the home counts. Plain HTML, crawlable.
- **Build checks the graph:** missing prerequisite or a loop fails the deploy.
- **Search:** instant filter on The Map now. Pagefind for full-site search in Astro (index built at deploy, no server).
- **Algorithms vs protocols:** protocols (teleportation, superdense coding, BB84, E91) are not algorithms. Each algorithm stop is marked Algorithm, Building block or Concept.
- **Needs vs Deeper:** `Needs` are must-learn-first and never point to a harder level. `Deeper` are optional. The build checks both rules.
- **Size:** about 530 stops, 62 lines (`docs/curriculum.md`). Research behind it: `docs/research/`.
- **Retired:** a 3D graph of dot clouds. Beautiful, but zoom and labels did not work on phones.
- Content: `docs/curriculum.md`.
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
- Every important claim needs a primary-source link, the date it was checked, and its type: theorem, experiment, company claim or forecast. Research citations checked only through search snippets or memory are not verified yet.
- Learn more: `docs/references.md`, one library of university-level sources plus a list per stop. `scripts/check-ref.py docs/references.md` catches ids for the wrong paper. Run it in CI.

## Page kit

- **4 ways**: one state as words, ket, matrix, circuit. Linked.
- **Guess, then run**: predict, run 1000 shots, watch histogram fill.
- **Scrubber**: step through algorithm like video. State each step.
- **Gate golf**: reach target state, fewest gates.
- **Myth trap**: open with wrong belief, break it.

## Stack

- Astro + MDX. Content collections: `stops` (one MDX per stop), `posts`.
- Graph, Map, Words, Learn more: read from `docs/curriculum.md` and `docs/references.md` by `src/lib/curriculum.ts` only.
- Live tools: one custom element per tool in `src/components/tools/`, no framework. Shared helpers in `src/lib/draw.ts`.
- Simulator: own tiny TS state-vector sim, `src/lib/quantum.ts`. Each stop's math in `src/lib/sims/<id>.ts` with tests (`npm test`).
- Page kit: `src/components/stop/` (myth, depth dial, lab, where it sits, learn more). Tokens only in `src/styles/tokens.css`.
- Math: KaTeX to MathML.
- Map, charts: plain SVG and canvas.
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

## Contributing

Public repo. One repo, split by folder, so writers never touch code.

- `content/`: all writing. `src/`: all code.
- One Markdown file per stop: `content/stops/superposition.md`. Frontmatter: region, lines, needs, terms, sources. Words and posts the same. Lines in one `content/lines.yaml`. Replaces `docs/curriculum.md`.
- Widgets are short tags (`<FourWays />`) from a documented list. No JavaScript in content.
- CODEOWNERS: science reviewers own `content/`, developers own `src/`.
- Pull request checks, errors in plain English: fields filled, needs exist, no loops, no broken links, math renders, style lint (simple words, no em dashes), facts have sources.
- "Edit this page" link on every stop opens GitHub's web editor. Each pull request gets a Cloudflare preview.
- "Report a mistake" issue form: easiest way in.
- Bot fact-check as first pass on content pull requests, then human approval.
- Licenses: content CC BY-SA 4.0, code MIT.
- CONTRIBUTING.md: two guides, "Write or fix content" (no code) and "Work on the code".
- No CMS yet. Keystatic later if writers struggle; it edits the same files.

## Authoring and verification (open)

Open: we are not sure of the format yet. Goal: writing a stop should not cost a full codebase tour, and facts get checked by more than one reviewer.

- **Writer skill** (`qce-stop-writer`): page template, frontmatter, voice, depth dial rules, widget tags, accuracy rules. Plain Markdown, so it also works as Claude or ChatGPT project knowledge.
- **Context bundle per stop:** one command prints the stop's row, needs, leads, terms and house rules into one small file.
- **Fact-check skill** (`qce-fact-check`): every claim goes in a ledger with type (theorem, experiment, company claim, forecast), primary source, checked date and verdict.
- **Reviewers by lens, not by copy:** physics, math, teaching (misconceptions), sources and dates.
- **Tests over opinions:** widget simulations get unit tests against known results.
- **Agentic (Claude Code, Codex):** writer sub-agent, 4 reviewers in parallel, CI, then a human science reviewer on the pull request.
- **Linear (Claude or ChatGPT projects):** same skill files; each reviewer runs in a fresh chat with only the draft and its checklist, or a different model reviews. Slower, still independent.
- **Final gate either way:** repo checks, widget tests, human expert for advanced stops.

## Later

- Company page on `/`.
- Sound for phase.
- 2-player entanglement games.
- CMS, accounts, leaderboards: after Grover track.

## First

1. Fix all fact-check findings in the Shot Noise sample.
2. Review `docs/curriculum.md`.
3. Ship a small beginner journey first (the First steps line), end to end, before more stops.
4. Port Shot Noise into Astro.
