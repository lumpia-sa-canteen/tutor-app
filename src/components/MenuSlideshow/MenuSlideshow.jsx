import { useEffect, useState } from 'react';

// cross-fades through the pictures: one change every `intervalMs`
export default function MenuSlideshow({ images, intervalMs = 3000, fadeMs = 1000, opacity = 1, visible = true }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible || images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs, visible]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: visible ? opacity : 0,
        transition: 'opacity 0.5s',
      }}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === index ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}