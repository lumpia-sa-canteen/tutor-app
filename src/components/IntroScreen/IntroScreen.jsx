import { useRef, useState } from 'react';
import './IntroScreen.css';

export default function IntroScreen({ audioRef, onStart, onDone }) {
  const overlayRef = useRef(null);
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    if (started) return;
    setStarted(true);
    onStart();                       // runs inside the click, used to unlock the bgm

    const audio = audioRef.current;
    const overlay = overlayRef.current;
    audio.currentTime = 0;
    audio.volume = 1;

    try {
      await audio.play();            // resolves when the sound really starts
    } catch {
      onDone();                      // audio blocked, skip straight to the menu
      return;
    }

    // the white screen follows the audio's own clock
    let raf;
    const tick = () => {
      const d = audio.duration;
      if (d) {
        const t = Math.min(audio.currentTime / d, 1);
        const eased = t * t * (3 - 2 * t);          // smooth start and end
        overlay.style.opacity = String(1 - eased);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    audio.addEventListener(
      'ended',
      () => {
        cancelAnimationFrame(raf);
        overlay.style.opacity = '0';
        onDone();                    // remove overlay, App starts the bgm
      },
      { once: true }
    );
  };

  return (
    <div
      ref={overlayRef}
      className={`intro ${started ? 'intro--started' : ''}`}
      onClick={handleStart}
    >
      <p className="intro__hint">Enter the Abyss</p>
    </div>
  );
}