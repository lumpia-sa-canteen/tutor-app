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

// each key is the id of a main menu item, the list is what its bar shows
const subMenus = {
  start: [
    { id: 'new-session', label: 'New Session' },
    { id: 'deep-dive', label: 'Deep Dive' },
  ],
  load: [
    { id: 'load-session', label: 'Load Session' },
    { id: 'load-dive', label: 'Load Dive' },
  ],
  menu: [
    { id: 'volume', label: 'Volume' },
    { id: 'show-hints', label: 'Show Hints' },
  ],
};

const BGM_VOLUME = 0.6;
const BGM_FADE_IN_MS = 2000;
const EXIT_FADE_MS = 2500;   // black screen and music fade out together

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
  const [view, setView] = useState('main');          // 'main', 'start', 'load' or 'menu'
  const [nextView, setNextView] = useState(null);    // where the bar is heading
  const [barHidden, setBarHidden] = useState(false);
  const [exiting, setExiting] = useState(false);
  const sfxRef = useRef(null);
  const bgmRef = useRef(null);

  const items = subMenus[view] ?? menuItems;

  // slide the bar out, then show the other menu
  const goTo = (target) => {
    if (barHidden) return;           // ignore clicks while the bar is sliding
    setNextView(target);
    setBarHidden(true);
  };

  const handleExit = () => {
    if (exiting) return;
    setExiting(true);                // black screen starts fading in

    const bgm = bgmRef.current;
    fadeVolume(bgm, bgm.volume, 0, EXIT_FADE_MS);   // music fades out at the same time

    setTimeout(() => {
      bgm.pause();
      window.close();                // works only for tabs opened by a script
      window.location.replace('about:blank');       // fallback: blank page
    }, EXIT_FADE_MS + 400);
  };

  const handleSelect = (id) => {
    if (exiting) return;

    if (id === 'exit') {
      handleExit();
      return;
    }
    if (subMenus[id]) {              // Start, Load and Menu open their sub menus
      goTo(id);
      return;
    }
    console.log('Selected:', id);
  };

  // called when the bar has fully left the screen
  const handleBarHidden = () => {
    if (!nextView) return;
    setView(nextView);               // swap the menu while nobody can see it
    setNextView(null);
    setBarHidden(false);             // bar slides back in
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

      <ParallaxScene
        images={backgrounds}
        running={introDone}
        barHidden={barHidden}
        onBarHidden={handleBarHidden}
      >
        <MainMenu
          items={items}
          onSelect={handleSelect}
          onBack={view !== 'main' ? () => goTo('main') : undefined}
        />
      </ParallaxScene>

      {!introDone && (
        <IntroScreen
          audioRef={sfxRef}
          onStart={handleIntroStart}
          onDone={handleIntroDone}
        />
      )}

      {/* black screen for exiting, sits above everything */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: '#000',
          opacity: exiting ? 1 : 0,
          pointerEvents: exiting ? 'auto' : 'none',   // blocks clicks once exiting
          transition: `opacity ${EXIT_FADE_MS}ms ease-in-out`,
        }}
      />
    </>
  );
}