import React, { useMemo } from 'react';

// Deterministic pseudo-random line chart based on the ticker + change direction.
// Generates a nicely shaped path so up-days trend up and down-days trend down.

function seededRand(seed) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function PriceChart({ ticker, changePct, width = 340, height = 180 }) {
  const positive = changePct >= 0;
  const color = positive ? '#00D084' : '#FF4D4D';

  const { path, area, dot } = useMemo(() => {
    const N = 60;
    const rand = seededRand(hashString(ticker) + Math.round(changePct * 100));
    const drift = changePct / 100; // total intraday drift
    const noise = 0.012 + Math.abs(changePct) * 0.001;

    let y = 0.5;
    const points = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      // trend from ~0.6 (open) to (0.6 - drift) for downward-inverted-y logic
      const target = 0.55 - drift * t;
      y += (target - y) * 0.15 + (rand() - 0.5) * noise;
      points.push(y);
    }

    // Normalize to fit chart with padding
    const min = Math.min(...points);
    const max = Math.max(...points);
    const pad = 0.08;
    const norm = points.map((v) => (v - min) / (max - min || 1));

    const px = 12;
    const py = 12;
    const w = width - px * 2;
    const h = height - py * 2;
    const coord = norm.map((v, i) => {
      const x = px + (i / (N - 1)) * w;
      // higher value = drawn lower for a "up over time" chart when drift positive.
      // We invert so "up" trend goes up on screen: yPos = py + (1 - v)*h * (1-pad) + pad*h/2
      const yPos = py + (1 - v) * h * (1 - pad) + (pad * h) / 2;
      return [x, yPos];
    });
    const d = coord
      .map((p, i) => (i === 0 ? `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}` : `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`))
      .join(' ');
    const areaD = `${d} L ${coord[coord.length - 1][0].toFixed(2)} ${height - py} L ${coord[0][0].toFixed(2)} ${height - py} Z`;
    const last = coord[coord.length - 1];
    return { path: d, area: areaD, dot: last };
  }, [ticker, changePct, width, height]);

  const gradId = `g-${ticker}`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-testid="price-chart">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline dotted */}
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="2 4"
        strokeWidth="1"
      />
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={dot[0]} cy={dot[1]} r="3" fill={color} />
    </svg>
  );
}
