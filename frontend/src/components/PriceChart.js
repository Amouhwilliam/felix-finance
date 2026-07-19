import React, { useMemo } from 'react';

// Deterministic pseudo-random line chart based on ticker + change direction.
// Light-theme friendly. Includes a dotted baseline and a labeled last-price pill.

function seededRand(seed) {
  let x = seed || 1;
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

export default function PriceChart({ ticker, changePct, lastPrice, width = 720, height = 300 }) {
  const positive = changePct >= 0;
  const color = positive ? '#00A468' : '#E23A3A';
  const softColor = positive ? 'rgba(0, 164, 104, 0.18)' : 'rgba(226, 58, 58, 0.15)';

  const { path, area, dot, lastY, maxY, minY } = useMemo(() => {
    const N = 90;
    const rand = seededRand(hashString(ticker) + Math.round(changePct * 100));
    const drift = changePct / 100;
    const noise = 0.010 + Math.abs(changePct) * 0.001;

    let y = 0.5;
    const points = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const target = 0.55 - drift * t;
      y += (target - y) * 0.14 + (rand() - 0.5) * noise;
      points.push(y);
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const pad = 0.10;
    const norm = points.map((v) => (v - min) / (max - min || 1));

    const px = 12, py = 24;
    const w = width - px * 2 - 60; // reserve right-side gutter for price labels
    const h = height - py * 2;
    const coord = norm.map((v, i) => {
      const x = px + (i / (N - 1)) * w;
      const yPos = py + (1 - v) * h * (1 - pad) + (pad * h) / 2;
      return [x, yPos];
    });
    const d = coord.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
    const areaD = `${d} L ${coord[coord.length - 1][0].toFixed(2)} ${height - py} L ${coord[0][0].toFixed(2)} ${height - py} Z`;
    const last = coord[coord.length - 1];
    return { path: d, area: areaD, dot: last, lastY: last[1], maxY: py, minY: height - py };
  }, [ticker, changePct, width, height]);

  const gradId = `g-${ticker}`;
  const openY = maxY + (minY - maxY) * 0.35;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-testid="price-chart">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Reference dotted line (previous close) */}
      <line x1="0" y1={openY} x2={width - 60} y2={openY} stroke="rgba(0,0,0,0.14)" strokeDasharray="2 4" strokeWidth="1" />

      {/* Area + line */}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dot on last point */}
      <circle cx={dot[0]} cy={dot[1]} r="3.2" fill={color} />

      {/* Last-price pill on the right */}
      {typeof lastPrice === 'number' && (
        <g transform={`translate(${width - 58}, ${lastY - 12})`}>
          <rect width="54" height="22" rx="6" fill={softColor} />
          <text x="27" y="15" textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>
            {lastPrice.toLocaleString('fr-FR')}
          </text>
        </g>
      )}
    </svg>
  );
}
