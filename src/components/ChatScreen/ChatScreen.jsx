import { useEffect, useRef, useState } from 'react';
import useParallax from '../../hooks/useParallax';
import { getReply } from './getReply';
import { splitReply, extFor, saveBlock } from './downloadFile';
import './ChatScreen.css';

export default function ChatScreen({
  character = '/resources/Civilight_Eterna.png',
  codename = '',
  botName = 'Civilight-Eterna',
  onHome,                                        // called when the Home bar is pressed
}) {
  const ref = useParallax();
  const listRef = useRef(null);
  const idRef = useRef(1);                       // next message id
  const hopTimer = useRef(null);                 // timer for the "file created" hop
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 0,
      role: 'bot',
      text: `Hello, ${codename || 'Doctor'}. What would you like to talk about?`,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);   // true while the bot is "typing"
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState(false); // true while the file icon hops

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);

  // clear the hop timer when leaving the screen
  useEffect(() => () => clearTimeout(hopTimer.current), []);

  // clicking anywhere outside the menu closes it
  const handleScreenClick = (e) => {
    if (menuOpen && !e.target.closest('.session__menu')) setMenuOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || waiting) return;

    const next = [...messages, { id: idRef.current++, role: 'user', text }];
    setMessages(next);
    setDraft('');
    setWaiting(true);

    try {
      const reply = await getReply(next);

      // the reply contains a file: make the icon hop near her head
      if (reply.includes('```')) {
        setCreating(true);
        clearTimeout(hopTimer.current);
        hopTimer.current = setTimeout(() => setCreating(false), 2600);
      }

      setConnected(true);
      setMessages((m) => [...m, { id: idRef.current++, role: 'bot', text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: 'bot', text: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setWaiting(false);
    }
  };

  return (
    <section ref={ref} className="chat" onClick={handleScreenClick}>
      {/* character: fades in on the left */}
      <div className="chat__character">
        <img src={character} alt="" draggable="false" />

        {/* file icon that hops near the head while a file is created */}
        <div className={`chat__hop ${creating ? 'chat__hop--on' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
            <line x1="10" y1="13" x2="16" y2="13" />
            <line x1="10" y1="17" x2="16" y2="17" />
          </svg>
        </div>
      </div>

      {/* chat box: slides in from the right */}
      <div className="chat__dock">
        <div className="chat__panel">
          <header className="chat__header">
            <div>
              <h2 className="chat__title">{botName}</h2>
              {codename && <p className="chat__sub">Codename: {codename}</p>}
            </div>
            <span className="chat__status">
              {connected ? 'Connected to DWDB-221E' : 'Cant connect to the neural network'}
            </span>
          </header>

          <ul className="chat__list" ref={listRef}>
            {messages.map((m) => (
              <li key={m.id} className={`chat__msg chat__msg--${m.role}`}>
                <div className="chat__bubble">
                  {splitReply(m.text).map((part, i) =>
                    part.type === 'code' ? (
                      <div key={i} className="chat__code">
                        <pre><code>{part.content}</code></pre>
                        <button
                          type="button"
                          className="chat__download"
                          onClick={() => saveBlock(part.lang, part.content)}
                        >
                          Download .{extFor(part.lang)}
                        </button>
                      </div>
                    ) : (
                      <span key={i} className="chat__text">{part.content}</span>
                    )
                  )}
                </div>
              </li>
            ))}

            {waiting && (
              <li className="chat__msg chat__msg--bot">
                <p className="chat__bubble chat__typing" aria-label="typing">
                  <span />
                  <span />
                  <span />
                </p>
              </li>
            )}
          </ul>

          <form className="chat__form" onSubmit={handleSend}>
            <input
              className="chat__input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              autoComplete="off"
              aria-label="Message"
            />
            <button
              type="submit"
              className="chat__send"
              disabled={!draft.trim() || waiting}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* blurs the character and chat while the menu is open (same layer as the session screen) */}
      <div className={`session__blur ${menuOpen ? 'session__blur--on' : ''}`} />

      {/* dropdown menu (uses the same styles as the session screen's menu) */}
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
          {/* Home: goes back to the main menu */}
          <button className="session__bar" style={{ '--i': 0 }} onClick={onHome}>
            <span className="session__circle">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 11.5 12 5l8 6.5" />
                <path d="M6.5 10v9h11v-9" />
              </svg>
            </span>
            <span className="session__bar-label">Home</span>
          </button>
        </div>
      </div>
    </section>
  );
}