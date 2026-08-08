import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dropdown from '../components/Dropdown';
import Logo from '../components/Logo';
import StockTable from '../components/StockTable';
import MarketStatBar from '../components/MarketStatBar';
import { STOCKS } from '../data/mockData';
import { api } from '../services/api';
import { formatCurrency, formatPct } from '../lib/format';
import { useExchange } from '../contexts/ExchangeContext';
import type { Stock } from '../types';

function quotesToStocks(quotes: Awaited<ReturnType<typeof api.quotes>>): Stock[] {
  return quotes.map((q) => {
    const mock = STOCKS.find((s) => s.ticker === q.ticker);
    return {
      ticker: q.ticker,
      name: mock?.name ?? q.ticker,
      sector: mock?.sector ?? '',
      subIndustry: mock?.subIndustry ?? '',
      price: q.price,
      changePct: q.change_pct ?? 0,
      mktCapBn: mock?.mktCapBn ?? 0,
    };
  });
}

export default function Home() {
  const [period, setPeriod] = useState('1D');
  const [sidebarSort, setSidebarSort] = useState('change_desc');
  const [liveStocks, setLiveStocks] = useState<Stock[]>(STOCKS);
  const [computedAt, setComputedAt] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t, i18n } = useTranslation();
  const { currency } = useExchange();

  const PERIODS = [
    { value: '1D', label: t('stock.period_1d') },
    { value: '1W', label: t('stock.period_1w') },
    { value: '1M', label: t('stock.period_1m') },
    { value: '6M', label: '6M' },
    { value: '1Y', label: t('stock.period_1y') },
  ];

  const SORT_OPTIONS = [
    { value: 'change_desc', label: t('home.sort_up') },
    { value: 'change_asc', label: t('home.sort_down') },
    { value: 'cap_desc', label: t('home.sort_cap') },
  ];

  const fetchData = () => {
    api.quotes('BRVM')
      .then((q) => { if (q.length > 0) setLiveStocks(quotesToStocks(q)); })
      .catch(() => {/* keep current */});
    api.marketStats('BRVM')
      .then((s) => setComputedAt(new Date(s.computed_at)))
      .catch(() => {/* keep current */});
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Average % change across all live stocks — proxy for market direction
  const avgChangePct = useMemo(() => {
    if (!liveStocks.length) return 0;
    return liveStocks.reduce((s, x) => s + x.changePct, 0) / liveStocks.length;
  }, [liveStocks]);

  // Last update time in GMT
  const updatedTime = computedAt
    ? computedAt.toLocaleTimeString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Abidjan',
      })
    : null;

  const movers = useMemo(
    () => [...liveStocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 10),
    [liveStocks],
  );

  const sidebarStocks = useMemo(() => {
    const s = [...liveStocks];
    if (sidebarSort === 'change_desc') return s.sort((a, b) => b.changePct - a.changePct);
    if (sidebarSort === 'change_asc') return s.sort((a, b) => a.changePct - b.changePct);
    return s.sort((a, b) => b.mktCapBn - a.mktCapBn);
  }, [liveStocks, sidebarSort]);

  return (
    <div data-testid="page-home">
      {/* Market hero — full width */}
      <section className="w-full border-b border-black/[0.06]">
        <div className="mx-auto max-w-shell px-6 lg:px-10 py-10 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest">
                <span className="relative inline-flex items-center justify-center w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#00D084] live-dot" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#00A468]" />
                </span>
                BRVM Composite · {t('home.live_badge')}
              </div>

              <div className="mt-4 flex items-baseline gap-4 flex-wrap">
                <div className={`text-[17px] font-bold num ${avgChangePct >= 0 ? 'text-[#00A468]' : 'text-[#E23A3A]'}`}>
                  {avgChangePct >= 0 ? '▲' : '▼'} {avgChangePct >= 0 ? '+' : ''}{avgChangePct.toFixed(2)} %
                  <span className="opacity-60 font-normal text-[13px] ml-1">
                    {i18n.language === 'en' ? 'avg. change' : 'variation moy.'}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 text-[13px] text-[#6B6B6B] num">
                {liveStocks.length} {i18n.language === 'en' ? 'stocks' : 'valeurs'}
                {updatedTime && (
                  <> · {i18n.language === 'en' ? 'Updated' : 'Mise à jour'} {updatedTime} GMT</>
                )}
              </div>

              <div className="mt-5 flex items-center gap-1 flex-wrap">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 h-[34px] rounded-full text-[13px] font-medium transition-colors ${
                      period === p.value
                        ? 'bg-[#0A0A0A] text-white'
                        : 'text-[#6B6B6B] hover:text-[#0A0A0A] hover:bg-[#F5F5F7]'
                    }`}
                    data-testid={`period-${p.value}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full">
              <IndexSparkline />
            </div>
          </div>

          <div className="mt-8">
            <MarketStatBar />
          </div>
        </div>
      </section>

      {/* Two-column: main content + sidebar */}
      <div className="mx-auto max-w-shell px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-0 lg:gap-8 xl:gap-10">

          {/* ── MAIN CONTENT ── */}
          <div className="min-w-0">

            {/* Discover — Top movers */}
            <section className="mt-14" data-testid="section-movers">
              <h2 className="text-[24px] md:text-[26px] font-bold tracking-tight">{t('home.discover')}</h2>
              <h3 className="mt-1 text-[14px] font-medium text-[#6B6B6B]">{t('home.top_movers')}</h3>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {movers.slice(0, 5).map((m, i) => (
                  <MoverCard key={m.ticker} stock={m} rank={i + 1} />
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {movers.slice(5, 10).map((m, i) => (
                  <MoverCard key={m.ticker} stock={m} rank={i + 6} />
                ))}
              </div>
            </section>

            {/* All stocks table */}
            <section className="mt-14 pb-20" data-testid="section-all-stocks">
              <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-[24px] md:text-[26px] font-bold tracking-tight leading-none">
                    {t('home.all_stocks')}
                  </h2>
                  <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
                    {t('home.all_stocks_sub', { count: liveStocks.length })}
                  </p>
                </div>
              </div>
              <StockTable stocks={liveStocks} />
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[76px] pt-10 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold">{t('home.sidebar_title')}</h3>
                <Dropdown
                  options={SORT_OPTIONS}
                  value={sidebarSort}
                  onChange={setSidebarSort}
                  align="right"
                />
              </div>

              <div className="space-y-0">
                {sidebarStocks.map((s) => (
                  <SidebarStockRow key={s.ticker} stock={s} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MoverCard({ stock, rank }: { stock: Stock; rank: number }) {
  const positive = stock.changePct >= 0;
  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="relative rounded-[14px] bg-[#F7F7F8] hover:bg-[#EFEFEF] border border-black/[0.04] px-4 py-4 flex flex-col justify-between min-h-[148px] overflow-hidden transition-colors"
      data-testid={`mover-${stock.ticker}`}
    >
      {/* Rank watermark */}
      <span
        className="absolute -right-1 -top-2 text-[72px] font-black leading-none select-none pointer-events-none"
        style={{ color: 'rgba(0,0,0,0.045)', letterSpacing: '-0.04em' }}
        aria-hidden="true"
      >
        {rank}
      </span>

      <Logo ticker={stock.ticker} size={34} />

      <div>
        <div className="text-[13px] font-semibold leading-snug truncate text-[#0A0A0A] mt-3">
          {stock.name}
        </div>
        <div className="text-[11.5px] text-[#A1A1A6] mt-0.5 truncate">{stock.subIndustry}</div>
        <div
          className={`mt-2 text-[13.5px] font-bold num ${positive ? 'text-[#00A468]' : 'text-[#E23A3A]'}`}
        >
          {positive ? '▲' : '▼'} {formatPct(stock.changePct, { withSign: false })}
        </div>
      </div>
    </Link>
  );
}

function SidebarStockRow({ stock }: { stock: Stock }) {
  const positive = stock.changePct >= 0;
  const { currency } = useExchange();
  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="flex items-center gap-3 px-2 py-3 rounded-[10px] hover:bg-[#F5F5F7] transition-colors"
    >
      <Logo ticker={stock.ticker} size={34} />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate leading-tight">{stock.name}</div>
        <div className="text-[12px] text-[#6B6B6B] num mt-0.5">{formatCurrency(stock.price, currency)}</div>
      </div>
      <div className={`text-[13px] font-bold num shrink-0 ${positive ? 'text-[#00A468]' : 'text-[#E23A3A]'}`}>
        {positive ? '+' : ''}{stock.changePct.toFixed(2)} %
      </div>
    </Link>
  );
}

function IndexSparkline() {
  const points = [30, 34, 29, 36, 42, 38, 46, 44, 50, 48, 55, 60, 58, 64, 62, 68];
  const w = 500;
  const h = 120;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const line = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (w - 4) + 2;
      const y = h - ((v - min) / (max - min || 1)) * (h - 16) - 8;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${line} L ${w - 2} ${h} L 2 ${h} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[110px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="index-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00D084" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00D084" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#index-grad)" />
        <path
          d={line}
          stroke="#00A468"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
