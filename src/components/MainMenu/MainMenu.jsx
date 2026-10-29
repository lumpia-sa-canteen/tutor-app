import './MainMenu.css';

export default function MainMenu({ items, onSelect }) {
  return (
    <nav className="menu" aria-label="Main menu">
      <ul className="menu__list">
        {items.map((item) => (
          <li key={item.id} className="menu__item">
            <button className="menu__button" onClick={() => onSelect(item.id)}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
