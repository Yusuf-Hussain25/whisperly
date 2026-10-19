import React, { useId } from 'react'

// Whisperly mark: a speech bubble with a soft sound wave inside.
export const LogoMark = ({ size = 32 }) => {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset=".55" stopColor="#6366F1" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-g)`} />
      <path d="M9 10.5A3.5 3.5 0 0 1 12.5 7h7A3.5 3.5 0 0 1 23 10.5v6a3.5 3.5 0 0 1-3.5 3.5H15l-4.2 3.6c-.6.5-1.5.1-1.5-.7V20.2A3.5 3.5 0 0 1 9 17.5z" fill="#fff" fillOpacity=".95" />
      <path d="M13 13.5h.01M16 11.5v4M19 12.5v2" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

const Logo = ({ size = 32, showText = true }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size} />
    {showText && (
      <span style={{ fontWeight: 650, fontSize: size * 0.6, letterSpacing: '-0.03em' }}>Whisperly</span>
    )}
  </span>
);

export default Logo
