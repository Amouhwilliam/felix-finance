import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Portfolio() {
  const { t } = useTranslation();
  return (
    <div
      className="mx-auto max-w-shell px-6 py-24 text-center"
      data-testid="page-portfolio"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-surface flex items-center justify-center mb-6">
        <Lock size={24} strokeWidth={1.8} />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
        {t('auth.portfolio_title')}
      </h1>
      <p className="text-muted mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
        {t('auth.portfolio_body')}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          className="h-12 px-6 rounded-pill bg-ink text-white font-semibold hover:opacity-90 transition-opacity"
          data-testid="btn-signup-portfolio"
        >
          {t('auth.create_account')}
        </button>
        <button
          className="h-12 px-6 rounded-pill text-ink font-semibold hover:bg-surface transition-colors"
          data-testid="btn-login-portfolio"
        >
          {t('auth.login')}
        </button>
      </div>
      <div className="mt-10">
        <Link to="/" className="text-[14px] font-semibold text-muted hover:text-ink underline">
          {t('auth.explore')}
        </Link>
      </div>
    </div>
  );
}
