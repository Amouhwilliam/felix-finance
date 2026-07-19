import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, RotateCw, Sparkles } from 'lucide-react';
import Treemap from '../components/Treemap';
import Dropdown from '../components/Dropdown';
import Logo from '../components/Logo';
import { computeHoldingRows, topMovers, STOCKS } from '../data/mockData';
import { formatFcfa, formatPct } from '../lib/format';

const PERIODS = [
  { value: '1D', label: '1J' },
  { value: '1W', label: '1S' },
  { value: '1M', label: '1M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1A' },
];

const INDICES = [
  { value: 'BRVMC', label: 'BRVM Composite' },
  { value: 'BRVM30', label: 'BRVM 30' },
  { value: 'BRVMPR', label: 'BRVM Principal' },
];

export default function Home() {
  const [period, setPeriod] = useState('1D');
  const [index, setIndex] = useState('BRVMC');
  const [spinning, setSpinning] = useState(false);
  const holdings = computeHoldingRows();
  const movers = topMovers(10);

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-10 pb-24 grid grid-cols-12 gap-8" data-testid="page-home">
      {/* Left / main column */}
      <main className="col-span-12 lg:col-span-9">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[44px] font-bold tracking-tight leading-none">Marchés</h1>
            <p className="mt-3 text-[15px] text-muted max-w-md">
              Cartographie thermique de la BRVM. Toute la place ouest-africaine, d&apos;un coup d&apos;œil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown options={PERIODS} value={period} onChange={setPeriod} align="right" testId="dropdown-period" />
            <Dropdown options={INDICES} value={index} onChange={setIndex} align="right" testId="dropdown-index" />
            <button
              onClick={refresh}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-2 active:opacity-70 transition-colors"
              aria-label="Actualiser"
              data-testid="btn-refresh"
            >
              <RotateCw size={16} strokeWidth={2} className={spinning ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mt-6">
          <Treemap />
        </div>

        {/* Legend + last-updated */}
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap text-[12px] text-muted">
          <div className="flex items-center gap-3">
            <LegendSwatch label="-6 %" color="#E23A3A" />
            <LegendSwatch label="0 %" color="#E5E5EA" />
            <LegendSwatch label="+6 %" color="#00D084" />
          </div>
          <div>Mise à jour · aujourd&apos;hui 14:32 GMT · Source : mock BRVM data</div>
        </div>

        {/* Discover — top movers */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[28px] font-bold tracking-tight">Découvrir</h2>
            <Link to="/portfolio" className="text-mint-deep text-[13px] font-semibold hover:opacity-80">Voir plus</Link>
          </div>
          <h3 className="mt-6 text-[13px] font-semibold text-muted uppercase tracking-widest">Plus fortes variations</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {movers.slice(0, 5).map((m) => (
              <MoverCard key={m.ticker} stock={m} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {movers.slice(5, 10).map((m) => (
              <MoverCard key={m.ticker} stock={m} />
            ))}
          </div>
        </section>

        {/* Tendances (all stocks quick list, matching Trade Republic Trending strip) */}
        <section className="mt-16">
          <h3 className="text-[13px] font-semibold text-muted uppercase tracking-widest">Tendances sur la BRVM</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STOCKS.slice()
              .sort((a, b) => b.mktCapBn - a.mktCapBn)
              .slice(0, 5)
              .map((m, i) => (
                <TrendingCard key={m.ticker} stock={m} rank={i + 1} />
              ))}
          </div>
        </section>
      </main>

      {/* Right sidebar — Investissements */}
      <aside className="col-span-12 lg:col-span-3">
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[22px] font-bold tracking-tight">Investissements</h2>
            <button className="text-mint-deep text-[13px] font-semibold flex items-center gap-1 hover:opacity-80" data-testid="btn-daily-trend">
              Variations du jour <ChevronDown size={14} strokeWidth={2.4} />
            </button>
          </div>
          <ul className="divide-y hairline border-y hairline">
            {holdings.map((h) => (
              <li key={h.ticker}>
                <Link
                  to={`/stock/${h.ticker}`}
                  className="flex items-center gap-3 py-3.5 hover:bg-surface transition-colors px-2 -mx-2 rounded-lg"
                  data-testid={`investment-${h.ticker}`}
                >
                  <Logo ticker={h.ticker} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{h.name}</div>
                    <div className="text-[12px] text-muted num">{formatFcfa(h.price)}</div>
                  </div>
                  <div className={`text-[13px] font-semibold num ${h.changePct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
                    {h.changePct >= 0 ? '▲' : '▼'} {formatPct(h.changePct, { withSign: false })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-card bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-widest">Indice BRVM Composite</div>
              <Sparkles size={14} className="text-mint-deep" />
            </div>
            <div className="mt-3 text-[30px] font-bold num tracking-tight">248,17</div>
            <div className="mt-1 text-[13px] font-semibold text-mint-deep num">▲ +1,08 % aujourd&apos;hui</div>
            <MiniIndexChart />
          </div>

          <div className="mt-6 rounded-card border hairline p-5">
            <div className="text-[13px] font-semibold">Nouveau sur Felix ?</div>
            <p className="mt-1 text-[12px] text-muted leading-snug">
              Découvrez comment la cartographie thermique met en lumière les tendances de la BRVM.
            </p>
            <button className="mt-3 h-10 px-4 rounded-full bg-black text-white text-[13px] font-semibold hover:opacity-90" data-testid="btn-onboarding">
              Commencer le tour
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MoverCard({ stock }) {
  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="rounded-card bg-surface hover:bg-surface-2 px-4 py-4 flex flex-col justify-between min-h-[128px] transition-colors"
      data-testid={`mover-${stock.ticker}`}
    >
      <Logo ticker={stock.ticker} size={40} />
      <div className="mt-3">
        <div className="text-[13px] font-semibold truncate">{stock.name}</div>
        <div className={`text-[13px] font-semibold num mt-1 ${stock.changePct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
          {stock.changePct >= 0 ? '▲' : '▼'} {formatPct(stock.changePct, { withSign: false })}
        </div>
      </div>
    </Link>
  );
}

function TrendingCard({ stock, rank }) {
  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="relative rounded-card bg-surface hover:bg-surface-2 px-4 py-4 flex flex-col justify-between min-h-[128px] transition-colors overflow-hidden"
      data-testid={`trending-${stock.ticker}`}
    >
      <span className="absolute right-4 bottom-2 text-[64px] font-bold text-black/5 leading-none pointer-events-none select-none">
        {rank}
      </span>
      <Logo ticker={stock.ticker} size={40} />
      <div className="mt-3 relative">
        <div className="text-[13px] font-semibold truncate">{stock.name}</div>
        <div className={`text-[13px] font-semibold num mt-1 ${stock.changePct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
          {stock.changePct >= 0 ? '▲' : '▼'} {formatPct(stock.changePct, { withSign: false })}
        </div>
      </div>
    </Link>
  );
}

function LegendSwatch({ label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function MiniIndexChart() {
  // A little sparkline SVG for the index card.
  const points = [30, 34, 29, 36, 42, 38, 46, 44, 50, 48, 55, 60];
  const w = 220, h = 42;
  const min = Math.min(...points), max = Math.max(...points);
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h * 0.9 - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-10">
      <path d={path} stroke="#00A468" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
