import { useEffect, useRef, useState } from 'react';
import './DeepDiveScreen.css';

// the Deep Dive screen: black for now, the functions come later.
// codename is the session it was started from.
export default function DeepDiveScreen({ codename, onHome }) {
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  // clicking anywhere outside the dropdown closes it
  useEffect(() => {
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <main className="dive" data-codename={codename}>
      <div className="dive__nav" ref={navRef}>
        <button
          className="dive__toggle"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Menu
          <span className={`dive__caret ${open ? 'dive__caret--open' : ''}`} aria-hidden="true">▾</span>
        </button>

        {open && (
          <ul className="dive__list" role="menu">
            <li role="none">
              <button className="dive__item" role="menuitem" onClick={onHome}>
                Main Menu
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* add the deep dive content here */}
    </main>
  );
}