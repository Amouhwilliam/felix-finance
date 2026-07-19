import React from 'react';
import { Link } from 'react-router-dom';
import { computeHoldingRows } from '../data/mockData';
import { formatFcfa, formatPct } from '../lib/format';

export default function Portfolio() {
  const rows = computeHoldingRows();
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPl = rows.reduce((s, r) => s + r.pl, 0);
  const totalCost = totalValue - totalPl;
  const totalPct = (totalPl / totalCost) * 100;
  const positive = totalPl >= 0;

  return (
    <div className="min-h-screen bg-black text-white pb-24" data-testid="page-portfolio">
      <header
        className="sticky top-0 z-20 bg-black/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="px-5 h-14 flex items-end pb-2 border-b hairline">
          <h1 className="text-[22px] font-bold tracking-tight">Portefeuille</h1>
        </div>
      </header>

      <section className="px-5 pt-8">
        <div className="text-[13px] text-white/55">Valeur totale</div>
        <div className="mt-1 text-[38px] font-bold num tracking-tight leading-none">
          {formatFcfa(totalValue)}
        </div>
        <div
          className={`mt-2 text-[14px] font-semibold num ${positive ? 'text-mint' : 'text-loss'}`}
          data-testid="portfolio-total-change"
        >
          {positive ? '▲' : '▼'} {formatFcfa(Math.abs(totalPl))} ({formatPct(totalPct)})
        </div>
      </section>

      <section className="mt-8">
        <div className="px-5 mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Vos positions
        </div>
        <ul className="divide-y hairline">
          {rows.map((r) => (
            <li key={r.ticker}>
              <Link
                to={`/stock/${r.ticker}`}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
                data-testid={`holding-${r.ticker}`}
              >
                <div>
                  <div className="text-[15px] font-semibold">{r.ticker}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">
                    {r.shares} × {formatFcfa(r.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold num">{formatFcfa(r.value)}</div>
                  <div
                    className={`text-[12px] font-medium num mt-0.5 ${
                      r.plPct >= 0 ? 'text-mint' : 'text-loss'
                    }`}
                  >
                    {formatPct(r.plPct)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
