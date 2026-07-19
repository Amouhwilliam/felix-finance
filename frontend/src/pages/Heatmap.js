import React, { useState } from 'react';
import { ArrowLeftRight, RotateCw } from 'lucide-react';
import Treemap from '../components/Treemap';
import Dropdown from '../components/Dropdown';

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

export default function Heatmap() {
  const [period, setPeriod] = useState('1D');
  const [index, setIndex] = useState('BRVMC');
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white" data-testid="page-heatmap">
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 bg-black/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="flex items-center justify-between px-3 h-12">
          <button
            className="w-9 h-9 flex items-center justify-center text-white/85 active:opacity-60"
            aria-label="Historique"
            data-testid="btn-history"
          >
            <ArrowLeftRight size={20} strokeWidth={2} className="text-mint" />
          </button>

          <div className="flex items-center gap-1">
            <Dropdown
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              align="center"
              testId="dropdown-period"
            />
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <Dropdown
              options={INDICES}
              value={index}
              onChange={setIndex}
              align="center"
              testId="dropdown-index"
            />
          </div>

          <button
            className="w-9 h-9 flex items-center justify-center text-mint active:opacity-60"
            aria-label="Actualiser"
            data-testid="btn-refresh"
            onClick={refresh}
          >
            <RotateCw size={18} strokeWidth={2.2} className={spinning ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Treemap */}
      <main className="pb-20">
        <Treemap />
      </main>
    </div>
  );
}
