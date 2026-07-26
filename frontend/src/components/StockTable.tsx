import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import Logo from './Logo';
import { STOCKS } from '../data/mockData';
import { formatFcfa, formatPct, formatCompactFcfa } from '../lib/format';
import type { Stock } from '../types';

type SortKey = 'name' | 'price' | 'change' | 'cap';
type SortDir = 'asc' | 'desc';

interface Props {
  stocks?: Stock[];
}

export default function StockTable({ stocks = STOCKS }: Props) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? stocks.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.ticker.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q),
        )
      : [...stocks];

    const dir = sortDir === 'asc' ? 1 : -1;
    return base.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'fr');
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'change':
          cmp = a.changePct - b.changePct;
          break;
        case 'cap':
          cmp = a.mktCapBn - b.mktCapBn;
          break;
      }
      return cmp * dir;
    });
  }, [stocks, query, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div data-testid="stock-table">
      <div className="flex items-center gap-3 mb-5">
        <label className="flex items-center gap-2.5 h-11 px-4 rounded-pill bg-surface text-muted flex-1 max-w-md focus-within:ring-1 focus-within:ring-black/20 transition">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une valeur, un ticker, un secteur…"
            className="bg-transparent w-full outline-none text-[14px] text-ink placeholder:text-muted"
            data-testid="stock-table-search"
          />
        </label>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <SortPill label="Nom" active={sortKey === 'name'} dir={sortDir} onClick={() => onSort('name')} />
          <SortPill label="Prix" active={sortKey === 'price'} dir={sortDir} onClick={() => onSort('price')} />
          <SortPill label="Variation" active={sortKey === 'change'} dir={sortDir} onClick={() => onSort('change')} />
          <SortPill label="Cap." active={sortKey === 'cap'} dir={sortDir} onClick={() => onSort('cap')} />
        </div>
      </div>

      <div className="rounded-card border hairline overflow-hidden bg-white shadow-card">
        <div className="hidden md:grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center px-5 h-11 bg-surface text-[11px] font-semibold text-muted uppercase tracking-widest">
          <span>Valeur</span>
          <span>Secteur</span>
          <span className="text-right">Prix</span>
          <span className="text-right">Var. %</span>
          <span className="text-right">Capitalisation</span>
        </div>

        <ul>
          {filtered.map((s) => (
            <li key={s.ticker} className="border-t hairline first:border-t-0">
              <Link
                to={`/stock/${s.ticker}`}
                className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center px-5 h-16 hover:bg-surface transition-colors"
                data-testid={`stock-row-${s.ticker}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Logo ticker={s.ticker} size={32} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate leading-tight">{s.name}</div>
                    <div className="text-[12px] text-muted num">{s.ticker}</div>
                  </div>
                </div>
                <div className="text-[13px] text-muted truncate">{s.sector}</div>
                <div className="text-right num text-[14px] font-semibold">{formatFcfa(s.price)}</div>
                <div
                  className={`text-right num text-[14px] font-semibold ${
                    s.changePct > 0
                      ? 'text-mint-deep'
                      : s.changePct < 0
                        ? 'text-loss'
                        : 'text-muted'
                  }`}
                >
                  {formatPct(s.changePct)}
                </div>
                <div className="text-right num text-[13px] text-ink">
                  {formatCompactFcfa(s.mktCapBn * 1e9)}
                </div>
              </Link>
            </li>
          ))}

          {filtered.length === 0 && (
            <li className="px-5 py-16 text-center text-muted text-[14px]">
              Aucune valeur ne correspond à votre recherche.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SortPill({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-9 px-3 rounded-pill font-semibold transition-colors ${
        active ? 'bg-ink text-white' : 'text-muted hover:bg-surface hover:text-ink'
      }`}
    >
      {label}
      {active && (dir === 'asc' ? <ArrowUp size={12} strokeWidth={2.4} /> : <ArrowDown size={12} strokeWidth={2.4} />)}
    </button>
  );
}
