import './VolumeControl.css';

// one labeled slider, used for both the Volume bar and the SFX bar
export function VolumeSlider({ label, value, onChange, onCommit }) {
  return (
    <div className="volume">
      <span className="volume__label">{label}</span>

      <input
        className="volume__slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}   // lets you hear the new level when you let go
        onKeyUp={(e) => {
          if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') onCommit?.();
        }}
        aria-label={label}
        style={{ '--fill': `${value}%` }}
      />

      <output className="volume__value">{value}</output>
    </div>
  );
}

export default function VolumeControl({ volume, onChange, onBack }) {
  return (
    <>
      <VolumeSlider label="Volume" value={volume} onChange={onChange} />

      <button className="menu__back" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="9 5 16 12 9 19" />
        </svg>
      </button>
    </>
  );
}