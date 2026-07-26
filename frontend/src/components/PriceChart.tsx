import React, { useMemo } from 'react';

export type ChartPeriod = '1J' | '1S' | '1M' | '6M' | '1A' | '5A';

interface PriceChartProps {
  ticker: string;
  changePct: number;
  lastPrice?: number;
  period?: ChartPeriod;
  width?: number;
  height?: number;
}

// Period config: how many data points, x-axis labels, volatility multiplier
const PERIOD_CONFIG: Record<
  ChartPeriod,
  { points: number; noise: number; xLabels: string[]; showRefLine: boolean }
> = {
  '1J': {
    points: 90,
    noise: 1.0,
    xLabels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    showRefLine: true,
  },
  '1S': {
    points: 35,
    noise: 1.6,
    xLabels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
    showRefLine: false,
  },
  '1M': {
    points: 22,
    noise: 2.2,
    xLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    showRefLine: false,
  },
  '6M': {
    points: 130,
    noise: 3.0,
    xLabels: ['Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
    showRefLine: false,
  },
  '1A': {
    points: 260,
    noise: 3.8,
    xLabels: ['Août', 'Oct', 'Déc', 'Fév', 'Avr', 'Juil'],
    showRefLine: false,
  },
  '5A': {
    points: 260,
    noise: 5.5,
    xLabels: ['2022', '2023', '2024', '2025', '2026'],
    showRefLine: false,
  },
};

// Period-specific seed offset so each period looks different for the same ticker
const PERIOD_SEED_OFFSET: Record<ChartPeriod, number> = {
  '1J': 0,
  '1S': 7777,
  '1M': 31337,
  '6M': 99991,
  '1A': 131071,
  '5A': 524287,
};

function seededRand(seed: number) {
  let x = (seed || 1) & 0x7fffffff;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PAD_LEFT = 8;
const PAD_RIGHT = 64;
const PAD_TOP = 20;
const PAD_BOTTOM = 8;

export default function PriceChart({
  ticker,
  changePct,
  lastPrice,
  period = '1J',
  width = 720,
  height = 300,
}: PriceChartProps) {
  const positive = changePct >= 0;
  const color = positive ? '#00A468' : '#E23A3A';
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const cfg = PERIOD_CONFIG[period];

  const { linePath, areaPath, dot, openY, priceLabels } = useMemo(() => {
    const N = cfg.points;
    const seedBase = hashString(ticker) + PERIOD_SEED_OFFSET[period];
    const rand = seededRand(seedBase + Math.round(Math.abs(changePct) * 10));

    const drift = changePct / 100;
    // Longer periods = stronger mean-reverting noise, more dramatic swings
    const noiseScale = 0.006 * cfg.noise;
    const meanRevert = period === '1J' ? 0.12 : period === '1S' ? 0.09 : 0.06;

    let y = 0.5;
    const raw: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      // Target drifts toward the final changePct direction
      const target = 0.52 - drift * t;
      y += (target - y) * meanRevert + (rand() - 0.5) * noiseScale;
      raw.push(y);
    }

    const minV = Math.min(...raw);
    const maxV = Math.max(...raw);
    const rangeV = maxV - minV || 0.001;

    const toY = (v: number) =>
      PAD_TOP + (1 - (v - minV) / rangeV) * chartH * 0.88 + chartH * 0.06;
    const toX = (i: number) => PAD_LEFT + (i / (N - 1)) * chartW;

    const coords = raw.map((v, i): [number, number] => [toX(i), toY(v)]);
    const last = coords[coords.length - 1];

    const linePath = coords
      .map(([cx, cy], i) => `${i === 0 ? 'M' : 'L'} ${cx.toFixed(1)} ${cy.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L ${last[0].toFixed(1)} ${height - PAD_BOTTOM} L ${PAD_LEFT} ${height - PAD_BOTTOM} Z`;

    // Dotted ref line — only for 1D (represents yesterday's close)
    const openY = PAD_TOP + chartH * 0.38;

    // Y-axis price labels derived from actual price range
    let priceLabels: { y: number; label: string }[] = [];
    if (lastPrice) {
      // For longer periods, use wider price swings
      const swingFactor =
        period === '5A' ? 0.35 : period === '1A' ? 0.20 : period === '6M' ? 0.12 : 0.05;
      const baseSwing = Math.max(swingFactor, Math.abs(changePct / 100) * 2);
      const priceMin = lastPrice * (1 - baseSwing * 1.2);
      const priceMax = lastPrice * (1 + baseSwing * 0.6);
      const priceRange = priceMax - priceMin;

      const steps = [0.25, 0.5, 0.75].map((f) => priceMin + f * priceRange);
      priceLabels = steps.map((price) => {
        const norm = (price - priceMin) / priceRange;
        const yPos = PAD_TOP + (1 - norm) * chartH * 0.88 + chartH * 0.06;
        return {
          y: yPos,
          label:
            price >= 1000
              ? Math.round(price).toLocaleString('fr-FR')
              : price.toFixed(2),
        };
      });

      // Add ref-line price label
      if (cfg.showRefLine) {
        priceLabels.push({
          y: openY,
          label: Math.round(lastPrice * (1 + Math.abs(changePct / 100) * 0.4)).toLocaleString(
            'fr-FR',
          ),
        });
      }
    }

    return { linePath, areaPath, dot: last, openY, priceLabels };
  }, [ticker, changePct, lastPrice, period, cfg, chartW, chartH, height]);

  const gradId = `grad-${ticker}-${period}`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      data-testid="price-chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="85%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Reference line — yesterday's close, 1D only */}
      {cfg.showRefLine && (
        <line
          x1={PAD_LEFT}
          y1={openY}
          x2={width - PAD_RIGHT}
          y2={openY}
          stroke="rgba(0,0,0,0.20)"
          strokeDasharray="3 5"
          strokeWidth="1"
        />
      )}

      {/* Y-axis price labels */}
      {priceLabels.map((lbl, i) => (
        <text
          key={i}
          x={width - PAD_RIGHT + 8}
          y={lbl.y + 4}
          fontSize="10"
          fill="#A1A1A6"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {lbl.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Price line */}
      <path
        d={linePath}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot at last price */}
      <circle cx={dot[0]} cy={dot[1]} r="3.5" fill={color} />

      {/* Price tag */}
      {typeof lastPrice === 'number' && (
        <g transform={`translate(${width - PAD_RIGHT + 4}, ${dot[1] - 10})`}>
          <rect
            width={PAD_RIGHT - 8}
            height="20"
            rx="5"
            fill={positive ? 'rgba(0,164,104,0.14)' : 'rgba(226,58,58,0.12)'}
          />
          <text
            x={(PAD_RIGHT - 8) / 2}
            y="14"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={color}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {lastPrice >= 1000
              ? Math.round(lastPrice).toLocaleString('fr-FR')
              : lastPrice.toFixed(2)}
          </text>
        </g>
      )}
    </svg>
  );
}

// Export the x-axis labels so StockDetail can render them without duplicating logic
export function getXLabels(period: ChartPeriod): string[] {
  return PERIOD_CONFIG[period].xLabels;
}
