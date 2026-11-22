import { useState, type CSSProperties } from 'react';

const SHOTS = 1000;
const choices = [0, 250, 500, 1000];

// A qubit after a Hadamard gate: each shot gives 0 with chance 1/2.
export default function GuessRun() {
  const [guess, setGuess] = useState<number | null>(null);
  const [zeros, setZeros] = useState(0);
  const [done, setDone] = useState(0);
  const running = done > 0 && done < SHOTS;

  function run() {
    let z = 0;
    let d = 0;
    const batch = matchMedia('(prefers-reduced-motion: reduce)').matches ? SHOTS : 25;
    const tick = () => {
      for (let i = 0; i < batch && d < SHOTS; i++, d++) if (Math.random() < 0.5) z++;
      setZeros(z);
      setDone(d);
      if (d < SHOTS) requestAnimationFrame(tick);
    };
    tick();
  }

  const verdict =
    done === SHOTS && guess !== null
      ? Math.abs(guess - zeros) <= 100
        ? `Close. You got ${zeros} zeros. A Hadamard gate gives a 50/50 split.`
        : `Not quite. You got ${zeros} zeros. A Hadamard gate gives a 50/50 split, so about 500.`
      : '';
  const bar = (count: number) => ({ '--n': count / SHOTS }) as CSSProperties;

  return (
    <figure data-widget="guess-run" aria-label="Guess, then run">
      <fieldset disabled={running}>
        <legend>This qubit went through a Hadamard gate. Out of 1,000 runs, how many give 0?</legend>
        {choices.map((c) => (
          <label key={c}>
            <input type="radio" name="guess" checked={guess === c} onChange={() => setGuess(c)} /> About {c.toLocaleString('en')}
          </label>
        ))}
      </fieldset>
      <p>
        <button type="button" disabled={guess === null || running} onClick={run}>
          {done === SHOTS ? 'Run again' : 'Run 1,000 shots'}
        </button>
      </p>
      <ul aria-label="Results">
        <li>0 <span style={bar(zeros)} /> {zeros}</li>
        <li>1 <span style={bar(done - zeros)} /> {done - zeros}</li>
      </ul>
      <p aria-live="polite">{verdict}</p>
    </figure>
  );
}
