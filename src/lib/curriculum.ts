// The site's map of knowledge, read at build time from the two source files:
// docs/curriculum.md (regions, stops, lines) and docs/references.md (Learn more links).
// Every page asks this module; nothing else parses those files.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type Region = { id: string; name: string };
export type Stop = { id: string; name: string; region: string; level: Level; scope: string; needs: string[]; deeper: string[]; lines: number[] };
export type Line = { name: string; stops: string[] };
export type Source = { key: string; authors: string; year: string; title: string; venue: string; type: string; level: string };
export type Pick = { source: Source; part: string; link: string };

// Paths are from the repo root: builds and tests run there.
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

// Table cells; a "|" inside a ket like |0> is escaped as \| or surrounded by text, never by spaces on both sides.
const cells = (row: string) => row.trim().replace(/^\|\s*/, '').replace(/\s*\|$/, '').split(/(?<!\\)\s+\|\s+|\s+\|\s+/).map((c) => c.trim().replace(/\\\|/g, '|'));
const tableRows = (body: string) => body.split('\n').filter((r) => r.startsWith('|') && !r.startsWith('|---'));
const list = (v = '') => v.split(',').map((x) => x.trim()).filter((x) => x && x !== '-');

function parseCurriculum() {
  const md = read('docs/curriculum.md');
  const regions: Region[] = [], stops = new Map<string, Stop>(), lines: Line[] = [];
  for (const block of md.split('\n## ').slice(1)) {
    const [title, ...rest] = block.split('\n');
    const rows = tableRows(rest.join('\n'));
    const rid = title.match(/\(`([\w-]+)`\)/);
    if (rid) {
      regions.push({ id: rid[1], name: title.split(' (')[0] });
      const head = cells(rows[0]).map((h) => h.toLowerCase());
      for (const r of rows.slice(1)) {
        const d = Object.fromEntries(cells(r).map((v, i) => [head[i], v]));
        stops.set(d.id, { id: d.id, name: d.stop, region: rid[1], level: d.level as Level, scope: d.scope, needs: list(d.needs), deeper: list(d.deeper), lines: [] });
      }
    } else if (title.startsWith('Lines')) {
      for (const r of rows.slice(1)) { const [name, seq] = cells(r); lines.push({ name, stops: list(seq) }); }
    }
  }
  lines.forEach((l, i) => l.stops.forEach((id) => stops.get(id)?.lines.push(i)));
  return { regions, stops, lines };
}

function parseReferences(): Map<string, Pick[]> {
  const md = read('docs/references.md');
  const section = (name: string) => tableRows(md.split(`\n## ${name}\n`)[1].split('\n## ')[0]);
  const rowsOf = (name: string) => { const [h, ...rs] = section(name); const head = cells(h).map((x) => x.toLowerCase()); return rs.map((r) => Object.fromEntries(cells(r).map((v, i) => [head[i], v]))); };
  const sources = new Map(rowsOf('Sources').map((r) => [r.key, r as unknown as Source]));
  const picks = new Map<string, Pick[]>();
  for (const p of rowsOf('Learn more')) {
    const source = sources.get(p.key);
    if (!source) throw new Error(`references: unknown source ${p.key} for ${p.stop}`);
    picks.set(p.stop, [...(picks.get(p.stop) ?? []), { source, part: p.part, link: p.link }]);
  }
  return picks;
}

export const { regions, stops, lines } = parseCurriculum();
export const learnMore = parseReferences();
export const regionName = (id: string) => regions.find((r) => r.id === id)?.name ?? id;
export const stop = (id: string): Stop => { const s = stops.get(id); if (!s) throw new Error(`unknown stop ${id}`); return s; };

/** Stops that list this one as a must-learn-first. */
export const leadsTo = (id: string) => [...stops.values()].filter((s) => s.needs.includes(id));

// Best first: the next stop on a shared line, then the easiest, then curriculum order.
const rank: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const order = new Map([...stops.keys()].map((id, i) => [id, i]));
const nextOnLine = new Map<string, Set<string>>();
for (const l of lines) l.stops.forEach((id, i) => { if (l.stops[i + 1]) nextOnLine.set(id, (nextOnLine.get(id) ?? new Set()).add(l.stops[i + 1])); });
export const best = (id: string, xs: Stop[]) =>
  [...xs].sort((a, b) => Number(!nextOnLine.get(id)?.has(a.id)) - Number(!nextOnLine.get(id)?.has(b.id)) || rank[a.level] - rank[b.level] || order.get(a.id)! - order.get(b.id)!);

/** Where a stop's page lives. */
export const href = (id: string) => `/learn/${id}/`;
