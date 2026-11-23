// Shared browser helpers for every live tool: canvas sizing, theme colors, motion and visibility.
// Tools import these instead of writing their own, so a change here changes every tool.

/** Read a design token like '--signal' from the page. Re-read on theme change. */
export const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** The colors tools draw with. Names match the tokens in src/styles/tokens.css. */
export const palette = () => ({
  ink: token('--ink'), ink2: token('--ink-2'), paper: token('--paper'), plate: token('--plate'),
  rule: token('--rule'), signal: token('--signal'), hot: token('--hot'),
});

/** True when the reader asked for less motion. Tools must then skip animation and draw the end state. */
export const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Size a canvas to its CSS box at device pixel ratio (max 2). Returns the size in CSS pixels. */
export function fit(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } {
  const ctx = canvas.getContext('2d')!;
  const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

/** Call fn when the element's width changes. */
export function onResize(el: Element, fn: () => void): void {
  let w = 0;
  new ResizeObserver(() => { const nw = el.getBoundingClientRect().width; if (nw !== w) { w = nw; fn(); } }).observe(el);
}

/** Call fn when the color scheme changes, so canvases redraw with the new palette. */
export const onTheme = (fn: () => void): void => matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fn);

/** Call fn(true) when the element scrolls into view and fn(false) when it leaves. Pause animations off screen. */
export const onSeen = (el: Element, fn: (seen: boolean) => void): void =>
  new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting))).observe(el);

/** A dot, the site's only drawing unit: every picture is made of measured shots. */
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/** Format a probability as a whole percent for readouts, e.g. 0.5 -> "50%". */
export const pct = (p: number): string => `${Math.round(p * 100)}%`;
