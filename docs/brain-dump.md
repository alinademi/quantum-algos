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

## Later

- Company page on `/`.
- Sound for phase.
- 2-player entanglement games.
- CMS, accounts, leaderboards: after Grover track.

## First

Grover track + blog shell.
