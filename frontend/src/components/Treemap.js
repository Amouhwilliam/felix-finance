import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupBySector } from '../data/mockData';
import { squarify } from '../lib/squarify';
import { pctToColor, pctTextColor, formatPct } from '../lib/format';

// Responsive squarified heatmap.
// - Desktop (>= 640px): true nested squarified treemap — sectors are a top-level
//   squarify, then each sector rectangle contains a nested squarify of stocks.
//   Matches the reference S&P heatmap look.
// - Mobile (< 640px): falls back to a vertical stack of sector rows so cells
//   remain tappable and legible.

const SECTOR_HEADER_H = 24;
const CELL_GAP = 2;
const MOBILE_BREAK = 640;
const MOBILE_MIN_ROW_H = 128;

export default function Treemap({ aspect = 1.05, minHeight = 460, maxHeight = 1100 }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const navigate = useNavigate();
  const groups = useMemo(() => groupBySector(), []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = cr.width;
      let h;
      if (w < MOBILE_BREAK) {
        // Stack sectors as rows. Total height depends on weight distribution.
        const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
        const idealH = Math.max(minHeight, Math.min(maxHeight, w * 2.4));
        h = groups
          .map((g) => Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH))
          .reduce((s, x) => s + x, 0);
      } else {
        // Near-square (~0.94) → best pack for BRVM weight distribution.
        const dynamicAspect = w < 900 ? 1.05 : 0.94;
        h = Math.max(minHeight, Math.min(maxHeight, Math.round(w * dynamicAspect)));
      }
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, minHeight, maxHeight, groups]);

  const isMobile = size.w > 0 && size.w < MOBILE_BREAK;

  // Desktop layout: nested squarified treemap.
  const desktopSectors = useMemo(() => {
    if (isMobile || size.w === 0) return [];
    const items = groups.map((g) => ({ ...g, value: g.totalWeight }));
    const laid = squarify(items, { x: 0, y: 0, w: size.w, h: size.h });
    return laid.map((sec) => {
      const bodyRect = {
        x: sec.rect.x + CELL_GAP,
        y: sec.rect.y + SECTOR_HEADER_H,
        w: Math.max(0, sec.rect.w - CELL_GAP * 2),
        h: Math.max(0, sec.rect.h - SECTOR_HEADER_H - CELL_GAP),
      };
      const cellItems = sec.stocks.map((s) => ({ ...s, value: s.marketCapWeight }));
      return { ...sec, cells: squarify(cellItems, bodyRect) };
    });
  }, [groups, size, isMobile]);

  // Mobile layout: stacked sector rows.
  const mobileRows = useMemo(() => {
    if (!isMobile) return [];
    const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
    const idealH = Math.max(minHeight, Math.min(maxHeight, size.w * 2.4));
    const heights = groups.map((g) => Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH));
    let y = 0;
    return groups.map((g, i) => {
      const rowH = heights[i];
      const rect = { x: 0, y, w: size.w, h: rowH };
      const bodyRect = {
        x: CELL_GAP,
        y: y + SECTOR_HEADER_H,
        w: Math.max(0, size.w - CELL_GAP * 2),
        h: Math.max(0, rowH - SECTOR_HEADER_H - CELL_GAP),
      };
      const cellItems = g.stocks.map((s) => ({ ...s, value: s.marketCapWeight }));
      const cells = squarify(cellItems, bodyRect);
      y += rowH;
      return { sector: g.sector, rect, cells };
    });
  }, [groups, isMobile, size, minHeight, maxHeight]);

  const sectorsToRender = isMobile ? mobileRows : desktopSectors;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-card overflow-hidden border hairline bg-black"
      style={{ height: size.h || minHeight }}
      data-testid="heatmap-container"
    >
      {sectorsToRender.map((sec) => (
        <React.Fragment key={sec.sector}>
          <div
            className="absolute pointer-events-none"
            style={{ left: sec.rect.x, top: sec.rect.y, width: sec.rect.w, height: sec.rect.h, background: '#0A0A0A' }}
          />
          <div
            className="absolute flex items-center px-3 text-white text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ left: sec.rect.x, top: sec.rect.y, width: sec.rect.w, height: SECTOR_HEADER_H, background: '#111' }}
            data-testid={`sector-header-${sec.sector}`}
          >
            <span className="truncate">{sec.sector}</span>
            <span className="ml-2 text-white/40 font-normal normal-case tracking-normal text-[10px]">
              {sec.cells.length}
            </span>
          </div>
          {sec.cells.map((c) => (
            <Cell key={c.ticker} cell={c} onTap={() => navigate(`/stock/${c.ticker}`)} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function Cell({ cell, onTap }) {
  const { rect, ticker, changePct } = cell;
  const bg = pctToColor(changePct);
  const color = pctTextColor(changePct);
  const tickerSize = Math.max(0, Math.min(28, rect.h * 0.44, rect.w / 4.5));
  const pctSize = Math.max(0, tickerSize * 0.52);
  const showTicker = tickerSize >= 9 && rect.w > 24 && rect.h > 14;
  const showPct = tickerSize >= 12 && rect.h > 34 && rect.w > 44;
  const stacked = rect.h > 48;

  return (
    <button
      onClick={onTap}
      data-testid={`heatmap-cell-${ticker}`}
      title={`${ticker} · ${formatPct(changePct)}`}
      className="absolute overflow-hidden hover:z-10 hover:ring-2 hover:ring-black/30 transition-[transform,box-shadow] duration-150 focus:outline-none"
      style={{
        left: rect.x + CELL_GAP / 2,
        top: rect.y + CELL_GAP / 2,
        width: Math.max(0, rect.w - CELL_GAP),
        height: Math.max(0, rect.h - CELL_GAP),
        background: bg,
        color,
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center px-1 num select-none">
        {showTicker && (
          <span className="font-semibold leading-none" style={{ fontSize: tickerSize }}>
            {ticker}
          </span>
        )}
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
