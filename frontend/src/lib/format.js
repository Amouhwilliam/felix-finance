// Color scale for heatmap cells based on % change.
// Deep red for negative moves, deep green for positive, near-neutral graphite around 0.

export function pctToColor(pct) {
  // Clamp to +/-6% for visual saturation
  const p = Math.max(-6, Math.min(6, pct));
  const t = Math.abs(p) / 6; // 0..1

  if (p >= 0) {
    // interpolate between neutral graphite (#2A2E33) and vivid mint (#00D084)
    const r = lerp(0x2a, 0x00, t);
    const g = lerp(0x2e, 0xd0, t);
    const b = lerp(0x33, 0x84, t);
    return `rgb(${r|0}, ${g|0}, ${b|0})`;
  }
  // negative
  const r = lerp(0x2a, 0xff, t);
  const g = lerp(0x2e, 0x4d, t);
  const b = lerp(0x33, 0x4d, t);
  return `rgb(${r|0}, ${g|0}, ${b|0})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function formatPct(pct) {
  const sign = pct > 0 ? '+' : pct < 0 ? '' : '';
  return `${sign}${pct.toFixed(2)}\u202f%`;
}

export function formatFcfa(n) {
  // FCFA formatting with thin non-breaking spaces
  return `${Math.round(n).toLocaleString('fr-FR')}\u202fFCFA`;
}
