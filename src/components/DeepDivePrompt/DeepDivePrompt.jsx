import { useState } from 'react';
import useParallax from '../../hooks/useParallax';
import { checkCodename } from '../../data/codename';
import { loadSession } from '../../data/sessionApi';
import '../LoadPrompt/LoadPrompt.css';   // same look as the Load Session box

const SERVER_OFFLINE_MSG = 'Cannot reach the session server. Is it running?';

// Deep Dive box, two steps:
//   1. "Enter your codename from session to continue" (the codename must exist as a saved session)
//   2. "Are you sure you want to deep dive?"  Yes / No
// onConfirm(name) is called when Yes is pressed.
// onClose() is called after the box has faded out.
export default function DeepDivePrompt({ onConfirm, onClose }) {
  const ref = useParallax();                 // sets --mx and --my from the cursor
  const [step, setStep] = useState('enter'); // 'enter' or 'confirm'
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = () => setLeaving(true);

  // step 1: the codename must be valid and must exist in the saved sessions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || leaving) return;

    const value = name.trim();
    const problem = checkCodename(value);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    const result = await loadSession(value);
    setBusy(false);

    if (!result.ok) {
      setError(result.notFound ? `No saved session found for ${value}.` : SERVER_OFFLINE_MSG);
      return;
    }

    setName(value);
    setStep('confirm');
  };

  // step 2: Yes starts the screen change, the box fades out at the same time
  const handleYes = () => {
    if (leaving) return;
    setLeaving(true);
    onConfirm(name);
  };

  const handleAnimationEnd = (e) => {
    if (e.target !== e.currentTarget || e.animationName !== 'loadp-out') return;
    onClose();
  };

  return (
    <div
      ref={ref}
      className={`loadp ${leaving ? 'loadp--out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deepdive-title"
      onAnimationEnd={handleAnimationEnd}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      {/* soft glows behind the box, they drift the opposite way for depth */}
      <div className="loadp__glow loadp__glow--a" aria-hidden="true" />
      <div className="loadp__glow loadp__glow--b" aria-hidden="true" />

      {step === 'enter' ? (
        <form className="loadp__panel" onSubmit={handleSubmit} noValidate>
          <h2 id="deepdive-title" className="loadp__title">
            Deep Dive
          </h2>
          <p className="loadp__sub">Enter your codename from session to continue</p>

          <input
            className="loadp__input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Name-000"
            maxLength={24}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby="deepdive-hint"
          />

          <p id="deepdive-hint" className={`loadp__hint ${error ? 'loadp__hint--error' : ''}`}>
            {error || 'Example: Kal-017'}
          </p>

          <div className="loadp__actions">
            <button type="submit" className="loadp__btn" disabled={busy || !name.trim()}>
              {busy ? 'Checking…' : 'OK'}
            </button>
            <button type="button" className="loadp__btn loadp__btn--ghost" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="loadp__panel">
          <h2 id="deepdive-title" className="loadp__title">
            {name}
          </h2>
          <p className="loadp__sub">Are you sure you want to deep dive?</p>

          <div className="loadp__actions">
            <button type="button" className="loadp__btn" onClick={handleYes} autoFocus>
              Yes
            </button>
            <button
              type="button"
              className="loadp__btn loadp__btn--ghost"
              onClick={() => setStep('enter')}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}