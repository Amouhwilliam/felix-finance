import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Star, Wallet, Settings as SettingsIcon } from 'lucide-react';

const items = [
  { to: '/', label: 'Marchés', icon: LayoutGrid, testId: 'tab-markets' },
  { to: '/watchlist', label: 'Liste', icon: Star, testId: 'tab-watchlist' },
  { to: '/portfolio', label: 'Portefeuille', icon: Wallet, testId: 'tab-portfolio' },
  { to: '/settings', label: 'Réglages', icon: SettingsIcon, testId: 'tab-settings' },
];

export default function BottomTabBar() {
  const loc = useLocation();
  // Hide on stock detail pages for a focused reading view
  if (loc.pathname.startsWith('/stock/')) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-black/95 backdrop-blur border-t hairline"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      data-testid="bottom-tab-bar"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-2">
        {items.map(({ to, label, icon: Icon, testId }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              data-testid={testId}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 text-[11px] transition-colors ${
                  isActive ? 'text-mint' : 'text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} className={isActive ? 'tab-pop' : ''} />
                  <span className={isActive ? 'font-medium' : ''}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
