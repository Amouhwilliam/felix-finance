// Color scale for heatmap cells based on % change.
// Deep red for negative, deep mint for positive, near-neutral pale gray around 0.
// Tuned for the LIGHT theme (white app background).

export function pctToColor(pct) {
  const p = Math.max(-6, Math.min(6, pct));
  const t = Math.abs(p) / 6; // 0..1

  if (p >= 0) {
    // neutral warm-gray (#E5E5EA) → vivid mint (#00D084)
    const r = lerp(0xe5, 0x00, t);
    const g = lerp(0xe5, 0xd0, t);
    const b = lerp(0xea, 0x84, t);
    return `rgb(${r|0}, ${g|0}, ${b|0})`;
  }
  const r = lerp(0xe5, 0xe2, t);
  const g = lerp(0xe5, 0x3a, t);
  const b = lerp(0xea, 0x3a, t);
  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}

// When the fill is dark enough, text is white; otherwise near-black.
export function pctTextColor(pct) {
  const t = Math.min(1, Math.abs(pct) / 6);
  return t > 0.28 ? '#FFFFFF' : '#111111';
}

function lerp(a, b, t) { return a + (b - a) * t; }

export function formatPct(pct, opts = {}) {
  const { withSign = true } = opts;
  const sign = pct > 0 ? (withSign ? '+' : '') : pct < 0 ? '' : '';
  return `${sign}${pct.toFixed(2)}\u202f%`;
}

export function formatFcfa(n) {
  return `${Math.round(n).toLocaleString('fr-FR')}\u202fFCFA`;
}

export function formatCompactFcfa(n) {
  // 1 234 000 000 → "1,2 Md FCFA"
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2).replace('.', ',')}\u202fT\u202fFCFA`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2).replace('.', ',')}\u202fMd\u202fFCFA`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')}\u202fM\u202fFCFA`;
  return formatFcfa(n);
}
