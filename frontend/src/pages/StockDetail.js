import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, MoreHorizontal, ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import { getStockDetail, relatedStocks } from '../data/mockData';
import { formatFcfa, formatPct, formatCompactFcfa } from '../lib/format';

const PERIODS = ['1J', '1S', '1M', '6M', '1A', '5A'];

export default function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const stock = getStockDetail(ticker);
  const related = relatedStocks(ticker, 4);
  const [period, setPeriod] = useState('1J');
  const [starred, setStarred] = useState(false);
  const [tab, setTab] = useState('Buy');
  const [amount, setAmount] = useState('');

  if (!stock) {
    return (
      <div className="mx-auto max-w-shell px-6 lg:px-10 py-24 text-center">
        <p className="text-muted mb-4">Valeur introuvable.</p>
        <Link to="/" className="text-mint-deep font-semibold">Retour aux marchés</Link>
      </div>
    );
  }

  const positive = stock.changePct >= 0;
  const color = positive ? 'text-mint-deep' : 'text-loss';
  const absChange = (stock.price * stock.changePct) / 100;

  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-8 pb-24 grid grid-cols-12 gap-8 lg:gap-10" data-testid={`page-stock-${stock.ticker}`}>
      {/* MAIN COLUMN */}
      <main className="col-span-12 lg:col-span-8">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink transition-colors mb-6"
          data-testid="btn-back"
        >
          <ChevronLeft size={16} /> Retour
        </button>

        {/* Header row */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <TickerLogo ticker={stock.ticker} />
            <h1 className="mt-4 text-[36px] font-bold tracking-tight leading-tight">
              {stock.name}
            </h1>
            <div className="mt-3 text-[38px] font-bold num tracking-tight leading-none">
              {formatFcfa(stock.price)}
            </div>
            <div className={`mt-2 text-[15px] font-semibold num ${color}`} data-testid="stock-change">
              {positive ? '▲' : '▼'} {formatFcfa(Math.abs(absChange))} ({formatPct(stock.changePct)})
              <span className="text-muted font-normal ml-2">· Depuis 09:00</span>
            </div>
          </div>
          <button
            onClick={() => setStarred((s) => !s)}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center transition-colors"
            data-testid="btn-star"
            aria-label="Favori"
          >
            <Star size={22} strokeWidth={1.8} className={starred ? 'text-mint-deep' : 'text-ink'} fill={starred ? '#00D084' : 'transparent'} />
          </button>
        </div>

        {/* Period pills */}
        <div className="mt-8 flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 h-9 rounded-full text-[13px] font-semibold transition-colors ${
                period === p ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
              }`}
              data-testid={`period-${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 -mx-1">
          <PriceChart ticker={stock.ticker} changePct={stock.changePct} lastPrice={stock.price} width={760} height={320} />
        </div>

        {/* Time axis labels */}
        <div className="mt-1 grid grid-cols-6 text-[11px] text-muted num pr-16">
          {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map((t) => (
            <span key={t} className="text-center">{t}</span>
          ))}
        </div>

        {/* Metrics */}
        <section className="mt-14" data-testid="section-metrics">
          <h2 className="text-[22px] font-bold tracking-tight">Métriques</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-[14px]">
            <MetricRange label="Séance" left={stock.dayLow} right={stock.dayHigh} current={stock.price} />
            <MetricPair label="Capitalisation" value={formatCompactFcfa(stock.mktCapBn * 1e9)} />
            <MetricRange label="52 semaines" left={stock.yearLow} right={stock.yearHigh} current={stock.price} />
            <MetricPair label="PER" value={stock.peRatio} />
            <MetricDual leftLabel="Ouverture" leftValue={formatFcfa(stock.open)} rightLabel="Clôture" rightValue={formatFcfa(stock.close)} />
            <MetricPair label="Bêta 52s" value={stock.beta52w} />
            <MetricDual leftLabel="Achat" leftValue={formatFcfa(stock.bid)} rightLabel="Vente" rightValue={formatFcfa(stock.ask)} />
            <MetricPair label="Rendement" value={`${stock.divYield}\u202f%`} />
          </div>
        </section>

        {/* Dividends */}
        <section className="mt-14" data-testid="section-dividends">
          <button className="flex items-center gap-2 group">
            <h2 className="text-[22px] font-bold tracking-tight">Dividendes</h2>
            <ChevronRight size={20} className="text-muted group-hover:translate-x-0.5 transition-transform" />
          </button>
          <ul className="mt-6 space-y-4">
            {stock.dividends.map((d, i) => {
              const maxV = Math.max(...stock.dividends.map((x) => x.value));
              const pct = (d.value / maxV) * 100;
              return (
                <li key={i} className="grid grid-cols-[80px_1fr_auto] items-center gap-4">
                  <span className="text-[13px] text-muted">{d.period}</span>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-mint" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[13px] font-semibold num">{`${d.value.toLocaleString('fr-FR')}\u202fFCFA`}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What analysts say */}
        <section className="mt-14" data-testid="section-analysts">
          <h2 className="text-[22px] font-bold tracking-tight">Recommandations des analystes</h2>
          <div className="mt-6 flex items-baseline gap-3">
            <div className="text-[42px] font-bold num tracking-tight leading-none">{formatFcfa(stock.targetPrice)}</div>
            <div className="text-[13px] text-muted">objectif moyen</div>
          </div>
          <p className="mt-2 text-[13px] text-muted max-w-xl">
            Objectif de cours moyen. Estimation haute {formatFcfa(Math.round(stock.targetPrice * 1.18))}, estimation basse {formatFcfa(Math.round(stock.targetPrice * 0.82))}.
            Cette valeur est suivie par {stock.analysts.count} analystes.
          </p>
          <div className="mt-6">
            {/* Stacked bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden bg-surface" data-testid="analysts-bar">
              <div style={{ width: `${stock.analysts.buy}%` }} className="bg-mint" />
              <div style={{ width: `${stock.analysts.hold}%` }} className="bg-black/70" />
              <div style={{ width: `${stock.analysts.sell}%` }} className="bg-loss" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <RatingStat label="Acheter" pct={stock.analysts.buy} color="text-mint-deep" />
              <RatingStat label="Conserver" pct={stock.analysts.hold} color="text-ink" />
              <RatingStat label="Vendre" pct={stock.analysts.sell} color="text-loss" />
            </div>
          </div>
        </section>

        {/* Upcoming events */}
        <section className="mt-14" data-testid="section-events">
          <h2 className="text-[22px] font-bold tracking-tight">Événements à venir</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {stock.events.map((e, i) => (
              <div key={i} className="rounded-card border hairline p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold leading-none">{e.day}</span>
                  <span className="text-[12px] text-muted">{e.month}</span>
                </div>
                <div className="mt-3 text-[14px] font-semibold">{e.title}</div>
                <p className="mt-2 text-[13px] text-muted leading-snug">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interesting stocks */}
        <section className="mt-14" data-testid="section-related">
          <h2 className="text-[22px] font-bold tracking-tight">Valeurs à découvrir</h2>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {related.map((r) => (
              <Link
                key={r.ticker}
                to={`/stock/${r.ticker}`}
                className="rounded-card border hairline p-4 hover:bg-surface transition-colors flex flex-col justify-between min-h-[170px]"
                data-testid={`related-${r.ticker}`}
              >
                <TickerLogo ticker={r.ticker} small />
                <div>
                  <div className="text-[14px] font-semibold leading-snug">{r.name}</div>
                  <div className={`mt-1 text-[13px] font-semibold num ${r.changePct >= 0 ? 'text-mint-deep' : 'text-loss'}`}>
                    {r.changePct >= 0 ? '▲' : '▼'} {formatPct(r.changePct, { withSign: false })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <TagPill>{r.sector}</TagPill>
                    <TagPill>UEMOA</TagPill>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mt-14">
          <h2 className="text-[22px] font-bold tracking-tight">À propos</h2>
          <p className="mt-4 text-[14px] text-ink/80 leading-relaxed max-w-3xl">{stock.about}</p>
          <p className="mt-3 text-[12px] text-muted">
            Les cotations, prévisions et notes d&apos;analystes affichées sont fictives et destinées à la démonstration de l&apos;interface.
          </p>
        </section>
      </main>

      {/* RIGHT SIDEBAR — Buy / Sell */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Trade card */}
          <div className="rounded-card border hairline p-5" data-testid="trade-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-[15px] font-semibold">
                <button
                  onClick={() => setTab('Buy')}
                  className={`nav-link ${tab === 'Buy' ? 'text-ink' : 'text-muted hover:text-ink'}`}
                  data-active={tab === 'Buy'}
                  data-testid="tab-buy"
                >
                  Acheter
                </button>
                <button
                  onClick={() => setTab('Sell')}
                  className={`nav-link ${tab === 'Sell' ? 'text-ink' : 'text-muted hover:text-ink'}`}
                  data-active={tab === 'Sell'}
                  data-testid="tab-sell"
                >
                  Vendre
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink rounded-full hover:bg-surface" aria-label="Plus d'options" data-testid="trade-more">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="mt-1 text-[12px] text-muted num">
              {'5\u202f420\u202f000\u202fFCFA'} disponibles
            </div>

            <div className="mt-5 inline-flex bg-surface rounded-full p-1 text-[13px]">
              <button className="px-3 h-8 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] font-semibold">Montant</button>
              <button className="px-3 h-8 rounded-full text-muted hover:text-ink">Parts</button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] text-muted">Montant</label>
                <div className="flex-1 max-w-[180px]">
                  <div className="flex items-center justify-end bg-surface rounded-full h-11 px-4">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                      className="bg-transparent w-full text-right outline-none num font-semibold"
                      data-testid="amount-input"
                    />
                    <span className="text-muted text-[13px] ml-1">FCFA</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] text-muted">Parts</label>
                <div className="text-right num font-semibold text-[15px]">
                  {(Number(amount || 0) / stock.price).toFixed(6)}
                </div>
              </div>
            </div>

            <button
              disabled={!Number(amount)}
              className={`mt-5 w-full h-12 rounded-full font-semibold text-[15px] transition-colors ${
                Number(amount) > 0
                  ? 'bg-mint hover:bg-mint-deep text-white'
                  : 'bg-surface text-muted cursor-not-allowed'
              }`}
              data-testid="btn-review-order"
            >
              Vérifier l&apos;ordre
            </button>
          </div>

          {/* Position card */}
          <div className="rounded-card border hairline p-5" data-testid="position-card">
            <h3 className="text-[17px] font-bold">Position</h3>
            <div className="mt-4 text-[13px] text-muted">Total</div>
            <div className="text-[24px] font-bold num tracking-tight">{formatFcfa(stock.price * 28)}</div>
            <div className="mt-4 text-[13px] text-muted">Performance</div>
            <div className="text-[15px] font-semibold text-mint-deep num">{`▲ ${formatFcfa(stock.price * 0.42)} (+2,46\u202f%)`}</div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
              <div>
                <div className="text-muted">Parts</div>
                <div className="mt-1 num font-semibold">28,000</div>
              </div>
              <div>
                <div className="text-muted">Prix d&apos;achat</div>
                <div className="mt-1 num font-semibold">{formatFcfa(stock.price * 0.98)}</div>
              </div>
              <div>
                <div className="text-muted">Poids</div>
                <div className="mt-1 num font-semibold">{'10,55\u202f%'}</div>
              </div>
            </div>
          </div>

          {/* Savings plan CTA */}
          <div className="rounded-card p-5 bg-surface">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold leading-snug">Investissez régulièrement et faites fructifier votre épargne</h3>
                <p className="mt-1 text-[12px] text-muted">Le plan d&apos;épargne est sans frais. Modifiable ou résiliable à tout moment.</p>
                <button className="mt-3 w-full h-10 rounded-full bg-black text-white font-semibold text-[13px] hover:opacity-90" data-testid="btn-create-plan">
                  Créer un plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TickerLogo({ ticker, small }) {
  const size = small ? 'w-10 h-10 text-[12px]' : 'w-14 h-14 text-[15px]';
  return (
    <div className={`rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)] flex items-center justify-center font-bold ${size}`}>
      {ticker.slice(0, 4)}
    </div>
  );
}

function MetricPair({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b hairline pb-3">
      <span className="text-muted">{label}</span>
      <span className="font-semibold num">{value}</span>
    </div>
  );
}

function MetricDual({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <div className="flex items-center justify-between border-b hairline pb-3">
      <div className="flex items-center gap-6">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider">{leftLabel}</div>
          <div className="font-semibold num text-[14px]">{leftValue}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider">{rightLabel}</div>
          <div className="font-semibold num text-[14px]">{rightValue}</div>
        </div>
      </div>
    </div>
  );
}

function MetricRange({ label, left, right, current }) {
  const pos = Math.max(0, Math.min(1, (current - left) / (right - left || 1)));
  return (
    <div className="border-b hairline pb-3">
      <div className="flex items-center justify-between text-[12px] text-muted mb-2">
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <span className="num font-semibold text-[14px]">{left.toLocaleString('fr-FR')}</span>
        <div className="relative h-1.5 rounded-full bg-surface">
          <div className="absolute top-1/2 -translate-y-1/2 h-2.5 w-1 rounded-full bg-mint" style={{ left: `calc(${pos * 100}% - 2px)` }} />
        </div>
        <span className="num font-semibold text-[14px]">{right.toLocaleString('fr-FR')}</span>
      </div>
    </div>
  );
}

function RatingStat({ label, pct, color }) {
  return (
    <div>
      <div className={`text-[13px] font-semibold ${color}`}>{label}</div>
      <div className="text-[22px] font-bold num mt-1">{`${pct}\u202f%`}</div>
    </div>
  );
}

function TagPill({ children }) {
  return <span className="px-2 py-0.5 rounded-full bg-surface text-[10.5px] text-muted font-medium">{children}</span>;
}
