import React from 'react';
import { Bell, DollarSign, Globe, Info, ChevronRight } from 'lucide-react';

const rows = [
  { icon: Bell, label: 'Notifications', value: 'Activées', testId: 'row-notifications' },
  { icon: DollarSign, label: 'Devise', value: 'FCFA (XOF)', testId: 'row-currency' },
  { icon: Globe, label: 'Langue', value: 'Français', testId: 'row-language' },
  { icon: Info, label: 'À propos de Felix', value: 'v0.1.0', testId: 'row-about' },
];

export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white pb-24" data-testid="page-settings">
      <header
        className="sticky top-0 z-20 bg-black/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div className="px-5 h-14 flex items-end pb-2 border-b hairline">
          <h1 className="text-[22px] font-bold tracking-tight">Réglages</h1>
        </div>
      </header>

      <section className="px-5 pt-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mint/15 flex items-center justify-center">
            <span className="text-mint font-bold text-lg">F</span>
          </div>
          <div>
            <div className="text-[16px] font-semibold">Felix</div>
            <div className="text-[12px] text-white/50">Cartographie thermique de la BRVM</div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Préférences
        </div>
        <ul className="divide-y hairline border-y hairline">
          {rows.map(({ icon: Icon, label, value, testId }) => (
            <li key={label}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-white/5"
                data-testid={testId}
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} className="text-white/60" strokeWidth={1.7} />
                  <span className="text-[15px]">{label}</span>
                </div>
                <div className="flex items-center gap-1 text-white/50 text-[13px]">
                  <span>{value}</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-5 mt-8 text-[11px] text-white/35 leading-relaxed">
        Prototype d&apos;interface. Les cotations affichées sont fictives et ne reflètent pas les prix réels
        du marché.
      </p>
    </div>
  );
}
