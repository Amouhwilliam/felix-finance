import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

// Trade-Republic-style top navigation for the web app.
// Left: Felix wordmark. Center: search input (stubbed). Right: primary nav + avatar.

export default function TopNav() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b hairline" data-testid="top-nav">
      <div className="mx-auto max-w-shell px-6 lg:px-10 h-16 flex items-center gap-6">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="brand-felix">
          <FelixMark />
          <span className="text-[17px] font-semibold tracking-tight">Felix</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[560px]">
          <label className="flex items-center gap-2.5 h-11 px-4 rounded-full bg-surface text-muted focus-within:ring-1 focus-within:ring-black/20">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              placeholder="Rechercher une valeur, un secteur…"
              className="bg-transparent w-full outline-none text-[14px] text-ink placeholder:text-muted"
              data-testid="nav-search"
            />
          </label>
        </div>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium">
          <NavLink to="/portfolio" data-active={location.pathname === '/portfolio'} className={({isActive}) => `nav-link ${isActive ? 'text-ink' : 'text-ink/85 hover:text-ink'}`} data-testid="nav-portfolio">
            Portefeuille
          </NavLink>
          <NavLink to="/watchlist" data-active={location.pathname === '/watchlist'} className={({isActive}) => `nav-link ${isActive ? 'text-ink' : 'text-ink/85 hover:text-ink'}`} data-testid="nav-watchlist">
            Liste
          </NavLink>
          <NavLink to="/settings" data-active={location.pathname === '/settings'} className={({isActive}) => `nav-link ${isActive ? 'text-ink' : 'text-ink/85 hover:text-ink'}`} data-testid="nav-settings">
            Réglages
          </NavLink>
        </nav>

        {/* Avatar */}
        <div className="ml-1 shrink-0 w-9 h-9 rounded-full bg-[#1D6BFE] text-white text-[13px] font-semibold flex items-center justify-center" data-testid="avatar">
          F
        </div>
      </div>
    </header>
  );
}

function FelixMark() {
  // Waves-style mark inspired by the reference, redrawn to remain distinctive.
  return (
    <svg width="30" height="18" viewBox="0 0 42 24" fill="none" aria-hidden="true">
      <path d="M2 18 C 8 8, 14 8, 20 18 S 34 28, 40 18" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M2 10 C 8 0, 14 0, 20 10 S 34 20, 40 10" stroke="#000" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
    </svg>
  );
}
