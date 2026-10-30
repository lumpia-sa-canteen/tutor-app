import useParallax from '../../hooks/useParallax';
import BackgroundSlideshow from '../BackgroundSlideshow/BackgroundSlideshow';
import './ParallaxScene.css';

export default function ParallaxScene({
  images,
  running = true,
  title = 'Civilight-Eterna',
  barHidden = false,        // true slides the white bar off to the right
  onBarHidden,              // called once the bar has fully slid out
  extraBar = null,          // optional second bar stacked above the main one
  extraBarHidden = true,    // true keeps the second bar off screen
  children,
}) {
  const ref = useParallax();

  const handleBarTransitionEnd = (e) => {
    // only the bar's own slide, and only when it just slid out
    if (e.target === e.currentTarget && e.propertyName === 'transform' && barHidden) {
      onBarHidden?.();
    }
  };

  return (
    <main ref={ref} className="scene">
      <div className="scene__bg">
        <BackgroundSlideshow images={images} running={running} />
      </div>

      <h1 className="scene__title">{title}</h1>

      <div className="scene__panel">
        {extraBar && (
          <div
            className={`scene__bar scene__bar--extra ${extraBarHidden ? 'scene__bar--out' : ''}`}
          >
            {extraBar}
          </div>
        )}

        <div
          className={`scene__bar ${barHidden ? 'scene__bar--out' : ''}`}
          onTransitionEnd={handleBarTransitionEnd}
        >
          {children}
        </div>
      </div>
    </main>
  );
}