import { useCallback, useEffect, useRef, useState } from 'react';
import ParallaxScene from './components/ParallaxScene/ParallaxScene';
import MainMenu from './components/MainMenu/MainMenu';
import VolumeControl, { VolumeSlider } from './components/VolumeControl/VolumeControl';
import IntroScreen from './components/IntroScreen/IntroScreen';
import SessionScreen from './components/SessionScreen/SessionScreen';
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

// where the back button goes from each screen
const backTarget = {
  start: 'main',
  load: 'main',
  menu: 'main',
  volume: 'menu',
};

const CLICK_SFX_SRC = '/resources/sfx1.mp3';
const BGM_FADE_IN_MS = 2000;
const EXIT_FADE_MS = 2500;   // black screen and music fade out together

// New Session transition                                                  // changed
const MENU_FADE_OUT_MS = 5000;    // menu fades to black while its music fades out
const SESSION_FADE_IN_MS = 5000;  // session screen fades in while its music fades in

// smooth = true uses an ease-in-out curve so it matches the screen fade     // changed
function fadeVolume(audio, from, to, ms, smooth = false) {
  const start = performance.now();
  audio.volume = from;
  const step = (now) => {
    const t = Math.min((now - start) / ms, 1);
    const k = smooth ? t * t * (3 - 2 * t) : t;
    audio.volume = from + (to - from) * k;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [screen, setScreen] = useState('menu');      // 'menu' or 'session'
  const [view, setView] = useState('main');          // 'main', 'start', 'load', 'menu' or 'volume'
  const [nextView, setNextView] = useState(null);    // where the bar is heading
  const [barHidden, setBarHidden] = useState(false);
  const [curtain, setCurtain] = useState(false);     // black overlay for screen changes
  const [curtainMs, setCurtainMs] = useState(MENU_FADE_OUT_MS);   // changed: fade length of the curtain
  const [exiting, setExiting] = useState(false);
  const [volume, setVolume] = useState(60);          // music, 0 to 100
  const [sfxVolume, setSfxVolume] = useState(80);    // button sounds, 0 to 100
  const sfxVolumeRef = useRef(0.8);                  // lets playClick read the latest level
  const busyRef = useRef(false);                     // true while a screen change runs
  const sfxRef = useRef(null);                       // the intro sound
  const bgmRef = useRef(null);                       // menu music
  const sessionBgmRef = useRef(null);                // New Session music

  const items = subMenus[view] ?? menuItems;

  // plays the button sound; a new Audio each time so fast clicks can overlap
  const playClick = useCallback(() => {
    const click = new Audio(CLICK_SFX_SRC);
    click.volume = sfxVolumeRef.current;
    click.play().catch(() => {});
  }, []);

  // one listener for the whole page: any <button> click plays the sound
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest('button')) playClick();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [playClick]);

  // slide the bar out, then show the other screen
  const goTo = (target) => {
    if (barHidden) return;           // ignore clicks while the bar is sliding
    setNextView(target);
    setBarHidden(true);
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    bgmRef.current.volume = v / 100;   // applies to the music right away
  };

  const handleSfxChange = (v) => {
    setSfxVolume(v);
    sfxVolumeRef.current = v / 100;
  };

  // menu -> New Session screen                                              // changed
  const startSession = () => {
    if (busyRef.current) return;
    busyRef.current = true;

    // 1. the menu fades to black while the menu music fades out, same duration
    const bgm = bgmRef.current;
    setCurtainMs(MENU_FADE_OUT_MS);
    setCurtain(true);
    fadeVolume(bgm, bgm.volume, 0, MENU_FADE_OUT_MS, true);

    setTimeout(() => {
      // 2. fully black and silent: swap to the session screen
      bgm.pause();
      setScreen('session');
      setView('main');

      // 3. the session screen fades in while its music fades in, same duration
      const sessionBgm = sessionBgmRef.current;
      sessionBgm.currentTime = 0;
      sessionBgm.volume = 0;
      sessionBgm.play().catch(() => {});
      fadeVolume(sessionBgm, 0, volume / 100, SESSION_FADE_IN_MS, true);
      setCurtainMs(SESSION_FADE_IN_MS);
      setCurtain(false);

      setTimeout(() => {
        busyRef.current = false;
      }, SESSION_FADE_IN_MS);
    }, MENU_FADE_OUT_MS);
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
    if (exiting || busyRef.current) return;

    if (id === 'exit') {
      handleExit();
      return;
    }
    if (id === 'new-session') {
      startSession();
      return;
    }
    if (subMenus[id] || id === 'volume') {   // sub menus and the volume screen
      goTo(id);
      return;
    }
    console.log('Selected:', id);
  };

  // called when the bar has fully left the screen
  const handleBarHidden = () => {
    if (!nextView) return;
    setView(nextView);               // swap the screen while nobody can see it
    setNextView(null);
    setBarHidden(false);             // bar slides back in
  };

  const handleIntroStart = () => {
    const bgm = bgmRef.current;
    bgm.volume = 0;
    bgm.play().then(() => bgm.pause()).catch(() => {});

    // unlock the session music too, so it is allowed to start later
    const sessionBgm = sessionBgmRef.current;
    sessionBgm.volume = 0;
    sessionBgm.play().then(() => sessionBgm.pause()).catch(() => {});
  };

  const handleIntroDone = () => {
    setIntroDone(true);
    const bgm = bgmRef.current;
    bgm.currentTime = 0;
    bgm.volume = 0;
    bgm.play().catch(() => {});
    fadeVolume(bgm, 0, volume / 100, BGM_FADE_IN_MS);
  };

  return (
    <>
      <audio ref={sfxRef} src="/resources/okaeri_sfx.mp3" preload="auto" />
      <audio ref={bgmRef} src="/resources/main_menu_bgm.mp3" preload="auto" loop />
      <audio ref={sessionBgmRef} src="/resources/session_screen_bgm1.mp3" preload="auto" loop />

      {screen === 'menu' ? (
        <ParallaxScene
          images={backgrounds}
          running={introDone}
          barHidden={barHidden}
          onBarHidden={handleBarHidden}
          extraBar={
            <VolumeSlider
              label="SFX"
              value={sfxVolume}
              onChange={handleSfxChange}
              onCommit={playClick}
            />
          }
          extraBarHidden={barHidden || view !== 'volume'}
        >
          {view === 'volume' ? (
            <VolumeControl
              volume={volume}
              onChange={handleVolumeChange}
              onBack={() => goTo(backTarget.volume)}
            />
          ) : (
            <MainMenu
              items={items}
              onSelect={handleSelect}
              onBack={backTarget[view] ? () => goTo(backTarget[view]) : undefined}
            />
          )}
        </ParallaxScene>
      ) : (
        <SessionScreen
          character="/resources/character.png"
          text="Welcome back. Shall we begin?"
        />
      )}

      {!introDone && (
        <IntroScreen
          audioRef={sfxRef}
          onStart={handleIntroStart}
          onDone={handleIntroDone}
        />
      )}

      {/* black curtain for changing screens */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9500,
          background: '#000',
          opacity: curtain ? 1 : 0,
          pointerEvents: curtain ? 'auto' : 'none',
          transition: `opacity ${curtainMs}ms ease-in-out`,   // changed: length comes from state
        }}
      />

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