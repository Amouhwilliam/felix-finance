import React from 'react';
import { Star } from 'lucide-react';

export default function Watchlist() {
  return (
    <div className="min-h-screen bg-black text-white pb-24" data-testid="page-watchlist">
      <header
        className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b hairline"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="px-5 h-14 flex items-end pb-2">
          <h1 className="text-[22px] font-bold tracking-tight">Liste de suivi</h1>
        </div>
      </header>

      <main className="px-6 pt-24 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full border hairline flex items-center justify-center mb-6">
          <Star size={26} className="text-white/60" strokeWidth={1.6} />
        </div>
        <h2 className="text-[18px] font-semibold mb-2">Aucune valeur ajoutée</h2>
        <p className="text-white/55 text-[14px] max-w-xs leading-relaxed">
          Suivez les valeurs BRVM qui vous intéressent pour les retrouver ici en un coup d&apos;œil.
        </p>
        <button
          className="mt-8 h-12 px-6 rounded-full bg-mint text-black font-semibold text-[15px] active:opacity-80"
          data-testid="btn-add-watchlist"
        >
          Ajouter une valeur
        </button>
      </main>
    </div>
  );
}
