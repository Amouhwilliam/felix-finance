import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star } from 'lucide-react';
import { getStockByTicker } from '../data/mockData';
import PriceChart from '../components/PriceChart';
import { formatFcfa, formatPct } from '../lib/format';

const PERIODS = ['1J', '1S', '1M', 'YTD', '1A'];

export default function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const stock = getStockByTicker(ticker);
  const [period, setPeriod] = useState('1J');
  const [starred, setStarred] = useState(false);

  if (!stock) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <p className="text-white/70 mb-4">Valeur introuvable.</p>
        <Link to="/" className="text-mint font-semibold">Retour aux marchés</Link>
      </div>
    );
  }

  const positive = stock.changePct >= 0;
  const color = positive ? 'text-mint' : 'text-loss';
  // Fake absolute change amount derived from % — just for visuals
  const absChange = (stock.price * stock.changePct) / 100;

  return (
    <div className="min-h-screen w-full bg-black text-white" data-testid={`page-stock-${stock.ticker}`}>
      <header
        className="sticky top-0 z-20 bg-black/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="flex items-center justify-between px-3 h-12">
          <button
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            onClick={() => navigate(-1)}
            data-testid="btn-back"
            aria-label="Retour"
          >
            <ChevronLeft size={24} className="text-mint" />
          </button>
          <div className="text-[13px] font-semibold text-white/90 tracking-wide">{stock.ticker}</div>
          <button
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            onClick={() => setStarred((s) => !s)}
            data-testid="btn-star"
            aria-label="Favori"
          >
            <Star
              size={20}
              strokeWidth={1.8}
              className={starred ? 'text-mint' : 'text-white/60'}
              fill={starred ? '#00D084' : 'transparent'}
            />
          </button>
        </div>
      </header>

      <main className="px-5 pt-2 pb-16">
        <div className="text-white/60 text-sm">{stock.name}</div>
        <div className="mt-3 flex items-baseline gap-3">
          <h1 className="text-[42px] font-bold num leading-none tracking-tight">
            {formatFcfa(stock.price)}
          </h1>
        </div>
        <div className={`mt-2 text-[15px] font-semibold num ${color}`} data-testid="stock-change">
          {positive ? '▲' : '▼'} {formatFcfa(Math.abs(absChange))} ({formatPct(stock.changePct)})
        </div>

        {/* Chart */}
        <div className="mt-6 -mx-1">
          <PriceChart ticker={stock.ticker} changePct={stock.changePct} width={360} height={200} />
        </div>

        {/* Period selector */}
        <div className="mt-3 flex items-center gap-1 text-[13px]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                period === p ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
              data-testid={`period-${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Key stats card */}
        <section className="mt-8 rounded-card border hairline p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-3">
            Statistiques clés
          </h2>
          <dl className="grid grid-cols-2 gap-y-4">
            <Stat label="Capitalisation" value={`${(stock.marketCapWeight * 12).toLocaleString('fr-FR')} Md FCFA`} />
            <Stat label="Secteur" value={stock.sector} />
            <Stat label="Ouverture" value={formatFcfa(stock.price - absChange)} />
            <Stat label="Volume (24h)" value={`${(stock.marketCapWeight * 3450).toLocaleString('fr-FR')}`} />
            <Stat label="Plus haut" value={formatFcfa(stock.price * 1.008)} />
            <Stat label="Plus bas" value={formatFcfa(stock.price * 0.988)} />
          </dl>
        </section>

        <section className="mt-6 rounded-card border hairline p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-2">À propos</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            {stock.name} est cotée sur la Bourse Régionale des Valeurs Mobilières (BRVM) — la place
            financière régionale de l&apos;UEMOA. Les données affichées sont fictives et destinées à la
            démonstration de l&apos;interface.
          </p>
        </section>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-full bg-mint text-black font-semibold text-[15px] active:opacity-80"
            data-testid="btn-buy"
          >
            Acheter
          </button>
          <button
            className="h-12 rounded-full bg-white/8 border hairline text-white font-semibold text-[15px] active:opacity-80"
            data-testid="btn-sell"
          >
            Vendre
          </button>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[12px] text-white/50">{label}</dt>
      <dd className="text-[15px] font-medium num mt-0.5">{value}</dd>
    </div>
  );
}
