// Mock data for the BRVM (Bourse Régionale des Valeurs Mobilières) heatmap.
// NOTE: All prices, market caps and analyst ratings are placeholder values used
// for UI prototyping only. The shape is intentionally simple so it can be
// swapped for a real API later (single call point: `fetchStocks()`).

// --- Master flat list -------------------------------------------------------
export const STOCKS = [
  // Télécoms — Sonatel is the BRVM heavyweight
  { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécoms', marketCapWeight: 64, changePct: +1.24, price: 22450 },
  { ticker: 'ONTBF', name: 'Onatel Burkina Faso', sector: 'Télécoms', marketCapWeight: 22, changePct: -0.62, price: 3980 },

  // Banques
  { ticker: 'ETIT', name: 'Ecobank Transnational', sector: 'Banques', marketCapWeight: 55, changePct: -2.31, price: 18 },
  { ticker: 'SGBC', name: 'Société Générale CI', sector: 'Banques', marketCapWeight: 42, changePct: +3.08, price: 21500 },
  { ticker: 'NSBC', name: 'NSIA Banque CI', sector: 'Banques', marketCapWeight: 28, changePct: +0.42, price: 8940 },
  { ticker: 'BICC', name: 'BICICI', sector: 'Banques', marketCapWeight: 22, changePct: -1.12, price: 7180 },
  { ticker: 'BOAC', name: 'Bank of Africa Côte d\u2019Ivoire', sector: 'Banques', marketCapWeight: 20, changePct: +2.15, price: 6420 },
  { ticker: 'BOAB', name: 'Bank of Africa Bénin', sector: 'Banques', marketCapWeight: 18, changePct: -0.34, price: 5980 },
  { ticker: 'BOAS', name: 'Bank of Africa Sénégal', sector: 'Banques', marketCapWeight: 15, changePct: +1.78, price: 4720 },
  { ticker: 'BOAN', name: 'Bank of Africa Niger', sector: 'Banques', marketCapWeight: 12, changePct: -3.44, price: 5210 },
  { ticker: 'CBIBF', name: 'Coris Bank Burkina Faso', sector: 'Banques', marketCapWeight: 14, changePct: +0.11, price: 9080 },

  // Industrie
  { ticker: 'NEIC', name: 'Nestlé CI', sector: 'Industrie', marketCapWeight: 30, changePct: -1.85, price: 1620 },
  { ticker: 'SLBC', name: 'Solibra', sector: 'Industrie', marketCapWeight: 26, changePct: +4.12, price: 96500 },
  { ticker: 'UNLC', name: 'Unilever CI', sector: 'Industrie', marketCapWeight: 12, changePct: -0.55, price: 6800 },
  { ticker: 'CFAC', name: 'CFAO Motors CI', sector: 'Industrie', marketCapWeight: 14, changePct: +2.44, price: 795 },
  { ticker: 'FTSC', name: 'Filtisac', sector: 'Industrie', marketCapWeight: 10, changePct: -2.10, price: 1245 },

  // Agriculture
  { ticker: 'PALC', name: 'Palmci', sector: 'Agriculture', marketCapWeight: 22, changePct: +5.24, price: 8720 },
  { ticker: 'SAPH', name: 'SAPH', sector: 'Agriculture', marketCapWeight: 20, changePct: +1.90, price: 3210 },
  { ticker: 'SOGC', name: 'SOGB', sector: 'Agriculture', marketCapWeight: 16, changePct: -1.45, price: 5940 },
  { ticker: 'SCRC', name: 'Sucrivoire', sector: 'Agriculture', marketCapWeight: 8, changePct: -0.08, price: 1150 },

  // Distribution / Energy
  { ticker: 'TTLC', name: 'TotalEnergies Marketing CI', sector: 'Distribution', marketCapWeight: 28, changePct: +0.72, price: 2985 },
  { ticker: 'SHEC', name: 'Vivo Energy CI', sector: 'Distribution', marketCapWeight: 20, changePct: -1.98, price: 1560 },

  // Services Publics
  { ticker: 'SDCC', name: 'Sodeci', sector: 'Services Publics', marketCapWeight: 18, changePct: +2.62, price: 6150 },
  { ticker: 'CIEC', name: 'CIE', sector: 'Services Publics', marketCapWeight: 22, changePct: -0.88, price: 4020 },

  // Transport
  { ticker: 'SVOC', name: 'Bolloré Transport & Logistics CI', sector: 'Transport', marketCapWeight: 14, changePct: +1.05, price: 2340 },
  { ticker: 'STAC', name: 'SETAO', sector: 'Transport', marketCapWeight: 6, changePct: -4.20, price: 610 },
];

export const SECTOR_ORDER = [
  'Télécoms',
  'Banques',
  'Industrie',
  'Agriculture',
  'Distribution',
  'Services Publics',
  'Transport',
];

export function groupBySector() {
  const map = new Map();
  for (const s of STOCKS) {
    if (!map.has(s.sector)) map.set(s.sector, []);
    map.get(s.sector).push(s);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.marketCapWeight - a.marketCapWeight);
  return SECTOR_ORDER.filter((k) => map.has(k)).map((sector) => ({
    sector,
    stocks: map.get(sector),
    totalWeight: map.get(sector).reduce((s, x) => s + x.marketCapWeight, 0),
  }));
}

export function getStockByTicker(ticker) {
  return STOCKS.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
}

// --- Portfolio holdings -----------------------------------------------------
export const HOLDINGS = [
  { ticker: 'SNTS', shares: 12, avgBuy: 21800 },
  { ticker: 'SGBC', shares: 4, avgBuy: 20100 },
  { ticker: 'PALC', shares: 8, avgBuy: 8100 },
  { ticker: 'ETIT', shares: 220, avgBuy: 19 },
  { ticker: 'SDCC', shares: 6, avgBuy: 5900 },
];

export function computeHoldingRows() {
  return HOLDINGS.map((h) => {
    const s = getStockByTicker(h.ticker);
    const value = h.shares * s.price;
    const cost = h.shares * h.avgBuy;
    const pl = value - cost;
    const plPct = cost === 0 ? 0 : (pl / cost) * 100;
    return { ...h, name: s.name, price: s.price, changePct: s.changePct, value, pl, plPct };
  });
}

// --- Per-stock synthetic details (deterministic from ticker) ----------------
function seedFromString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function rng(seedInt) {
  let x = seedInt || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return ((x >>> 0) % 100000) / 100000;
  };
}

export function getStockDetail(ticker) {
  const s = getStockByTicker(ticker);
  if (!s) return null;
  const r = rng(seedFromString(ticker));

  // Market cap in FCFA billions — anchored to weight
  const mktCapBn = Math.round(s.marketCapWeight * 12 + r() * 40);

  // Analyst distribution (must sum to 100)
  const buyPct = 45 + Math.round(r() * 45);
  const holdPct = Math.max(0, Math.min(100 - buyPct, Math.round(r() * (100 - buyPct))));
  const sellPct = 100 - buyPct - holdPct;

  // Target price ~ current +/- reasonable band
  const upside = -0.05 + r() * 0.35; // -5% to +30%
  const targetPrice = Math.round(s.price * (1 + upside));

  return {
    ...s,
    mktCapBn,
    peRatio: (8 + r() * 20).toFixed(1),
    beta52w: (0.6 + r() * 1.4).toFixed(2),
    divYield: (r() * 6).toFixed(2),
    open: Math.round(s.price - (s.price * s.changePct) / 100),
    close: Math.round(s.price + (r() - 0.5) * s.price * 0.01),
    bid: Math.round(s.price * (1 - r() * 0.002)),
    ask: Math.round(s.price * (1 + r() * 0.002)),
    dayLow: Math.round(s.price * (1 - 0.008 - r() * 0.006)),
    dayHigh: Math.round(s.price * (1 + 0.008 + r() * 0.006)),
    yearLow: Math.round(s.price * (1 - 0.18 - r() * 0.12)),
    yearHigh: Math.round(s.price * (1 + 0.10 + r() * 0.18)),
    analysts: { buy: buyPct, hold: holdPct, sell: sellPct, count: 8 + Math.round(r() * 30) },
    targetPrice,
    dividends: [
      { period: 'Juin 2026', value: 245 + Math.round(r() * 250), pct: 0.6 + r() * 0.4 },
      { period: 'Mars 2026', value: 260 + Math.round(r() * 250), pct: 0.8 + r() * 0.5 },
      { period: 'Déc. 2025', value: 240 + Math.round(r() * 250), pct: 0.5 + r() * 0.5 },
      { period: 'Sept. 2025', value: 235 + Math.round(r() * 250), pct: 0.5 + r() * 0.4 },
      { period: 'Juin 2025', value: 225 + Math.round(r() * 250), pct: 0.5 + r() * 0.4 },
    ],
    events: [
      { day: '29', month: 'Juil.', title: 'Publication des résultats', desc: `Résultats semestriels de ${s.name} attendus le 29 juillet 2026.` },
      { day: '29', month: 'Juil.', title: 'Conférence analystes', desc: `${s.name} tiendra sa conférence trimestrielle avec les analystes le 29 juillet 2026.` },
      { day: '27', month: 'Oct.', title: 'Publication des résultats', desc: `Résultats du troisième trimestre de ${s.name} attendus le 27 octobre 2026.` },
    ],
    about: `${s.name} est cotée sur la Bourse Régionale des Valeurs Mobilières (BRVM), la place financière régionale de l'UEMOA. La société opère dans le secteur ${s.sector.toLowerCase()} et fait partie des valeurs suivies par la communauté d'investisseurs de la région ouest-africaine.`,
  };
}

// Related tickers = other stocks in the same sector; if fewer than `limit`,
// pad from the broader universe (largest cap) so the Valeurs à découvrir
// grid never looks sparse.
export function relatedStocks(ticker, limit = 4) {
  const s = getStockByTicker(ticker);
  if (!s) return [];
  const sameSector = STOCKS
    .filter((x) => x.sector === s.sector && x.ticker !== s.ticker)
    .sort((a, b) => b.marketCapWeight - a.marketCapWeight);
  if (sameSector.length >= limit) return sameSector.slice(0, limit);

  const already = new Set([s.ticker, ...sameSector.map((x) => x.ticker)]);
  const fillers = STOCKS
    .filter((x) => !already.has(x.ticker))
    .sort((a, b) => b.marketCapWeight - a.marketCapWeight);
  return [...sameSector, ...fillers].slice(0, limit);
}

// Top movers for the home page (Discover section)
export function topMovers(limit = 5) {
  return [...STOCKS].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, limit);
}
