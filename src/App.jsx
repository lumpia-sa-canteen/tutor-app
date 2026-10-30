import { useRef, useState } from 'react';
import ParallaxScene from './components/ParallaxScene/ParallaxScene';
import MainMenu from './components/MainMenu/MainMenu';
import IntroScreen from './components/IntroScreen/IntroScreen';
import { menuItems } from './data/menuItems';

const backgrounds = [
  '/resources/theresa1.jpg',
  '/resources/theresa2.jpg',
  '/resources/theresa3.jpg',
  '/resources/theresa4.jpg'
];

const BGM_VOLUME = 0.6;
const BGM_FADE_IN_MS = 2000;

function fadeVolume(audio, from, to, ms) {
  const start = performance.now();
  audio.volume = from;
  const step = (now) => {
    const t = Math.min((now - start) / ms, 1);
    audio.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const sfxRef = useRef(null);
  const bgmRef = useRef(null);

  const handleSelect = (id) => {
    console.log('Selected:', id);
  };

  const handleIntroStart = () => {
    const bgm = bgmRef.current;
    bgm.volume = 0;
    bgm.play().then(() => bgm.pause()).catch(() => {});
  };

  const handleIntroDone = () => {
    setIntroDone(true);
    const bgm = bgmRef.current;
    bgm.currentTime = 0;
    bgm.volume = 0;
    bgm.play().catch(() => {});
    fadeVolume(bgm, 0, BGM_VOLUME, BGM_FADE_IN_MS);
  };

  return (
    <>
      <audio ref={sfxRef} src="/resources/okaeri_sfx.mp3" preload="auto" />
      <audio ref={bgmRef} src="/resources/main_menu_bgm.mp3" preload="auto" loop />

      <ParallaxScene images={backgrounds} running={introDone}>
        <MainMenu items={menuItems} onSelect={handleSelect} />
      </ParallaxScene>

      {!introDone && (
        <IntroScreen
          audioRef={sfxRef}
          onStart={handleIntroStart}
          onDone={handleIntroDone}
        />
      )}
    </>
  );
}