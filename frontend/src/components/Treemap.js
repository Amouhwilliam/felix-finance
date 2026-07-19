import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupBySector } from '../data/mockData';
import { squarify } from '../lib/squarify';
import { pctToColor, formatPct } from '../lib/format';

// Vertical stack of sector rows. Each row height is proportional to sector weight.
// Inside each row, a squarified treemap of stocks. Mobile-first and scrollable.

const SECTOR_HEADER_H = 24; // px, sector label bar
const MIN_ROW_H = 130; // ensures small sectors remain tappable and grid-like on mobile

export default function Treemap() {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const navigate = useNavigate();
  const groups = useMemo(() => groupBySector(), []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute per-sector row heights based on total weight, but respecting min row height.
  const rows = useMemo(() => {
    if (size.w === 0) return [];
    const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
    // Aim for a nicely dense treemap. On mobile we want scroll; on desktop we cap.
    const idealH = Math.max(size.w * 2.3, 900);
    // Distribute proportionally with a floor of MIN_ROW_H per sector.
    let heights = groups.map((g) => Math.max((g.totalWeight / totalW) * idealH, MIN_ROW_H));
    return groups.map((g, i) => {
      const rowH = heights[i];
      const bodyH = rowH - SECTOR_HEADER_H;
      const items = g.stocks.map((s) => ({ ...s, value: s.marketCapWeight }));
      const laid = squarify(items, { x: 0, y: 0, w: size.w, h: bodyH });
      return { sector: g.sector, height: rowH, cells: laid };
    });
  }, [groups, size]);

  return (
    <div ref={containerRef} className="w-full" data-testid="heatmap-container">
      {rows.map((row, i) => (
        <div
          key={row.sector}
          className="relative w-full"
          style={{ height: row.height }}
          data-testid={`sector-row-${row.sector}`}
        >
          {/* Sector header bar */}
          <div
            className="absolute left-0 right-0 top-0 flex items-center px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90"
            style={{ height: SECTOR_HEADER_H, background: 'rgba(255,255,255,0.04)' }}
          >
            <span>{row.sector}</span>
            <span className="ml-2 text-white/40 font-normal normal-case tracking-normal text-[10px]">
              {row.cells.length} valeurs
            </span>
          </div>
          {/* Cells */}
          <div
            className="absolute left-0 right-0"
            style={{ top: SECTOR_HEADER_H, bottom: 0 }}
          >
            {row.cells.map((c) => (
              <Cell key={c.ticker} cell={c} onTap={() => navigate(`/stock/${c.ticker}`)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Cell({ cell, onTap }) {
  const { rect, ticker, changePct } = cell;
  const bg = pctToColor(changePct);
  // Font sizes scale with the smaller cell dimension
  const area = rect.w * rect.h;
  const tickerSize = Math.max(9, Math.min(28, Math.sqrt(area) / 6));
  const pctSize = Math.max(8, tickerSize * 0.55);
  const showPct = rect.h > 34 && rect.w > 40;
  const stacked = rect.h > 46;

  return (
    <button
      onClick={onTap}
      data-testid={`heatmap-cell-${ticker}`}
      className="absolute overflow-hidden text-white active:opacity-80 transition-[opacity] duration-150"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        background: bg,
        // 1px black gap between cells
        boxShadow: 'inset 0 0 0 1px #000',
      }}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center px-1 num"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
      >
        <span
          className="font-semibold leading-none"
          style={{ fontSize: tickerSize }}
        >
          {ticker}
        </span>
        {showPct && (
          <span
            className={`leading-none ${stacked ? 'mt-1' : 'mt-0.5'} opacity-95`}
            style={{ fontSize: pctSize }}
          >
            {formatPct(changePct)}
          </span>
        )}
      </div>
    </button>
  );
}
