import React from 'react';
import { Bell, DollarSign, Globe, Info, ChevronRight, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExchange } from '../contexts/ExchangeContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { currency } = useExchange();

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');

  const currencyLabel = currency === 'XOF' ? 'FCFA (XOF)' : currency;

  const rows: { icon: LucideIcon; label: string; value: string; testId: string; onClick?: () => void }[] = [
    { icon: Bell, label: t('settings.notifications'), value: t('settings.notifications_on'), testId: 'row-notifications' },
    { icon: DollarSign, label: t('settings.currency'), value: currencyLabel, testId: 'row-currency' },
    {
      icon: Globe,
      label: t('settings.language'),
      value: i18n.language === 'fr' ? 'Français' : 'English',
      testId: 'row-language',
      onClick: toggleLang,
    },
    { icon: Info, label: t('settings.about'), value: 'v0.2.0', testId: 'row-about' },
  ];

  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-10 pb-24" data-testid="page-settings">
      <h1 className="text-[40px] font-bold tracking-tight leading-none">{t('settings.title')}</h1>

      <div className="mt-10 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mint/15 flex items-center justify-center">
            <span className="text-mint-deep font-bold text-lg">F</span>
          </div>
          <div>
            <div className="text-[16px] font-semibold">Felix</div>
            <div className="text-[13px] text-muted">{t('settings.subtitle')}</div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2">
            {t('settings.preferences')}
          </h2>
          <ul className="divide-y hairline border-y hairline">
            {rows.map(({ icon: Icon, label, value, testId, onClick }) => (
              <li key={label}>
                <button
                  className="w-full flex items-center justify-between py-4 text-left hover:bg-surface transition-colors px-2 -mx-2 rounded-lg"
                  data-testid={testId}
                  onClick={onClick}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={18} className="text-muted" strokeWidth={1.7} />
                    <span className="text-[15px]">{label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted text-[13px]">
                    <span>{value}</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 text-[12px] text-muted leading-relaxed">
          {t('settings.footer')}
        </p>
      </div>
    </div>
  );
}
