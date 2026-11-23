// Stern-Gerlach: silver atoms through a row of magnets. Each magnet measures one spin one-half (a qubit) along its axis.
// Conventions:
// - The beam runs along y. A magnet turned by `tilt` (radians) about the beam has axis n = (sin tilt, 0, cos tilt):
//   0 is Z (upright), pi/2 is X (on its side), pi is Z upside down.
// - Spin up along Z is |0>, spin down along Z is |1>.
// - "Up" at a magnet means spin up along its axis n, the side its arrow points to. (For silver the push is against
//   the field gradient, because the electron's magnetic moment points opposite its spin. The arrow hides that sign.)
// - A magnet is an ideal measurement of the spin along n: up with chance |<up_n|psi>|^2 (Born rule), and the atom
//   leaves in the matching state, up_n or down_n.
// - Oven atoms are unpolarized (density matrix I/2), passed as null: any axis gives up or down with chance 1/2.
// - The screen is seen looking along the beam: x to the right, z up.
import { abs2, inner, matVec, measureQubit, RY, ket0, ket1, type State } from '../quantum.ts';

export type Vec3 = [number, number, number];
export type Port = 'up' | 'down';
/** One magnet: its turn about the beam, and which beam it lets through ('both' for the last one, which feeds the screen). */
export type Stage = { tilt: number; keep: Port | 'both' };
export type Setup = 'classical' | 'one' | 'two' | 'three';

export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** The magnet's axis (x, y, z) when it is turned by tilt about the beam (the y axis). */
export const axis = (tilt: number): Vec3 => [Math.sin(tilt), 0, Math.cos(tilt)];

export const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Spin up along the turned axis: cos(t/2)|0> + sin(t/2)|1>, which is RY(t)|0>. */
export const upAlong = (tilt: number): State => matVec(RY(tilt), ket0());

/** Spin down along the turned axis: -sin(t/2)|0> + cos(t/2)|1>, which is RY(t)|1>. */
export const downAlong = (tilt: number): State => matVec(RY(tilt), ket1());

/** Born rule: chance that a spin in state s goes up at a magnet turned by tilt. */
export const pUp = (s: State, tilt: number): number => abs2(inner(upAlong(tilt), s));

/** Closed form: a spin up along axis m goes up along axis n with chance (1 + m.n) / 2,
 *  which is cos^2(angle / 2) for the angle between the axes. */
export const pUpFromUp = (m: Vec3, n: Vec3): number => (1 + dot3(m, n)) / 2;

/** One atom meets one magnet. s = null is an unpolarized oven atom.
 *  Born rule draw, then the atom leaves in the state that matches its result. */
export function measure(s: State | null, tilt: number, rand: () => number): { port: Port; state: State } {
  if (!s) {
    const port: Port = rand() < 0.5 ? 'down' : 'up';
    return { port, state: port === 'up' ? upAlong(tilt) : downAlong(tilt) };
  }
  // Turn the magnet's axis back to Z, measure in the 0/1 basis, turn back. 0 means up along the axis.
  const r = measureQubit(matVec(RY(-tilt), s), 0, rand, 1);
  return { port: r.result === 0 ? 'up' : 'down', state: matVec(RY(tilt), r.state) };
}

/** The row of magnets for each setup. Magnet 1 is always Z. In 'two' and 'three' it lets only the up beam through.
 *  Magnet 2 is turned by tilt2. In 'three' it lets only beam keep2 through, and magnet 3 is Z again. */
export function chain(setup: Setup, tilt2: number, keep2: Port): Stage[] {
  if (setup === 'classical' || setup === 'one') return [{ tilt: 0, keep: 'both' }];
  if (setup === 'two') return [{ tilt: 0, keep: 'up' }, { tilt: tilt2, keep: 'both' }];
  return [{ tilt: 0, keep: 'up' }, { tilt: tilt2, keep: keep2 }, { tilt: 0, keep: 'both' }];
}

/** What happened to one atom: its result at each magnet it reached, and the magnet that blocked it (-1 if none:
 *  it reached the screen, at the spot of its last result). */
export type Fate = { ports: Port[]; blockedAt: number };

/** Send one oven atom down the row, one Born rule draw per magnet. */
export function fire(stages: Stage[], rand: () => number): Fate {
  let s: State | null = null;
  const ports: Port[] = [];
  for (let k = 0; k < stages.length; k++) {
    const m = measure(s, stages[k].tilt, rand);
    ports.push(m.port);
    if (stages[k].keep !== 'both' && stages[k].keep !== m.port) return { ports, blockedAt: k };
    s = m.state;
  }
  return { ports, blockedAt: -1 };
}

/** Exact chances for one oven atom: blocked[k] at magnet k, then up or down at the last magnet. They sum to 1. */
export type Prediction = { blocked: number[]; up: number; down: number };

export function predict(stages: Stage[]): Prediction {
  const blocked = stages.map(() => 0);
  // Branches still flying: weight and state. Beams that go on are never joined again, so their chances just add.
  let live: { w: number; s: State | null }[] = [{ w: 1, s: null }];
  let up = 0, down = 0;
  stages.forEach((st, k) => {
    const next: typeof live = [];
    for (const { w, s } of live) {
      const p = s ? pUp(s, st.tilt) : 0.5;
      const out: [Port, number, State][] = [['up', w * p, upAlong(st.tilt)], ['down', w * (1 - p), downAlong(st.tilt)]];
      for (const [port, wp, sp] of out) {
        if (k === stages.length - 1) { if (port === 'up') up += wp; else down += wp; }
        else if (st.keep === 'both' || st.keep === port) next.push({ w: wp, s: sp });
        else blocked[k] += wp;
      }
    }
    live = next;
  });
  return { blocked: blocked.map(snap), up: snap(up), down: snap(down) };
}

/** Clean float dust, like cos(pi/2)^2 = 3.7e-33, so a sure or impossible result reads as exactly 1 or 0. */
const snap = (p: number): number => (Math.abs(p) < 1e-12 ? 0 : Math.abs(p - 1) < 1e-12 ? 1 : p);

/** Odds of up among atoms that reach the screen, or null if none can. */
export const screenUp = (p: Prediction): number | null => (p.up + p.down > 0 ? snap(p.up / (p.up + p.down)) : null);

// ---- The classical guess: each atom a tiny classical magnet of the same strength, pointing any way.

/** A direction drawn evenly over the sphere: z even on [-1, 1] (Archimedes), angle around z even on [0, 2 pi). */
export function randomDirection(rand: () => number): Vec3 {
  const z = 2 * rand() - 1, phi = 2 * Math.PI * rand(), r = Math.sqrt(Math.max(0, 1 - z * z));
  return [r * Math.cos(phi), r * Math.sin(phi), z];
}

/** The push on a classical magnet is set by its part along the magnet's axis, so it lands at that part times the
 *  quantum spot distance: anywhere in [-1, 1], never just at the two ends. */
export const classicalOffset = (m: Vec3, tilt: number): number => dot3(m, axis(tilt));

// ---- The screen, seen looking along the beam (x right, z up).

/** Where an atom lands for offset o along the last magnet's axis: o = +1 is the up spot, -1 the down spot. */
export const onScreen = (o: number, tilt: number): [number, number] => {
  const n = axis(tilt);
  return [o * n[0], o * n[2]];
};

export const portOffset = (p: Port): number => (p === 'up' ? 1 : -1);

/** Short label for a magnet on the drawing: Z, X, or the angle. */
export const shortName = (deg: number): string => (deg === 0 ? 'Z' : deg === 90 ? 'X' : `${deg}°`);

/** Name a turn of magnet 2 in words, for labels and screen readers. */
export function turnName(deg: number): string {
  if (deg === 0) return 'upright, Z';
  if (deg === 90) return 'on its side, X';
  if (deg === 180) return 'upside down';
  return `turned ${deg}°`;
}
