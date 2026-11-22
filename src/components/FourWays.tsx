import { useState } from 'react';

const presets = [['|0⟩', 0], ['|+⟩', 90], ['|1⟩', 180]] as const;
const n = (x: number) => x.toFixed(2);
const pct = (p: number) => `${Math.round(p * 100)}%`;

// One qubit rotated by RY(deg) from |0⟩. Real amplitudes only; phase comes in a later lesson.
export default function FourWays() {
  const [deg, setDeg] = useState(90);
  const a = Math.cos((deg * Math.PI) / 360);
  const b = Math.sin((deg * Math.PI) / 360);
  const words = a * a > 0.995 ? 'Always 0.' : b * b > 0.995 ? 'Always 1.' : `${pct(a * a)} chance of 0, ${pct(b * b)} chance of 1.`;

  return (
    <figure data-widget="four-ways" aria-label="One qubit state shown four ways">
      <label htmlFor="ry">
        Rotate the qubit <output htmlFor="ry">{deg}°</output>
      </label>
      <input id="ry" type="range" min={0} max={180} value={deg} aria-valuetext={`${deg} degrees. ${words}`} onChange={(e) => setDeg(+e.target.value)} />
      <p>
        {presets.map(([label, d]) => (
          <button key={d} type="button" aria-pressed={deg === d} onClick={() => setDeg(d)}>{label}</button>
        ))}
      </p>
      <dl>
        <div><dt>Words</dt><dd>{words}</dd></div>
        <div><dt>Ket</dt><dd><code>|ψ⟩ = {n(a)}|0⟩ + {n(b)}|1⟩</code></dd></div>
        <div>
          <dt>Matrix</dt>
          <dd>
            <table aria-label="Column vector">
              <tbody><tr><td>{n(a)}</td></tr><tr><td>{n(b)}</td></tr></tbody>
            </table>
          </dd>
        </div>
        <div>
          <dt>Circuit</dt>
          <dd>
            <svg viewBox="0 0 220 60" role="img" aria-label={`Circuit: start at 0, rotate ${deg} degrees, measure`}>
              <text x="2" y="35">|0⟩</text>
              <path d="M32 30h50M146 30h28" />
              <rect x="82" y="12" width="64" height="36" rx="4" />
              <text x="114" y="35" textAnchor="middle">RY {deg}°</text>
              <rect x="174" y="12" width="40" height="36" rx="4" />
              <path d="M182 40a12 12 0 0 1 24 0M194 40l8-14" />
            </svg>
          </dd>
        </div>
      </dl>
    </figure>
  );
}
