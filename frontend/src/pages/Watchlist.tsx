import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function Watchlist() {
  return (
    <div
      className="mx-auto max-w-shell px-6 py-24 text-center"
      data-testid="page-watchlist"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-surface flex items-center justify-center mb-6">
        <Lock size={24} strokeWidth={1.8} />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
        Connectez-vous pour accéder à votre liste
      </h1>
      <p className="text-muted mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
        Sauvegardez vos valeurs BRVM préférées et retrouvez-les d&apos;un coup d&apos;œil en créant un
        compte Felix.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          className="h-12 px-6 rounded-pill bg-ink text-white font-semibold hover:opacity-90 transition-opacity"
          data-testid="btn-signup-watchlist"
        >
          Créer un compte
        </button>
        <button
          className="h-12 px-6 rounded-pill text-ink font-semibold hover:bg-surface transition-colors"
          data-testid="btn-login-watchlist"
        >
          Se connecter
        </button>
      </div>
      <div className="mt-10">
        <Link to="/" className="text-[14px] font-semibold text-muted hover:text-ink underline">
          Explorer les marchés BRVM
        </Link>
      </div>
    </div>
  );
}
