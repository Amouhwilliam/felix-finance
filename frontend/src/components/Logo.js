import React, { useState } from 'react';
import { logoUrl } from '../data/mockData';

// Renders the real company logo with a graceful fallback to a monogram badge
// (used when the logo image fails to load).

export default function Logo({ ticker, size = 40, rounded = 'rounded-full', className = '' }) {
  const [broken, setBroken] = useState(false);
  const px = typeof size === 'number' ? `${size}px` : size;

  if (broken) {
    return (
      <div
        className={`${rounded} bg-surface text-ink flex items-center justify-center font-bold shrink-0 ${className}`}
        style={{ width: px, height: px, fontSize: typeof size === 'number' ? size * 0.32 : undefined }}
        aria-hidden="true"
      >
        {ticker.slice(0, 4)}
      </div>
    );
  }

  return (
    <div
      className={`${rounded} bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      <img
        src={logoUrl(ticker)}
        alt={ticker}
        onError={() => setBroken(true)}
        className="w-[78%] h-[78%] object-contain"
        loading="lazy"
      />
    </div>
  );
}
