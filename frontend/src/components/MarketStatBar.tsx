import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { marketStats as mockMarketStats } from '../data/mockData';
import { formatCompactFcfa } from '../lib/format';

interface StatItem {
  label: string;
  value: string;
  accent?: 'mint' | 'loss' | 'ink';
}

export default function MarketStatBar() {
  const [stats, setStats] = useState(mockMarketStats());

  useEffect(() => {
    api.marketStats('BRVM')
      .then((d) => {
        setStats((prev) => ({
          ...prev,
          dailyVolume: d.total_volume_xof ?? prev.dailyVolume,
          total: d.total,
          up: d.up,
          down: d.down,
        }));
      })
      .catch(() => {/* keep mock */});
  }, []);

  const items: StatItem[] = [
    { label: 'Capitalisation totale', value: formatCompactFcfa(stats.mktCapBn * 1e9) },
    { label: 'Volume journalier', value: formatCompactFcfa(stats.dailyVolume) },
    { label: 'Nombre de valeurs', value: `${stats.total}` },
    { label: 'Valeurs en hausse', value: `${stats.up}`, accent: 'mint' },
    { label: 'Valeurs en baisse', value: `${stats.down}`, accent: 'loss' },
  ];

  return (
    <div className="rounded-[14px] bg-white border border-black/[0.07] overflow-hidden" data-testid="market-stat-bar">
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 border-black/[0.07]">
        {items.map((s) => (
          <div key={s.label} className="px-5 py-4">
            <div className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wider">{s.label}</div>
            <div
              className={`mt-1.5 text-[18px] font-bold num tracking-tight ${
                s.accent === 'mint' ? 'text-[#00A468]' : s.accent === 'loss' ? 'text-[#E23A3A]' : 'text-[#0A0A0A]'
              }`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
