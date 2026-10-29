import { useRef, useState } from 'react';
import './IntroScreen.css';

const FADE_MS = 3000; // fade duration, match this to your audio

export default function IntroScreen({ onDone }) {
  const audioRef = useRef(null);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (started) return;
    setStarted(true);              // starts the CSS fade
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {});  // starts the audio at the same moment
  };

  const handleTransitionEnd = (e) => {
    // only react to the overlay's own opacity fade
    if (e.target === e.currentTarget && e.propertyName === 'opacity') {
      onDone();
    }
  };

  return (
    <div
      className={`intro ${started ? 'intro--fade' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      onClick={handleStart}
      onTransitionEnd={handleTransitionEnd}
    >
      <audio ref={audioRef} src="/resources/okaeri_sfx.mp3" preload="auto" />
      <p className="intro__hint">Click to start</p>
    </div>
  );
}