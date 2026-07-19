import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-10 pb-24" data-testid="page-watchlist">
      <h1 className="text-[40px] font-bold tracking-tight leading-none">Liste de suivi</h1>

      <div className="mt-16 max-w-lg mx-auto text-center rounded-card border hairline p-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface flex items-center justify-center mb-6">
          <Star size={26} strokeWidth={1.6} className="text-muted" />
        </div>
        <h2 className="text-[20px] font-bold mb-2">Aucune valeur ajoutée</h2>
        <p className="text-muted text-[14px] max-w-sm mx-auto leading-relaxed">
          Suivez les valeurs BRVM qui vous intéressent pour les retrouver ici en un coup d&apos;œil.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 px-6 items-center rounded-full bg-mint hover:bg-mint-deep text-white font-semibold text-[14px] transition-colors"
          data-testid="btn-add-watchlist"
        >
          Explorer les valeurs
        </Link>
      </div>
    </div>
  );
}
