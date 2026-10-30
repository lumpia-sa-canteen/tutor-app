import { useEffect, useState } from 'react';
import './BackgroundSlideshow.css';

export default function BackgroundSlideshow({
  images,
  interval = 5000,   // time each picture stays, in ms
  running = true,    // false pauses the cycling
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!running || images.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);   // wraps back to the first picture
    }, interval);
    return () => clearInterval(id);
  }, [running, images.length, interval]);

  return (
    <div className="bgshow" aria-hidden="true">
      {images.map((src, i) => (
        <div
          key={src}
          className={`bgshow__layer ${i === index ? 'bgshow__layer--active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}