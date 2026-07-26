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

/** Format a FCFA amount using dots as thousands separator: 47.240 FCFA */
export function formatFcfa(n: number): string {
  return `${Math.round(n).toLocaleString('de-DE')} FCFA`;
}

export function formatCompactFcfa(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2).replace('.', ',')} T FCFA`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2).replace('.', ',')} Md FCFA`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} M FCFA`;
  return formatFcfa(n);
}
