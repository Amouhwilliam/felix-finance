import React from 'react';
import { Bell, DollarSign, Globe, Info, ChevronRight } from 'lucide-react';

const rows = [
  { icon: Bell, label: 'Notifications', value: 'Activées', testId: 'row-notifications' },
  { icon: DollarSign, label: 'Devise', value: 'FCFA (XOF)', testId: 'row-currency' },
  { icon: Globe, label: 'Langue', value: 'Français', testId: 'row-language' },
  { icon: Info, label: 'À propos de Felix', value: 'v0.2.0', testId: 'row-about' },
];

export default function Settings() {
  return (
    <div className="mx-auto max-w-shell px-6 lg:px-10 pt-10 pb-24" data-testid="page-settings">
      <h1 className="text-[40px] font-bold tracking-tight leading-none">Réglages</h1>

      <div className="mt-10 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mint/15 flex items-center justify-center">
            <span className="text-mint-deep font-bold text-lg">F</span>
          </div>
          <div>
            <div className="text-[16px] font-semibold">Felix</div>
            <div className="text-[13px] text-muted">Cartographie thermique de la BRVM</div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2">Préférences</h2>
          <ul className="divide-y hairline border-y hairline">
            {rows.map(({ icon: Icon, label, value, testId }) => (
              <li key={label}>
                <button className="w-full flex items-center justify-between py-4 text-left hover:bg-surface transition-colors px-2 -mx-2 rounded-lg" data-testid={testId}>
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
          Prototype d&apos;interface. Les cotations affichées sont fictives et ne reflètent pas les prix
          réels du marché.
        </p>
      </div>
    </div>
  );
}
