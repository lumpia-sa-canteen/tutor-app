import { useEffect, useRef } from 'react';

// parallax effect 

export default function useParallax(ease = 0.08)
{
const ref = useRef(null);

useEffect(() => 
{
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reudce)').matches) return;

    const target = { x: 0, y: 0};
    const current = { x: 0, y: 0};
    let frame;

    const onMove = (e) =>
    {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onLeave = () => 
    {
        target.x = 0;
        target.y = 0;
    };

    const tick = () =>
    {
        current.x += (target.x - current.x) * ease;
        current.y += (target.y - current.y) * ease;
        el.style.setProperty('--mx', current.x.toFixed(4));
        el.style.setProperty('--my', current.y.toFixed(4));
        frame = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document,addEventListener('mouseleave',onLeave);
    tick();

    return () =>
    {
        cancelAnimationFrame(frame);
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseleave', onLeave);
    };
}, [ease]);

 return ref;
}