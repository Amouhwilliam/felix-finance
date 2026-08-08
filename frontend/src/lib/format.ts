export function pctToColor(pct: number): string {
  const p = Math.max(-6, Math.min(6, pct));
  const t = Math.abs(p) / 6;

  if (p >= 0) {
    const r = lerp(0xe5, 0x00, t);
    const g = lerp(0xe5, 0xd0, t);
    const b = lerp(0xea, 0x84, t);
    return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
  }
  const r = lerp(0xe5, 0xe2, t);
  const g = lerp(0xe5, 0x3a, t);
  const b = lerp(0xea, 0x3a, t);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

export function pctTextColor(pct: number): string {
  const t = Math.min(1, Math.abs(pct) / 6);
  return t > 0.28 ? '#FFFFFF' : '#111111';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function formatPct(pct: number, opts: { withSign?: boolean } = {}): string {
  const { withSign = true } = opts;
  const sign = pct > 0 ? (withSign ? '+' : '') : pct < 0 ? '' : '';
  return `${sign}${pct.toFixed(2)} %`;
}

/** Map currency code to display label */
function currencyLabel(currency: string): string {
  return currency === 'XOF' ? 'FCFA' : currency;
}

/** Format an amount with the exchange's currency label */
export function formatCurrency(n: number, currency = 'XOF'): string {
  return `${Math.round(n).toLocaleString('de-DE')} ${currencyLabel(currency)}`;
}

export function formatCompactCurrency(n: number, currency = 'XOF'): string {
  const label = currencyLabel(currency);
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2).replace('.', ',')} T ${label}`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2).replace('.', ',')} Md ${label}`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} M ${label}`;
  return formatCurrency(n, currency);
}

/** @deprecated use formatCurrency(n, currency) */
export const formatFcfa = (n: number) => formatCurrency(n, 'XOF');
/** @deprecated use formatCompactCurrency(n, currency) */
export const formatCompactFcfa = (n: number) => formatCompactCurrency(n, 'XOF');
