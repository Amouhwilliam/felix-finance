import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupBySector, logoUrl } from '../data/mockData';
import { squarify } from '../lib/squarify';
import { pctToColor, pctTextColor, formatPct } from '../lib/format';
import type { Rect, Stock, SubGroup } from '../types';

interface TreemapProps {
  minHeight?: number;
  maxHeight?: number;
}

type CellData = Stock & { value: number; rect: Rect };

type SubgroupLayout = SubGroup & {
  value: number;
  rect: Rect;
  showSubHeader: boolean;
  cells: CellData[];
};

interface SectorLayout {
  sector: string;
  rect: Rect;
  subs: SubgroupLayout[];
  flatCells: CellData[];
}

const SECTOR_HEADER_H = 28;
const SUB_HEADER_H = 18;
const CELL_GAP = 2;
const SECTOR_GAP = 3;
const MOBILE_BREAK = 640;
const MOBILE_MIN_ROW_H = 130;
const MIN_SUB_HEIGHT = 76;

export default function Treemap({ minHeight = 560, maxHeight = 1280 }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const navigate = useNavigate();
  const groups = useMemo(() => groupBySector(), []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = cr.width;
      let h: number;
      if (w < MOBILE_BREAK) {
        const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
        const idealH = Math.max(minHeight, Math.min(maxHeight, w * 2.4));
        h = groups
          .map((g) => Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH))
          .reduce((s, x) => s + x, 0);
      } else {
        const aspect = w < 900 ? 1.2 : w < 1200 ? 0.95 : 0.78;
        h = Math.max(minHeight, Math.min(maxHeight, Math.round(w * aspect)));
      }
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight, maxHeight, groups]);

  const isMobile = size.w > 0 && size.w < MOBILE_BREAK;

  const sectorsLaidOut = useMemo((): SectorLayout[] => {
    if (size.w === 0) return [];

    if (isMobile) {
      const totalW = groups.reduce((s, g) => s + g.totalWeight, 0);
      const idealH = Math.max(minHeight, Math.min(maxHeight, size.w * 2.4));
      const heights = groups.map((g) =>
        Math.max(MOBILE_MIN_ROW_H, (g.totalWeight / totalW) * idealH),
      );
      let y = 0;
      return groups.map((g, i) => {
        const rowH = heights[i];
        const rect: Rect = { x: 0, y, w: size.w, h: rowH };
        const body: Rect = {
          x: CELL_GAP,
          y: y + SECTOR_HEADER_H,
          w: Math.max(0, size.w - CELL_GAP * 2),
          h: Math.max(0, rowH - SECTOR_HEADER_H - CELL_GAP),
        };
        const cells = squarify(
          g.subgroups.flatMap((sg) => sg.stocks).map((s) => ({ ...s, value: s.mktCapBn })),
          body,
        ) as CellData[];
        y += rowH;
        return { sector: g.sector, rect, subs: [] as SubgroupLayout[], flatCells: cells };
      });
    }

    const sectorItems = groups.map((g) => ({ ...g, value: Math.sqrt(g.totalWeight) }));
    const laidSectors = squarify(sectorItems, { x: 0, y: 0, w: size.w, h: size.h });

    return laidSectors.map((sec) => {
      const rect = sec.rect;
      const secBody: Rect = {
        x: rect.x + CELL_GAP,
        y: rect.y + SECTOR_HEADER_H,
        w: Math.max(0, rect.w - CELL_GAP * 2),
        h: Math.max(0, rect.h - SECTOR_HEADER_H - CELL_GAP),
      };

      const subItems = sec.subgroups.map((g) => ({ ...g, value: g.totalWeight }));
      const laidSubs = squarify(subItems, secBody);

      const subs: SubgroupLayout[] = laidSubs.map((sg) => {
        const onlyOneSub = sec.subgroups.length === 1;
        const showSubHeader = !onlyOneSub && sg.rect.h >= MIN_SUB_HEIGHT && sg.rect.w >= 70;
        const stockBody: Rect = {
          x: sg.rect.x + CELL_GAP,
          y: sg.rect.y + (showSubHeader ? SUB_HEADER_H : 0),
          w: Math.max(0, sg.rect.w - CELL_GAP * 2),
          h: Math.max(0, sg.rect.h - (showSubHeader ? SUB_HEADER_H : 0) - CELL_GAP),
        };
        const stockItems = sg.stocks.map((s) => ({ ...s, value: s.mktCapBn }));
        const cells = squarify(stockItems, stockBody) as CellData[];
        return { ...sg, showSubHeader, cells };
      });

      return { sector: sec.sector, rect, subs, flatCells: [] as CellData[] };
    });
  }, [groups, size, isMobile, minHeight, maxHeight]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-card overflow-hidden bg-black shadow-card"
      style={{ height: size.h || minHeight }}
      data-testid="heatmap-container"
    >
      {sectorsLaidOut.map((sec) => (
        <React.Fragment key={sec.sector}>
          {/* Sector background with a slight inset gap so sectors read as separate blocks */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: sec.rect.x + SECTOR_GAP / 2,
              top: sec.rect.y + SECTOR_GAP / 2,
              width: Math.max(0, sec.rect.w - SECTOR_GAP),
              height: Math.max(0, sec.rect.h - SECTOR_GAP),
              background: '#0A0A0A',
            }}
          />
          <div
            className="absolute flex items-center text-white/95 text-[11px] font-bold tracking-[0.16em] uppercase overflow-hidden"
            style={{
              left: sec.rect.x + SECTOR_GAP / 2,
              top: sec.rect.y + SECTOR_GAP / 2,
              width: Math.max(0, sec.rect.w - SECTOR_GAP),
              height: SECTOR_HEADER_H,
              background: '#0F0F10',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            data-testid={`sector-header-${sec.sector}`}
          >
            <span className="truncate px-3 max-w-full">{sec.sector}</span>
          </div>

          {sec.flatCells.map((c) => (
            <Cell key={c.ticker} cell={c} onTap={() => navigate(`/stock/${c.ticker}`)} />
          ))}

          {sec.subs.map((sg) => (
            <React.Fragment key={sg.name}>
              {sg.showSubHeader && (
                <div
                  className="absolute flex items-center text-white/85 text-[10px] font-semibold uppercase tracking-wider overflow-hidden"
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

interface CellProps {
  cell: CellData;
  onTap: () => void;
}

function Cell({ cell, onTap }: CellProps) {
  const { rect, ticker, price, changePct } = cell;
  const bg = pctToColor(changePct);
  const color = pctTextColor(changePct);

  const w = Math.max(0, rect.w - CELL_GAP);
  const h = Math.max(0, rect.h - CELL_GAP);

  // Determine density tier based on cell dimensions
  const isXL = h >= 100 && w >= 120;
  const isL = !isXL && h >= 60 && w >= 80;
  const isM = !isXL && !isL && h >= 30 && w >= 40;
  const isS = !isXL && !isL && !isM && h >= 16 && w >= 22;

  const tickerSize = isXL
    ? Math.min(20, Math.max(15, Math.floor(w / 8)))
    : isL
      ? Math.min(16, Math.max(12, Math.floor(w / 8)))
      : isM
        ? Math.min(13, Math.max(10, Math.floor(w / 9)))
        : 9;
  const pctSize = Math.max(9, Math.min(14, Math.round(tickerSize * 0.68)));
  const priceSize = Math.max(10, Math.min(13, Math.round(tickerSize * 0.62)));

  return (
    <button
      onClick={onTap}
      data-testid={`heatmap-cell-${ticker}`}
      title={`${ticker} · ${formatPct(changePct)}`}
      className="absolute overflow-hidden hover:z-10 hover:ring-2 hover:ring-white/70 transition-[transform,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-white/70"
      style={{
        left: rect.x + CELL_GAP / 2,
        top: rect.y + CELL_GAP / 2,
        width: w,
        height: h,
        background: bg,
        color,
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center px-1.5 num select-none">
        {isXL && (
          <>
            <div
              className="rounded-full bg-white/90 flex items-center justify-center overflow-hidden mb-1.5 shadow-sm"
              style={{ width: 22, height: 22 }}
            >
              <img
                src={logoUrl(ticker)}
                alt=""
                className="w-[80%] h-[80%] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <span
              className="font-bold leading-none tracking-tight"
              style={{ fontSize: tickerSize }}
            >
              {ticker}
            </span>
            <span
              className="leading-none mt-0.5 opacity-90 font-medium"
              style={{ fontSize: priceSize }}
            >
              {price.toLocaleString('fr-FR')}
            </span>
            <span
              className="leading-none mt-1 font-semibold"
              style={{ fontSize: pctSize }}
            >
              {formatPct(changePct)}
            </span>
          </>
        )}
        {isL && (
          <>
            <span
              className="font-bold leading-none tracking-tight"
              style={{ fontSize: tickerSize }}
            >
              {ticker}
            </span>
            <span
              className="leading-none mt-1 opacity-95 font-semibold"
              style={{ fontSize: pctSize }}
            >
              {formatPct(changePct)}
            </span>
          </>
        )}
        {isM && (
          <span
            className="font-bold leading-none tracking-tight"
            style={{ fontSize: tickerSize }}
          >
            {ticker}
          </span>
        )}
        {isS && (
          <span
            className="font-semibold leading-none tracking-tight opacity-90"
            style={{ fontSize: 9 }}
          >
            {ticker.slice(0, 4)}
          </span>
        )}
      </div>
    </button>
  );
}
