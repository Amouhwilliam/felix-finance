import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STOCKS } from '../data/mockData';

export default function TopNav() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  const toggleLang = () => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');

  const results = query.trim().length >= 1
    ? STOCKS.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.ticker.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (ticker: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/stock/${ticker}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-black/[0.06]" data-testid="top-nav">
      <div className="mx-auto max-w-shell px-6 lg:px-10 h-[60px] flex items-center gap-4">
        <Link to="/" className="flex items-center shrink-0" data-testid="brand-felix">
          <span className="text-[20px] font-black tracking-[-0.04em] text-[#0A0A0A]">Felix</span>
        </Link>

        <div ref={ref} className="flex-1 max-w-[520px] mx-auto relative">
          <label className="flex items-center gap-2.5 h-[38px] px-4 rounded-full bg-[#F5F5F7] text-[#6B6B6B] w-full">
            <Search size={15} strokeWidth={2} className="shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={t('nav.search_placeholder')}
              className="bg-transparent w-full outline-none text-[13.5px] text-[#0A0A0A] placeholder:text-[#A1A1A6]"
              data-testid="nav-search"
            />
          </label>

          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-[12px] border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.10)] overflow-hidden z-50">
              {results.map((s) => (
                <button
                  key={s.ticker}
                  onMouseDown={() => go(s.ticker)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#F5F5F7] transition-colors text-left"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-[#0A0A0A]">{s.name}</div>
                    <div className="text-[12px] text-[#6B6B6B]">{s.ticker} · {s.sector}</div>
                  </div>
                  <div className={`text-[13px] font-semibold num ${s.changePct >= 0 ? 'text-[#00A468]' : 'text-[#E23A3A]'}`}>
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)} %
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium shrink-0">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-[14px] font-medium transition-colors ${isActive ? 'text-[#0A0A0A]' : 'text-[#6B6B6B] hover:text-[#0A0A0A]'}`
            }
            data-testid="nav-markets"
          >
            {t('nav.markets')}
          </NavLink>
          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `text-[14px] font-medium transition-colors ${isActive ? 'text-[#0A0A0A]' : 'text-[#6B6B6B] hover:text-[#0A0A0A]'}`
            }
          >
            {t('nav.watchlist')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleLang}
            className="hidden sm:inline-flex h-9 px-3 items-center text-[12px] font-semibold text-[#6B6B6B] hover:bg-[#F5F5F7] rounded-full transition-colors tracking-wide"
            data-testid="btn-lang"
            title="Switch language"
          >
            {i18n.language === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            className="hidden sm:inline-flex h-9 px-4 items-center text-[13.5px] font-medium text-[#0A0A0A] hover:bg-[#F5F5F7] rounded-full transition-colors"
            data-testid="btn-login"
          >
            {t('nav.login')}
          </button>
          <button
            className="inline-flex h-9 px-4 items-center rounded-full bg-[#0A0A0A] text-white text-[13.5px] font-medium hover:bg-[#222] transition-colors"
            data-testid="btn-signup"
          >
            {t('nav.signup')}
          </button>
        </div>
      </div>
    </header>
  );
}

