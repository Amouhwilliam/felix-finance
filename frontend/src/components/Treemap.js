import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupBySector } from '../data/mockData';
import { squarify } from '../lib/squarify';
import { pctToColor, pctTextColor, formatPct } from '../lib/format';

// 3-level squarified heatmap: sector → sub-industry → stock.
// Matches the S&P 500 reference: sectors get a bold uppercase banner, sub-industry
// gets a lighter thin banner, and stocks are colored, tappable cells.
//
// On mobile (<640px) we fall back to a per-sector row layout that skips the
// sub-industry level so cells remain legible on small viewports.

const SECTOR_HEADER_H = 26;
const SUB_HEADER_H = 16;
const CELL_GAP = 2;
const MOBILE_BREAK = 640;
const MOBILE_MIN_ROW_H = 128;
const MIN_SUB_HEIGHT = 68; // below this, skip sub-industry header

export default function Treemap({ minHeight = 520, maxHeight = 1200 }) {
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
        const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
        const idealH = Math.max(minHeight, Math.min(maxHeight, w * 2.4));
        h = groups
          .map((g) => Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH))
          .reduce((s, x) => s + x, 0);
      } else {
        // Portrait orientation lets small sectors pack as columns on the right,
        // giving them more visible area than a landscape layout would.
        const aspect = w < 900 ? 1.25 : 1.15;
        h = Math.max(minHeight, Math.min(maxHeight, Math.round(w * aspect)));
      }
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight, maxHeight, groups]);

  const isMobile = size.w > 0 && size.w < MOBILE_BREAK;

  const sectorsLaidOut = useMemo(() => {
    if (size.w === 0) return [];
    if (isMobile) {
      // Mobile: one row per sector, stocks squarified within.
      const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
      const idealH = Math.max(minHeight, Math.min(maxHeight, size.w * 2.4));
      const heights = groups.map((g) =>
        Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH)
      );
      let y = 0;
      return groups.map((g, i) => {
        const rowH = heights[i];
        const rect = { x: 0, y, w: size.w, h: rowH };
        const body = {
          x: CELL_GAP,
          y: y + SECTOR_HEADER_H,
          w: Math.max(0, size.w - CELL_GAP * 2),
          h: Math.max(0, rowH - SECTOR_HEADER_H - CELL_GAP),
        };
        // Collapse to just stocks on mobile — no sub-industry banners.
        const cells = squarify(
          g.subgroups.flatMap((sg) => sg.stocks).map((s) => ({ ...s, value: s.mktCapBn })),
          body
        );
        y += rowH;
        return { sector: g.sector, rect, subs: [], flatCells: cells };
      });
    }

    // Desktop: nested squarify at 3 levels.
    // Sector weights are compressed with sqrt so smaller sectors (Transport,
    // Services Publics) still get visible cells even though Banques + Télécoms
    // dominate ~77% of the BRVM market cap. Within each sector we still use
    // the raw market cap so stock ordering is authentic.
    const sectorItems = groups.map((g) => ({ ...g, value: Math.sqrt(g.totalWeight) }));
    const laidSectors = squarify(sectorItems, { x: 0, y: 0, w: size.w, h: size.h });

    return laidSectors.map((sec) => {
      const rect = sec.rect;
      const secBody = {
        x: rect.x + CELL_GAP,
        y: rect.y + SECTOR_HEADER_H,
        w: Math.max(0, rect.w - CELL_GAP * 2),
        h: Math.max(0, rect.h - SECTOR_HEADER_H - CELL_GAP),
      };

      // Sub-industry squarify
      const subItems = sec.subgroups.map((g) => ({ ...g, value: g.totalWeight }));
      const laidSubs = squarify(subItems, secBody);

      const subs = laidSubs.map((sg) => {
        // Skip the sub-industry banner if the sector has only one sub-group
        // (the sector title already conveys the info) or if the rect is too small.
        const onlyOneSub = sec.subgroups.length === 1;
        const showSubHeader = !onlyOneSub && sg.rect.h >= MIN_SUB_HEIGHT && sg.rect.w >= 60;
        const stockBody = {
          x: sg.rect.x + CELL_GAP,
          y: sg.rect.y + (showSubHeader ? SUB_HEADER_H : 0),
          w: Math.max(0, sg.rect.w - CELL_GAP * 2),
          h: Math.max(0, sg.rect.h - (showSubHeader ? SUB_HEADER_H : 0) - CELL_GAP),
        };
        const stockItems = sg.stocks.map((s) => ({ ...s, value: s.mktCapBn }));
        const cells = squarify(stockItems, stockBody);
        return { ...sg, showSubHeader, cells };
      });

      return { sector: sec.sector, rect, subs, flatCells: [] };
    });
  }, [groups, size, isMobile, minHeight, maxHeight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-card overflow-hidden border hairline bg-black"
      style={{ height: size.h || minHeight }}
      data-testid="heatmap-container"
    >
      {sectorsLaidOut.map((sec) => (
        <React.Fragment key={sec.sector}>
          {/* Sector background */}
          <div
            className="absolute pointer-events-none"
            style={{ left: sec.rect.x, top: sec.rect.y, width: sec.rect.w, height: sec.rect.h, background: '#0A0A0A' }}
          />
          {/* Sector header */}
          <div
            className="absolute flex items-center justify-center text-white text-[11px] font-semibold tracking-[0.14em] uppercase overflow-hidden"
            style={{ left: sec.rect.x, top: sec.rect.y, width: sec.rect.w, height: SECTOR_HEADER_H, background: '#0F0F10' }}
            data-testid={`sector-header-${sec.sector}`}
          >
            <span className="truncate px-2 max-w-full">{sec.sector}</span>
          </div>

          {/* Mobile: flat cells */}
          {sec.flatCells.map((c) => (
            <Cell key={c.ticker} cell={c} onTap={() => navigate(`/stock/${c.ticker}`)} />
          ))}

          {/* Desktop: sub-industry banners + cells */}
          {sec.subs.map((sg) => (
            <React.Fragment key={sg.name}>
              {sg.showSubHeader && (
                <div
                  className="absolute flex items-center text-white/90 text-[10.5px] font-medium overflow-hidden"
                  style={{
                    left: sg.rect.x,
                    top: sg.rect.y,
                    width: sg.rect.w,
                    height: SUB_HEADER_H,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                  data-testid={`subindustry-header-${sg.name}`}
                >
                  <span className="truncate px-2 max-w-full">{sg.name}</span>
                </div>
              )}
              {sg.cells.map((c) => (
                <Cell key={c.ticker} cell={c} onTap={() => navigate(`/stock/${c.ticker}`)} />
              ))}
            </React.Fragment>
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
  const tickerSize = Math.max(0, Math.min(34, rect.h * 0.42, rect.w / 4.2));
  const pctSize = Math.max(0, tickerSize * 0.5);
  const showTicker = tickerSize >= 9 && rect.w > 24 && rect.h > 14;
  const showPct = tickerSize >= 12 && rect.h > 36 && rect.w > 44;
  const stacked = rect.h > 50;

  return (
    <button
      onClick={onTap}
      data-testid={`heatmap-cell-${ticker}`}
      title={`${ticker} · ${formatPct(changePct)}`}
      className="absolute overflow-hidden hover:z-10 hover:ring-2 hover:ring-black/40 transition-[transform,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-black/40"
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
          <span className="font-semibold leading-none tracking-tight" style={{ fontSize: tickerSize }}>
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
