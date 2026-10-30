import { useEffect, useState } from 'react';
import useParallax from '../../hooks/useParallax';
import './SessionScreen.css';

const CHAR_MS = 45;          // time per letter at normal speed
const AUTO_DELAY_MS = 1800;  // pause before auto play moves to the next line
const SPEEDS = [2, 3, 4];

export default function SessionScreen({
  character = '/resources/character.png',
  lines = [],
  onBack,
}) {
  const ref = useParallax();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);          // letters visible so far
  const [menuOpen, setMenuOpen] = useState(false);
  const [speed, setSpeed] = useState(1);          // 1 = normal, or 2, 3, 4
  const [auto, setAuto] = useState(false);

  const line = lines[index] ?? '';
  const done = shown >= line.length;
  const isLast = index >= lines.length - 1;

  // typewriter
  useEffect(() => {
    if (done) return;
    const id = setInterval(
      () => setShown((n) => Math.min(n + 1, line.length)),
      CHAR_MS / speed
    );
    return () => clearInterval(id);
  }, [done, line, speed]);

  // auto play: after a line finishes, wait a moment, then go to the next one
  useEffect(() => {
    if (!auto || !done) return;

    const id = setTimeout(() => {
      if (isLast) {
        setAuto(false);              // reached the end, so auto play turns itself off
      } else {
        setIndex((i) => i + 1);
        setShown(0);
      }
    }, AUTO_DELAY_MS / speed);

    return () => clearTimeout(id);
  }, [auto, done, isLast, speed]);

  const handleScreenClick = (e) => {
    if (e.target.closest('.session__menu')) return;   // the menu has its own buttons
    if (menuOpen) {                                   // clicking elsewhere closes the menu
      setMenuOpen(false);
      return;
    }
    if (!done) {                                      // first click finishes the line
      setShown(line.length);
      return;
    }
    if (!isLast) {                                    // next click goes to the next line
      setIndex(index + 1);
      setShown(0);
    }
  };

  const pickSpeed = (s) => setSpeed((cur) => (cur === s ? 1 : s));

  return (
    <section ref={ref} className="session" onClick={handleScreenClick}>
      <img className="session__character" src={character} alt="" draggable="false" />

      <div className="session__dialog">
        <p className="session__text">
          <span>{line.slice(0, shown)}</span>
          {/* invisible rest of the line, so the box doesn't resize while typing */}
          <span className="session__ghost">{line.slice(shown)}</span>
        </p>
        {done && !isLast && (
          <span className="session__next" aria-hidden="true">▼</span>
        )}
      </div>

      <div className={`session__menu ${menuOpen ? 'session__menu--open' : ''}`}>
        <button
          className="session__burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="session__stack">
          {/* 1. back */}
          <button className="session__bar" style={{ '--i': 0 }} onClick={onBack}>
            <span className="session__circle">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9 5 16 12 9 19" />
              </svg>
            </span>
            <span className="session__bar-label">Back</span>
          </button>

          {/* 2. speed */}
          <div className="session__bar" style={{ '--i': 1 }}>
            <span className="session__bar-label">Speed</span>
            <div className="session__speeds">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  className={`session__speed ${speed === s ? 'session__speed--on' : ''}`}
                  aria-pressed={speed === s}
                  onClick={() => pickSpeed(s)}
                >
                  x{s}
                </button>
              ))}
            </div>
          </div>

          {/* 3. auto play */}
          <button
            className="session__bar"
            style={{ '--i': 2 }}
            aria-pressed={auto}
            onClick={() => setAuto((a) => !a)}
          >
            <span className="session__bar-label">Auto Play</span>
            <span className={`session__state ${auto ? 'session__state--on' : ''}`}>
              {auto ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}