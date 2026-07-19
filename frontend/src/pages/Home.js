import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, RotateCw } from 'lucide-react';
import Treemap from '../components/Treemap';
import Dropdown from '../components/Dropdown';
import { computeHoldingRows, topMovers } from '../data/mockData';
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
  const movers = topMovers(5);

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
            <h1 className="text-[40px] font-bold tracking-tight leading-none">Marchés</h1>
            <p className="mt-2 text-[15px] text-muted">
              Cartographie thermique en temps réel des valeurs de la BRVM.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dropdown
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              align="right"
              testId="dropdown-period"
            />
            <Dropdown
              options={INDICES}
              value={index}
              onChange={setIndex}
              align="right"
              testId="dropdown-index"
            />
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

        {/* Heatmap card */}
        <div className="mt-6">
          <Treemap aspect={1.05} minHeight={520} maxHeight={1100} />
        </div>

        {/* Discover — top movers */}
        <section className="mt-14">
          <h2 className="text-[26px] font-bold tracking-tight">Découvrir</h2>
          <h3 className="mt-5 text-[15px] font-semibold text-muted">Plus fortes variations du jour</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {movers.map((m) => (
              <Link
                to={`/stock/${m.ticker}`}
                key={m.ticker}
                className="rounded-card bg-surface hover:bg-surface-2 px-4 py-4 flex flex-col justify-between min-h-[110px] transition-colors"
                data-testid={`mover-${m.ticker}`}
              >
                <div className="flex items-center justify-between">
                  <TickerBadge ticker={m.ticker} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold truncate">{m.name}</div>
                  <div className={`text-[13px] font-semibold num mt-1 ${m.changePct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
                    {m.changePct >= 0 ? '▲' : '▼'} {formatPct(m.changePct, { withSign: false })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sector tiles */}
        <section className="mt-14">
          <h3 className="text-[15px] font-semibold text-muted">Explorer par secteur</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {['Télécoms', 'Banques', 'Industrie', 'Agriculture', 'Distribution', 'Services Publics', 'Transport'].map((sec) => (
              <button
                key={sec}
                className="text-left rounded-card bg-surface hover:bg-surface-2 px-4 py-4 transition-colors"
                data-testid={`sector-tile-${sec}`}
              >
                <div className="text-[15px] font-semibold">{sec}</div>
                <div className="text-[12px] text-muted mt-1">Voir les valeurs</div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Right sidebar — Investments */}
      <aside className="col-span-12 lg:col-span-3">
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-bold tracking-tight">Investissements</h2>
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
                  <TickerBadge ticker={h.ticker} small />
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
          <div className="mt-6 rounded-card bg-surface p-5">
            <div className="text-[13px] font-semibold text-muted uppercase tracking-widest">Indice BRVM Composite</div>
            <div className="mt-2 text-[28px] font-bold num tracking-tight">248,17</div>
            <div className="mt-1 text-[13px] font-semibold text-mint-deep num">▲ +1,08 % aujourd&apos;hui</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TickerBadge({ ticker, small }) {
  const size = small ? 'w-9 h-9 text-[11px]' : 'w-10 h-10 text-[12px]';
  return (
    <div className={`rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] flex items-center justify-center font-bold ${size}`}>
      {ticker.slice(0, 4)}
    </div>
  );
}
