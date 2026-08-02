import React, { useMemo, useState, useRef, useCallback } from 'react';

export type ChartPeriod = '1J' | '1S' | '1M' | '6M' | '1A' | '5A';

export interface ChartDataPoint {
  label: string;   // x-axis label shown in tooltip (e.g. "09:30", "26 juin", "Jan 2025")
  value: number;   // close/price in FCFA
}

interface PriceChartProps {
  ticker: string;
  changePct: number;
  lastPrice?: number;
  period?: ChartPeriod;
  data?: ChartDataPoint[];      // real data from API; undefined = use mock
  width?: number;
  height?: number;
}

// Period config for mock-data fallback only
const PERIOD_CONFIG: Record<
  ChartPeriod,
  { points: number; noise: number; xLabels: string[]; showRefLine: boolean }
> = {
  '1J': { points: 90,  noise: 1.0, xLabels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'], showRefLine: true },
  '1S': { points: 35,  noise: 1.6, xLabels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],                   showRefLine: false },
  '1M': { points: 22,  noise: 2.2, xLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],                  showRefLine: false },
  '6M': { points: 130, noise: 3.0, xLabels: ['Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],          showRefLine: false },
  '1A': { points: 260, noise: 3.8, xLabels: ['Août', 'Oct', 'Déc', 'Fév', 'Avr', 'Juil'],          showRefLine: false },
  '5A': { points: 260, noise: 5.5, xLabels: ['2022', '2023', '2024', '2025', '2026'],               showRefLine: false },
};

const PERIOD_SEED_OFFSET: Record<ChartPeriod, number> = {
  '1J': 0, '1S': 7777, '1M': 31337, '6M': 99991, '1A': 131071, '5A': 524287,
};

function seededRand(seed: number) {
  let x = (seed || 1) & 0x7fffffff;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PAD_LEFT   = 8;
const PAD_RIGHT  = 64;
const PAD_TOP    = 20;
const PAD_BOTTOM = 8;

function buildMockPoints(
  ticker: string, period: ChartPeriod, changePct: number, lastPrice: number,
): ChartDataPoint[] {
  const cfg = PERIOD_CONFIG[period];
  const N = cfg.points;
  const seedBase = hashString(ticker) + PERIOD_SEED_OFFSET[period];
  const rand = seededRand(seedBase + Math.round(Math.abs(changePct) * 10));
  const drift = changePct / 100;
  const noiseScale = 0.006 * cfg.noise;
  const meanRevert = period === '1J' ? 0.12 : period === '1S' ? 0.09 : 0.06;

  let y = 0.5;
  const normalized: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const target = 0.52 - drift * t;
    y += (target - y) * meanRevert + (rand() - 0.5) * noiseScale;
    normalized.push(y);
  }

  const minN = Math.min(...normalized);
  const maxN = Math.max(...normalized);
  const rangeN = maxN - minN || 0.001;

  // Scale normalized values to real price range
  const swingFactor =
    period === '5A' ? 0.35 : period === '1A' ? 0.20 : period === '6M' ? 0.12 : 0.05;
  const baseSwing = Math.max(swingFactor, Math.abs(changePct / 100) * 2);
  const priceMin = lastPrice * (1 - baseSwing * 1.2);
  const priceMax = lastPrice * (1 + baseSwing * 0.6);
  const priceRange = priceMax - priceMin;

  return normalized.map((n, i) => ({
    label: `${i}`,
    value: priceMin + ((n - minN) / rangeN) * priceRange,
  }));
}

export default function PriceChart({
  ticker,
  changePct,
  lastPrice,
  period = '1J',
  data,
  width = 720,
  height = 300,
}: PriceChartProps) {
  const positive = changePct >= 0;
  const color = positive ? '#00A468' : '#E23A3A';
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;
  const cfg = PERIOD_CONFIG[period];

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Resolve data: use real data if provided and non-empty, else mock
  const points: ChartDataPoint[] = useMemo(() => {
    if (data && data.length > 1) return data;
    if (lastPrice) return buildMockPoints(ticker, period, changePct, lastPrice);
    return [];
  }, [data, ticker, period, changePct, lastPrice]);

  const { coords, linePath, areaPath, openY, priceLabels } = useMemo(() => {
    if (points.length < 2) return { coords: [], linePath: '', areaPath: '', openY: 0, priceLabels: [] };

    const values = points.map(p => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const rangeV = maxV - minV || 0.001;

    const toSvgY = (v: number) =>
      PAD_TOP + (1 - (v - minV) / rangeV) * chartH * 0.88 + chartH * 0.06;
    const toSvgX = (i: number) =>
      PAD_LEFT + (i / (points.length - 1)) * chartW;

    const coords = points.map((p, i): [number, number] => [toSvgX(i), toSvgY(p.value)]);
    const last = coords[coords.length - 1];

    const linePath = coords
      .map(([cx, cy], i) => `${i === 0 ? 'M' : 'L'} ${cx.toFixed(1)} ${cy.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L ${last[0].toFixed(1)} ${height - PAD_BOTTOM} L ${PAD_LEFT} ${height - PAD_BOTTOM} Z`;

    const openY = PAD_TOP + chartH * 0.38;

    // Y-axis labels: 3 evenly spaced price ticks
    const steps = [0.25, 0.5, 0.75].map(f => minV + f * rangeV);
    const priceLabels = steps.map(price => {
      const norm = (price - minV) / rangeV;
      const yPos = PAD_TOP + (1 - norm) * chartH * 0.88 + chartH * 0.06;
      return {
        y: yPos,
        label: price >= 1000
          ? Math.round(price).toLocaleString('fr-FR')
          : price.toFixed(2),
      };
    });

    return { coords, linePath, areaPath, openY, priceLabels };
  }, [points, chartW, chartH, height]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Map pixel x to SVG coordinate x
    const rawX = ((e.clientX - rect.left) / rect.width) * width;
    // Find nearest data point by x distance
    let nearest = 0;
    let minDist = Infinity;
    coords.forEach(([cx], i) => {
      const d = Math.abs(cx - rawX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    setHoverIdx(nearest);
  }, [coords, width]);

  const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

  const gradId = `grad-${ticker}-${period}`;
  const hovered = hoverIdx !== null && coords[hoverIdx] ? {
    x: coords[hoverIdx][0],
    y: coords[hoverIdx][1],
    point: points[hoverIdx],
  } : null;

  // Tooltip positioning: flip to left side when near right edge
  const tooltipW = 96;
  const tooltipX = hovered
    ? (hovered.x + tooltipW + PAD_RIGHT > width ? hovered.x - tooltipW - 6 : hovered.x + 6)
    : 0;

  const formatPrice = (v: number) =>
    v >= 1000 ? Math.round(v).toLocaleString('fr-FR') : v.toFixed(2);

  if (points.length < 2) {
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-testid="price-chart">
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="12" fill="#A1A1A6" fontFamily="Inter, system-ui">
          Données indisponibles
        </text>
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      data-testid="price-chart"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: hoverIdx !== null ? 'crosshair' : 'default' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="85%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Dotted reference line — opening price, 1D only */}
      {cfg.showRefLine && !hovered && (
        <line
          x1={PAD_LEFT} y1={openY} x2={width - PAD_RIGHT} y2={openY}
          stroke="rgba(0,0,0,0.20)" strokeDasharray="3 5" strokeWidth="1"
        />
      )}

      {/* Y-axis price labels */}
      {priceLabels.map((lbl, i) => (
        <text key={i} x={width - PAD_RIGHT + 8} y={lbl.y + 4}
          fontSize="10" fill="#A1A1A6" fontFamily="Inter, system-ui, sans-serif">
          {lbl.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Price line */}
      <path d={linePath} stroke={color} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot (hidden when hovering) */}
      {!hovered && (
        <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]}
          r="3.5" fill={color} />
      )}

      {/* Last price tag (hidden when hovering) */}
      {typeof lastPrice === 'number' && !hovered && (
        <g transform={`translate(${width - PAD_RIGHT + 4}, ${coords[coords.length - 1][1] - 10})`}>
          <rect width={PAD_RIGHT - 8} height="20" rx="5"
            fill={positive ? 'rgba(0,164,104,0.14)' : 'rgba(226,58,58,0.12)'} />
          <text x={(PAD_RIGHT - 8) / 2} y="14" textAnchor="middle"
            fontSize="11" fontWeight="600" fill={color} fontFamily="Inter, system-ui, sans-serif">
            {formatPrice(lastPrice)}
          </text>
        </g>
      )}

      {/* ── HOVER OVERLAY ── */}
      {hovered && (
        <g>
          {/* Vertical crosshair */}
          <line
            x1={hovered.x} y1={PAD_TOP}
            x2={hovered.x} y2={height - PAD_BOTTOM}
            stroke="rgba(0,0,0,0.18)" strokeWidth="1"
          />
          {/* Dot at hover point */}
          <circle cx={hovered.x} cy={hovered.y} r="4.5" fill={color} />

          {/* Tooltip card */}
          <g transform={`translate(${tooltipX}, ${Math.min(hovered.y - 26, height - PAD_BOTTOM - 46)})`}>
            <rect width={tooltipW} height="44" rx="8"
              fill="white" stroke="rgba(0,0,0,0.09)" strokeWidth="1"
              filter="drop-shadow(0 2px 8px rgba(0,0,0,0.10))" />
            <text x="10" y="17" fontSize="10" fill="#6B6B6B" fontFamily="Inter, system-ui">
              {hovered.point.label}
            </text>
            <text x="10" y="34" fontSize="13" fontWeight="600" fill="#0A0A0A" fontFamily="Inter, system-ui">
              {formatPrice(hovered.point.value)} F
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

export function getXLabels(period: ChartPeriod): string[] {
  return PERIOD_CONFIG[period].xLabels;
}
