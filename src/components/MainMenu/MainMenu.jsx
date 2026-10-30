import './MainMenu.css';

export default function MainMenu({ items, onSelect, onBack }) {
  return (
    <>
      <nav className="menu" aria-label="Main menu">
        <ul className="menu__list">
          {items.map((item) => (
            <li key={item.id} className="menu__item">
              <button className="menu__button" onClick={() => onSelect(item.id)}>
                <span className="menu__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {onBack && (
        <button className="menu__back" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="9 5 16 12 9 19" />
          </svg>
        </button>
      )}
    </>
  );
}