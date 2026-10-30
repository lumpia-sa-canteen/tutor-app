import './SessionScreen.css';

export default function SessionScreen({
  character = '/resources/character.png',
  text = '',
}) {
  return (
    <section className="session">
      <img className="session__character" src={character} alt="" draggable="false" />

      <div className="session__dialog">
        <p className="session__text">{text}</p>
      </div>
    </section>
  );
}