import React from 'react';
import { Link } from 'react-router-dom';
import { computeHoldingRows } from '../data/mockData';
import { formatFcfa, formatPct } from '../lib/format';
import PriceChart from '../components/PriceChart';

export default function Portfolio() {
  const rows = computeHoldingRows();
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPl = rows.reduce((s, r) => s + r.pl, 0);
  const totalCost = totalValue - totalPl;
  const totalPct = totalCost === 0 ? 0 : (totalPl / totalCost) * 100;
  const positive = totalPl >= 0;

  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-10 pb-24 grid grid-cols-12 gap-8" data-testid="page-portfolio">
      <main className="col-span-12 lg:col-span-8">
        <h1 className="text-[40px] font-bold tracking-tight leading-none">Portefeuille</h1>
        <div className="mt-5 text-[42px] font-bold num tracking-tight">{formatFcfa(totalValue)}</div>
        <div className={`mt-2 text-[15px] font-semibold num ${positive ? 'text-mint-deep' : 'text-loss'}`} data-testid="portfolio-total-change">
          {positive ? '▲' : '▼'} {formatFcfa(Math.abs(totalPl))} ({formatPct(totalPct)})
        </div>

        <div className="mt-8">
          <PriceChart ticker="PORTFOLIO" changePct={totalPct} lastPrice={Math.round(totalValue)} width={780} height={260} />
        </div>

        <section className="mt-14">
          <h2 className="text-[22px] font-bold tracking-tight">Vos positions</h2>
          <ul className="mt-4 divide-y hairline border-y hairline">
            {rows.map((r) => (
              <li key={r.ticker}>
                <Link
                  to={`/stock/${r.ticker}`}
                  className="flex items-center gap-4 px-2 -mx-2 py-4 hover:bg-surface transition-colors rounded-lg"
                  data-testid={`holding-${r.ticker}`}
                >
                  <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-[12px] font-bold shrink-0">
                    {r.ticker.slice(0, 4)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate">{r.name}</div>
                    <div className="text-[12px] text-muted num">{`${r.shares} × ${formatFcfa(r.price)}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold num">{formatFcfa(r.value)}</div>
                    <div className={`text-[12px] font-medium num mt-0.5 ${r.plPct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
                      {formatPct(r.plPct)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-24 space-y-6">
          <div className="rounded-card bg-surface p-5">
            <div className="text-[13px] font-semibold text-muted uppercase tracking-widest">Répartition</div>
            <ul className="mt-4 space-y-3">
              {rows.map((r) => {
                const pct = (r.value / totalValue) * 100;
                return (
                  <li key={r.ticker}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold">{r.ticker}</span>
                      <span className="num text-muted">{pct.toFixed(1)} %</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white overflow-hidden">
                      <div className="h-full bg-mint" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
