import { useState } from 'react'
import './Avatar.css'

const GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#f472b6,#a855f7)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#6366f1,#ec4899)',
];

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

const gradientFor = (seed = '') => {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

// Profile picture with an initials fallback and an optional presence dot.
const Avatar = ({ src, name, size = 44, online = false, ring = false, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showImage
        ? <img src={src} alt={name || ''} onError={() => setFailed(true)} loading="lazy" />
        : <span className="avatar-fallback" style={{ background: gradientFor(name) }}>{initialsOf(name)}</span>}
      {online && <span className="avatar-dot" style={{ width: Math.max(10, size * 0.26), height: Math.max(10, size * 0.26) }} />}
    </span>
  );
};

export default Avatar
