import useParallax from '../../hooks/useParallax';
import './ParallaxScene.css';

export default function ParallaxScene({ image, children }) {
  const ref = useParallax();

  return (
    <main ref={ref} className="scene">
      <div className="scene__bg" style={{ backgroundImage: `url(${image})` }} />
      <div className="scene__panel">
        <div className="scene__bar">{children}</div>
      </div>
    </main>
  );
}