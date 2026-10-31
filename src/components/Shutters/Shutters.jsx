import './Shutters.css';

// two black panels that close from the top and bottom, like a theater curtain
export default function Shutters({ onClosed }) {
  return (
    <div className="shutters" aria-hidden="true">
      <div
        className="shutters__panel shutters__panel--top"
        onAnimationEnd={onClosed}      // called once they have met in the middle
      />
      <div className="shutters__panel shutters__panel--bottom" />
    </div>
  );
}