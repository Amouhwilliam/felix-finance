// Mock data for the BRVM (Bourse Régionale des Valeurs Mobilières) heatmap.
// NOTE: All prices and % changes are placeholder values used for UI prototyping only.
// The shape is intentionally simple so it can be swapped for a real API later.
//
// Sector totals cascade automatically from `marketCapWeight` (relative unit — not FCFA).
// `changePct` is the day's % move; positive = green, negative = red.

export const SECTORS = [
  {
    key: 'banks',
    name: 'Banques',
    stocks: [
      { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécoms', marketCapWeight: 0, changePct: 0, price: 0 }, // moved
    ],
  },
];

// Master flat list (single source of truth). We rebuild sector groupings from this.
export const STOCKS = [
  // Telecoms — Sonatel is the BRVM heavyweight
  { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécoms', marketCapWeight: 64, changePct: +1.24, price: 22450 },
  { ticker: 'ONTBF', name: 'Onatel Burkina Faso', sector: 'Télécoms', marketCapWeight: 22, changePct: -0.62, price: 3980 },

  // Banks
  { ticker: 'ETIT', name: 'Ecobank Transnational', sector: 'Banques', marketCapWeight: 55, changePct: -2.31, price: 18 },
  { ticker: 'SGBC', name: 'Société Générale CI', sector: 'Banques', marketCapWeight: 42, changePct: +3.08, price: 21500 },
  { ticker: 'NSBC', name: 'NSIA Banque CI', sector: 'Banques', marketCapWeight: 28, changePct: +0.42, price: 8940 },
  { ticker: 'BICC', name: 'BICICI', sector: 'Banques', marketCapWeight: 22, changePct: -1.12, price: 7180 },
  { ticker: 'BOAC', name: 'Bank of Africa Côte d\u2019Ivoire', sector: 'Banques', marketCapWeight: 20, changePct: +2.15, price: 6420 },
  { ticker: 'BOAB', name: 'Bank of Africa Bénin', sector: 'Banques', marketCapWeight: 18, changePct: -0.34, price: 5980 },
  { ticker: 'BOAS', name: 'Bank of Africa Sénégal', sector: 'Banques', marketCapWeight: 15, changePct: +1.78, price: 4720 },
  { ticker: 'BOAN', name: 'Bank of Africa Niger', sector: 'Banques', marketCapWeight: 12, changePct: -3.44, price: 5210 },
  { ticker: 'CBIBF', name: 'Coris Bank Burkina Faso', sector: 'Banques', marketCapWeight: 14, changePct: +0.11, price: 9080 },

  // Industry
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

  // Public Utilities
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
  // sort each sector by marketCapWeight desc
  for (const arr of map.values()) arr.sort((a, b) => b.marketCapWeight - a.marketCapWeight);

  // return in fixed sector order
  return SECTOR_ORDER.filter((k) => map.has(k)).map((sector) => ({
    sector,
    stocks: map.get(sector),
    totalWeight: map.get(sector).reduce((s, x) => s + x.marketCapWeight, 0),
  }));
}

export function getStockByTicker(ticker) {
  return STOCKS.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
}

// Mock portfolio holdings (used by the Portfolio screen)
export const HOLDINGS = [
  { ticker: 'SNTS', shares: 12, avgBuy: 21800 },
  { ticker: 'SGBC', shares: 4, avgBuy: 20100 },
  { ticker: 'PALC', shares: 8, avgBuy: 8100 },
];

export function computeHoldingRows() {
  return HOLDINGS.map((h) => {
    const s = getStockByTicker(h.ticker);
    const value = h.shares * s.price;
    const cost = h.shares * h.avgBuy;
    const pl = value - cost;
    const plPct = (pl / cost) * 100;
    return { ...h, name: s.name, price: s.price, changePct: s.changePct, value, pl, plPct };
  });
}
