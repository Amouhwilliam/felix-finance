import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import PriceChart, { getXLabels } from '../components/PriceChart';
import type { ChartPeriod } from '../components/PriceChart';
import Logo from '../components/Logo';
import { getStockDetail, relatedStocks } from '../data/mockData';
import { api } from '../services/api';
import { formatFcfa, formatPct, formatCompactFcfa } from '../lib/format';
import type { Stock, Dividend, CalendarEvent } from '../types';

const PERIODS: ChartPeriod[] = ['1J', '1S', '1M', '6M', '1A', '5A'];

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const mockStock = getStockDetail(ticker ?? '');
  const related = relatedStocks(ticker ?? '', 4);
  const [period, setPeriod] = useState<ChartPeriod>('1J');
  const [starred, setStarred] = useState(false);

  // Live price override from API (falls back to mock seamlessly)
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveChangePct, setLiveChangePct] = useState<number | null>(null);

  useEffect(() => {
    if (!ticker) return;
    api.quote('BRVM', ticker)
      .then((q) => {
        setLivePrice(q.price);
        setLiveChangePct(q.change_pct);
      })
      .catch(() => {/* keep mock */});
  }, [ticker]);

  // Merge live data on top of mock
  const stock = mockStock
    ? {
        ...mockStock,
        price: livePrice ?? mockStock.price,
        changePct: liveChangePct ?? mockStock.changePct,
      }
    : null;

  if (!stock) {
    return (
      <div className="mx-auto max-w-shell px-6 lg:px-10 py-24 text-center">
        <p className="text-[#6B6B6B] mb-4">Valeur introuvable.</p>
        <Link to="/" className="text-[#0A0A0A] font-semibold underline">
          Retour aux marchés
        </Link>
      </div>
    );
  }

  const positive = stock.changePct >= 0;
  const changeColor = positive ? 'text-[#00A468]' : 'text-[#E23A3A]';
  const absChange = (stock.price * Math.abs(stock.changePct)) / 100;

  return (
    <div
      className="mx-auto max-w-shell px-6 lg:px-10 pt-6 pb-24 grid grid-cols-12 gap-6 lg:gap-10"
      data-testid={`page-stock-${stock.ticker}`}
    >
      {/* ── MAIN ── */}
      <main className="col-span-12 lg:col-span-8 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[13px] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors mb-5"
          data-testid="btn-back"
        >
          <ChevronLeft size={15} strokeWidth={2} /> Retour
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <Logo ticker={stock.ticker} size={48} />
          <button
            onClick={() => setStarred((s) => !s)}
            className="w-9 h-9 rounded-full hover:bg-[#F5F5F7] flex items-center justify-center transition-colors"
            data-testid="btn-star"
            aria-label="Favori"
          >
            <Star
              size={19}
              strokeWidth={1.8}
              className={starred ? 'text-[#00A468]' : 'text-[#0A0A0A]'}
              fill={starred ? '#00D084' : 'transparent'}
            />
          </button>
        </div>

        <h1 className="mt-4 text-[26px] font-bold tracking-tight leading-tight text-[#0A0A0A]">
          {stock.name}
        </h1>

        <div className="mt-1 text-[46px] md:text-[52px] font-black num tracking-[-0.03em] leading-none">
          {formatFcfa(stock.price)}
        </div>

        <div className={`mt-2.5 flex items-center gap-2 text-[14.5px] font-semibold num ${changeColor}`} data-testid="stock-change">
          {positive ? '▲' : '▼'} {formatFcfa(absChange)} ({positive ? '+' : ''}{stock.changePct.toFixed(2)} %)
          <span className="text-[#6B6B6B] font-normal text-[13px]">· Depuis 09:00</span>
        </div>

        {/* Period selector */}
        <div className="mt-7 flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 h-[34px] rounded-full text-[13px] font-medium transition-colors ${
                period === p
                  ? 'bg-[#0A0A0A] text-white'
                  : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F7]'
              }`}
              data-testid={`period-${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 -mx-1">
          <PriceChart
            ticker={stock.ticker}
            changePct={stock.changePct}
            lastPrice={stock.price}
            period={period}
            width={760}
            height={300}
          />
        </div>

        {/* X-axis labels — update with period */}
        <div
          className="text-[11px] text-[#A1A1A6] num pr-16 mt-1 flex justify-between"
        >
          {getXLabels(period).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* ── METRICS ── */}
        <section className="mt-14" data-testid="section-metrics">
          <h2 className="text-[20px] font-bold tracking-tight mb-6">Métriques</h2>

          {/* Range rows */}
          <div className="space-y-5 mb-8">
            <MetricRangeRow
              label="Séance"
              left={stock.dayLow}
              right={stock.dayHigh}
              current={stock.price}
              rightLabel="Cap. boursière"
              rightValue={formatCompactFcfa(stock.mktCapBn * 1e9)}
            />
            <MetricRangeRow
              label="52 semaines"
              left={stock.yearLow}
              right={stock.yearHigh}
              current={stock.price}
              rightLabel="PER"
              rightValue={stock.peRatio}
            />
          </div>

          {/* Grid metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 pt-5 border-t border-black/[0.07]">
            <MetricCell label="Ouverture" value={formatFcfa(stock.open)} />
            <MetricCell label="Clôture" value={formatFcfa(stock.close)} />
            <MetricCell label="Bêta 52S" value={stock.beta52w} />
            <MetricCell label="" value="" />
            <MetricCell label="Achat" value={formatFcfa(stock.bid)} />
            <MetricCell label="Vente" value={formatFcfa(stock.ask)} />
            <MetricCell label="" value="" />
            <MetricCell label="Rendement" value={`${stock.divYield} %`} />
          </div>
        </section>

        {/* ── DIVIDENDS ── */}
        <section className="mt-14" data-testid="section-dividends">
          <button className="flex items-center gap-1.5 group mb-5">
            <h2 className="text-[20px] font-bold tracking-tight">Dividendes</h2>
            <ChevronRight size={18} className="text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
          </button>
          <ul className="space-y-3.5">
            {stock.dividends.map((d, i) => (
              <DividendRow
                key={i}
                dividend={d}
                maxValue={Math.max(...stock.dividends.map((x) => x.value))}
              />
            ))}
          </ul>
        </section>

        {/* ── ANALYSTS ── */}
        <section className="mt-14" data-testid="section-analysts">
          <h2 className="text-[20px] font-bold tracking-tight">Recommandations</h2>
          <div className="mt-5 text-[40px] font-bold num tracking-tight leading-none">
            {formatFcfa(stock.targetPrice)}
          </div>
          <p className="mt-2 text-[13px] text-[#6B6B6B] max-w-lg">
            Objectif de cours moyen. Estimation haute {formatFcfa(Math.round(stock.targetPrice * 1.18))}, basse {formatFcfa(Math.round(stock.targetPrice * 0.82))}. Suivi par {stock.analysts.count} analystes.
          </p>

          <div className="mt-5">
            <div className="flex h-[10px] rounded-full overflow-hidden" data-testid="analysts-bar">
              <div style={{ width: `${stock.analysts.buy}%` }} className="bg-[#00D084]" />
              <div style={{ width: `${stock.analysts.hold}%` }} className="bg-[#D1D1D6]" />
              <div style={{ width: `${stock.analysts.sell}%` }} className="bg-[#E23A3A]" />
            </div>
            <div className="mt-4 grid grid-cols-3">
              <div>
                <div className="text-[13px] font-semibold text-[#00A468]">Acheter</div>
                <div className="text-[22px] font-bold num">{stock.analysts.buy} %</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#6B6B6B]">Conserver</div>
                <div className="text-[22px] font-bold num">{stock.analysts.hold} %</div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#E23A3A]">Vendre</div>
                <div className="text-[22px] font-bold num">{stock.analysts.sell} %</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EVENTS ── */}
        <section className="mt-14" data-testid="section-events">
          <h2 className="text-[20px] font-bold tracking-tight mb-5">Événements à venir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stock.events.map((e, i) => (
              <EventCard key={i} event={e} />
            ))}
          </div>
        </section>

        {/* ── RELATED ── */}
        <section className="mt-14" data-testid="section-related">
          <h2 className="text-[20px] font-bold tracking-tight mb-5">Valeurs similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {related.map((r) => (
              <RelatedCard key={r.ticker} stock={r} />
            ))}
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section className="mt-14">
          <h2 className="text-[20px] font-bold tracking-tight mb-4">À propos</h2>
          <p className="text-[14px] text-[#0A0A0A]/80 leading-relaxed max-w-3xl">{stock.about}</p>
          <p className="mt-3 text-[12px] text-[#A1A1A6]">
            Cotations fictives — démonstration d&apos;interface.
          </p>
        </section>
      </main>

      {/* ── SIDEBAR ── */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-[76px] space-y-3 pt-6">
          {/* Sign-up CTA */}
          <div className="rounded-[16px] border border-black/[0.08] p-6" data-testid="visitor-cta">
            <h3 className="text-[17px] font-bold mb-1">Investissez dans {stock.name}</h3>
            <p className="text-[13px] text-[#6B6B6B] mb-5 leading-relaxed">
              Créez votre compte Felix pour acheter et vendre des actions BRVM sans frais de courtage, directement depuis votre téléphone.
            </p>
            <button
              className="w-full h-[46px] rounded-full bg-[#0A0A0A] text-white text-[14px] font-semibold hover:bg-[#222] transition-colors"
              data-testid="btn-create-account"
            >
              Créer un compte
            </button>
            <button
              className="w-full h-[46px] rounded-full mt-2 text-[#0A0A0A] text-[14px] font-semibold hover:bg-[#F5F5F7] transition-colors"
              data-testid="btn-login-side"
            >
              Se connecter
            </button>
          </div>

          {/* Investir régulièrement CTA */}
          <div className="rounded-[16px] border border-black/[0.08] p-6">
            <h3 className="text-[16px] font-bold leading-snug mb-1">
              Investissez régulièrement et faites croître votre patrimoine
            </h3>
            <p className="text-[12.5px] text-[#6B6B6B] mt-2 leading-relaxed">
              Les plans d&apos;investissement automatique sont gratuits pour toujours.
            </p>
            <button className="w-full h-[44px] rounded-full mt-4 bg-[#F5F5F7] hover:bg-[#EBEBEF] text-[#0A0A0A] text-[13.5px] font-semibold transition-colors">
              Créer un plan
            </button>
          </div>

          {/* Quick facts */}
          <div className="rounded-[16px] border border-black/[0.08] p-5" data-testid="quick-facts">
            <h3 className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-4">
              En bref
            </h3>
            <dl className="space-y-3 text-[13.5px]">
              <FactRow label="Ticker" value={stock.ticker} />
              <FactRow label="Secteur" value={stock.sector} />
              <FactRow label="Sous-secteur" value={stock.subIndustry} />
              <FactRow label="Marché" value="BRVM · UEMOA" />
              <FactRow label="Devise" value="FCFA (XOF)" />
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  if (!label) return <div />;
  return (
    <div>
      <div className="text-[12px] text-[#6B6B6B]">{label}</div>
      <div className="mt-1 text-[15px] font-bold num">{value}</div>
    </div>
  );
}

function MetricRangeRow({
  label,
  left,
  right,
  current,
  rightLabel,
  rightValue,
}: {
  label: string;
  left: number;
  right: number;
  current: number;
  rightLabel: string;
  rightValue: string;
}) {
  const pos = Math.max(0, Math.min(1, (current - left) / (right - left || 1)));
  return (
    <div className="grid grid-cols-2 gap-8 items-center">
      <div>
        <div className="text-[12px] text-[#6B6B6B] mb-2">{label}</div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="num font-semibold text-[13px]">{left.toLocaleString('fr-FR')}</span>
          <div className="relative h-[6px] rounded-full bg-[#E5E5EA]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#00D084]"
              style={{ width: `${pos * 100}%` }}
            />
          </div>
          <span className="num font-semibold text-[13px]">{right.toLocaleString('fr-FR')}</span>
        </div>
      </div>
      <div>
        <div className="text-[12px] text-[#6B6B6B] mb-1.5">{rightLabel}</div>
        <div className="text-[15px] font-bold num">{rightValue}</div>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#6B6B6B]">{label}</dt>
      <dd className="font-semibold text-right truncate">{value}</dd>
    </div>
  );
}

function DividendRow({ dividend, maxValue }: { dividend: Dividend; maxValue: number }) {
  const pct = (dividend.value / maxValue) * 100;
  return (
    <li className="grid grid-cols-[72px_1fr_auto] items-center gap-4">
      <span className="text-[13px] text-[#6B6B6B]">{dividend.period}</span>
      <div className="h-[8px] rounded-full bg-[#F5F5F7] overflow-hidden">
        <div className="h-full bg-[#00D084] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[13px] font-semibold num">{dividend.value.toLocaleString('fr-FR')} FCFA</span>
    </li>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="rounded-[14px] border border-black/[0.08] p-5">
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] font-bold leading-none">{event.day}</span>
        <span className="text-[12px] text-[#6B6B6B]">{event.month}</span>
      </div>
      <div className="mt-2.5 text-[13.5px] font-semibold">{event.title}</div>
      <p className="mt-1.5 text-[12.5px] text-[#6B6B6B] leading-snug">{event.desc}</p>
    </div>
  );
}

function RelatedCard({ stock }: { stock: Stock }) {
  const positive = stock.changePct >= 0;
  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="rounded-[14px] border border-black/[0.08] p-4 hover:bg-[#F5F5F7] transition-colors flex flex-col gap-3 min-h-[150px]"
      data-testid={`related-${stock.ticker}`}
    >
      <Logo ticker={stock.ticker} size={32} />
      <div>
        <div className="text-[13.5px] font-semibold leading-snug">{stock.name}</div>
        <div className={`mt-1 text-[13px] font-bold num ${positive ? 'text-[#00A468]' : 'text-[#E23A3A]'}`}>
          {positive ? '▲' : '▼'} {formatPct(stock.changePct, { withSign: false })}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[10.5px] text-[#6B6B6B] font-medium">
            {stock.subIndustry}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[10.5px] text-[#6B6B6B] font-medium">
            UEMOA
          </span>
        </div>
      </div>
    </Link>
  );
}
