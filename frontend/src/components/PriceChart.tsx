import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type ChartPeriod = '1J' | '1S' | '1M' | '3M' | '1A' | '5A';

export interface ChartDataPoint {
  label: string;   // x-axis label shown in tooltip (e.g. "09:30", "26 juin", "Jan 2025")
  value: number;   // close/price in FCFA
}

interface PriceChartProps {
  ticker: string;
  changePct: number;
  lastPrice?: number;
  period?: ChartPeriod;
  loading?: boolean;
  data?: ChartDataPoint[];
  width?: number;
  height?: number;
}

const PERIOD_CONFIG: Record<ChartPeriod, { showRefLine: boolean }> = {
  '1J': { showRefLine: true },
  '1S': { showRefLine: false },
  '1M': { showRefLine: false },
  '3M': { showRefLine: false },
  '1A': { showRefLine: false },
  '5A': { showRefLine: false },
};

const PAD_LEFT   = 8;
const PAD_RIGHT  = 64;
const PAD_TOP    = 20;
const PAD_BOTTOM = 8;


export default function PriceChart({
  ticker,
  changePct,
  lastPrice,
  period = '1J',
  loading = false,
  data,
  width = 720,
  height = 300,
}: PriceChartProps) {
  const { t } = useTranslation();
  const positive = changePct >= 0;
  const color = positive ? '#00A468' : '#E23A3A';
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;
  const cfg = PERIOD_CONFIG[period];

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points: ChartDataPoint[] = useMemo(() => {
    if (data && data.length > 1) return data;
    return [];
  }, [data]);

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

  // Initial load with no previous data — show a subtle pulsing skeleton line
  if (loading && points.length < 2) {
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        data-testid="price-chart-loading"
      >
        <line
          x1={PAD_LEFT} y1={height / 2}
          x2={width - PAD_RIGHT} y2={height / 2}
          stroke="#E8E8ED" strokeWidth="2" strokeLinecap="round"
          style={{ animation: 'pulse 1.8s ease-in-out infinite' }}
        />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </svg>
    );
  }

  // No intraday data today (market closed) — flat dashed line at last price
  if (!loading && points.length < 2 && period === '1J' && typeof lastPrice === 'number' && lastPrice > 0) {
    const lineY = height / 2;
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        data-testid="price-chart-flat"
      >
        <line
          x1={PAD_LEFT} y1={lineY} x2={width - PAD_RIGHT} y2={lineY}
          stroke="#D1D1D6" strokeWidth="1.5" strokeDasharray="4 7" strokeLinecap="round"
        />
        <g transform={`translate(${width - PAD_RIGHT + 4}, ${lineY - 10})`}>
          <rect width={PAD_RIGHT - 8} height="20" rx="5" fill="rgba(0,0,0,0.06)" />
          <text x={(PAD_RIGHT - 8) / 2} y="14" textAnchor="middle"
            fontSize="11" fontWeight="600" fill="#6B6B6B" fontFamily="Inter, system-ui, sans-serif">
            {formatPrice(lastPrice)}
          </text>
        </g>
      </svg>
    );
  }

  // No data for other periods
  if (!loading && points.length < 2) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center gap-3"
        data-testid="price-chart-empty"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <div className="text-center">
          <p className="text-[13px] text-[#A1A1A6]">{t('stock.no_chart_data')}</p>
          <p className="text-[12px] text-[#C7C7CC] mt-0.5">{t('stock.no_chart_data_sub')}</p>
        </div>
      </div>
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
      style={{
        cursor: hoverIdx !== null ? 'crosshair' : 'default',
        opacity: loading ? 0.45 : 1,
        transition: 'opacity 0.2s ease',
      }}
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

