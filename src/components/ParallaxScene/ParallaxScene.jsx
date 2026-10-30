import useParallax from '../../hooks/useParallax';
import BackgroundSlideshow from '../BackgroundSlideshow/BackgroundSlideshow';
import './ParallaxScene.css';

export default function ParallaxScene({ images, running = true, children }) {
  const ref = useParallax();

  return (
    <main ref={ref} className="scene">
      <div className="scene__bg">
        <BackgroundSlideshow images={images} running={running} />
      </div>
      <div className="scene__panel">
        <div className="scene__bar">{children}</div>
      </div>
    </main>
  );
}