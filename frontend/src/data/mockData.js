// Real BRVM data (sourced from Daba Finance capitalmarkets snapshot).
// Prices, market caps and sector groupings are anchored to the real BRVM Composite,
// intraday % moves are plausible mock values used for UI prototyping.
// Logos are bundled from /public/logos/<TICKER>.png so the app has no runtime
// external dependency.
//
// SWAP POINT: replace this array with a `fetchStocks()` call to move from mock
// data to a real API.

// ------- Master list --------------------------------------------------------
export const STOCKS = [
  // ---- TÉLÉCOMS ----
  { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 32000, changePct: +1.24, mktCapBn: 3200 },
  { ticker: 'ORAC', name: 'Orange Côte d\u2019Ivoire', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 16160, changePct: -0.03, mktCapBn: 2434 },
  { ticker: 'ONTBF', name: 'Onatel Burkina Faso', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 2675, changePct: -0.74, mktCapBn: 181 },

  // ---- BANQUES ----
  // Banques universelles
  { ticker: 'SGBC', name: 'Société Générale CI', sector: 'Banques', subIndustry: 'Banques universelles', price: 37995, changePct: +0.42, mktCapBn: 1182 },
  { ticker: 'BICC', name: 'BICICI', sector: 'Banques', subIndustry: 'Banques universelles', price: 28100, changePct: +1.43, mktCapBn: 468 },
  { ticker: 'ECOC', name: 'Ecobank Côte d\u2019Ivoire', sector: 'Banques', subIndustry: 'Banques universelles', price: 16000, changePct: -0.65, mktCapBn: 880 },
  { ticker: 'NSBC', name: 'NSIA Banque CI', sector: 'Banques', subIndustry: 'Banques universelles', price: 23650, changePct: +7.50, mktCapBn: 584 },
  { ticker: 'SIBC', name: 'Société Ivoirienne de Banque', sector: 'Banques', subIndustry: 'Banques universelles', price: 8760, changePct: +0.69, mktCapBn: 876 },
  { ticker: 'BICB', name: 'BIIC Bénin', sector: 'Banques', subIndustry: 'Banques universelles', price: 6300, changePct: -1.33, mktCapBn: 363 },

  // Réseau BOA
  { ticker: 'BOAC', name: 'Bank of Africa Côte d\u2019Ivoire', sector: 'Banques', subIndustry: 'Réseau BOA', price: 9745, changePct: +0.26, mktCapBn: 389 },
  { ticker: 'BOAB', name: 'Bank of Africa Bénin', sector: 'Banques', subIndustry: 'Réseau BOA', price: 8700, changePct: -0.91, mktCapBn: 352 },
  { ticker: 'BOABF', name: 'Bank of Africa Burkina Faso', sector: 'Banques', subIndustry: 'Réseau BOA', price: 7200, changePct: -0.76, mktCapBn: 316 },
  { ticker: 'BOAM', name: 'Bank of Africa Mali', sector: 'Banques', subIndustry: 'Réseau BOA', price: 5755, changePct: -0.26, mktCapBn: 157 },
  { ticker: 'BOAN', name: 'Bank of Africa Niger', sector: 'Banques', subIndustry: 'Réseau BOA', price: 5350, changePct: -0.83, mktCapBn: 111 },
  { ticker: 'BOAS', name: 'Bank of Africa Sénégal', sector: 'Banques', subIndustry: 'Réseau BOA', price: 7700, changePct: +4.05, mktCapBn: 277 },

  // Holdings / panafricaines
  { ticker: 'ETIT', name: 'Ecobank Transnational', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 68, changePct: -6.85, mktCapBn: 1229 },
  { ticker: 'CBIBF', name: 'Coris Bank Burkina Faso', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 28490, changePct: -5.03, mktCapBn: 911 },
  { ticker: 'ORGT', name: 'Oragroup Togo', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 2680, changePct: -0.12, mktCapBn: 186 },
  { ticker: 'SAFC', name: 'Safca', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 4295, changePct: -2.39, mktCapBn: 34 },

  // ---- INDUSTRIE ----
  // Alimentation & tabac
  { ticker: 'NTLC', name: 'Nestlé Côte d\u2019Ivoire', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 15800, changePct: -1.25, mktCapBn: 348 },
  { ticker: 'SLBC', name: 'Solibra', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 39155, changePct: +0.10, mktCapBn: 644 },
  { ticker: 'STBC', name: 'Sitab', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 23900, changePct: +7.49, mktCapBn: 429 },
  { ticker: 'NEIC', name: 'Nei-Ceda', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 2295, changePct: +6.74, mktCapBn: 29 },
  { ticker: 'SICC', name: 'Sicor', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 5300, changePct: +6.11, mktCapBn: 3 },
  // Biens de consommation
  { ticker: 'UNLC', name: 'Unilever Côte d\u2019Ivoire', sector: 'Industrie', subIndustry: 'Biens de consommation', price: 54495, changePct: -0.92, mktCapBn: 500 },
  { ticker: 'UNXC', name: 'Uniwax', sector: 'Industrie', subIndustry: 'Biens de consommation', price: 1845, changePct: +3.65, mktCapBn: 38 },
  // Automobile
  { ticker: 'CFAC', name: 'CFAO Motors CI', sector: 'Industrie', subIndustry: 'Automobile', price: 1600, changePct: +1.27, mktCapBn: 290 },
  { ticker: 'PRSC', name: 'Tractafric Motors CI', sector: 'Industrie', subIndustry: 'Automobile', price: 4500, changePct: +0.67, mktCapBn: 46 },
  // Matériaux & Chimie
  { ticker: 'FTSC', name: 'Filtisac', sector: 'Industrie', subIndustry: 'Matériaux', price: 1990, changePct: -0.25, mktCapBn: 28 },
  { ticker: 'CABC', name: 'Sicable', sector: 'Industrie', subIndustry: 'Matériaux', price: 3650, changePct: +0.69, mktCapBn: 21 },
  { ticker: 'SEMC', name: 'Eviosys Packaging', sector: 'Industrie', subIndustry: 'Matériaux', price: 1500, changePct: +0.08, mktCapBn: 37 },
  { ticker: 'SIVC', name: 'Erium', sector: 'Industrie', subIndustry: 'Matériaux', price: 2400, changePct: +2.35, mktCapBn: 20 },
  { ticker: 'SMBC', name: 'SMB', sector: 'Industrie', subIndustry: 'Matériaux', price: 15195, changePct: -3.83, mktCapBn: 118 },

  // ---- AGRICULTURE ----
  { ticker: 'PALC', name: 'Palmci', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 8690, changePct: +0.29, mktCapBn: 134 },
  { ticker: 'SPHC', name: 'SAPH', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 7500, changePct: +0.07, mktCapBn: 191 },
  { ticker: 'SOGC', name: 'SOGB', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 8010, changePct: +0.12, mktCapBn: 173 },
  { ticker: 'SCRC', name: 'Sucrivoire', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 3705, changePct: -5.48, mktCapBn: 72 },

  // ---- DISTRIBUTION ----
  { ticker: 'TTLC', name: 'TotalEnergies CI', sector: 'Distribution', subIndustry: 'Carburants', price: 2900, changePct: +0.72, mktCapBn: 182 },
  { ticker: 'TTLS', name: 'TotalEnergies Sénégal', sector: 'Distribution', subIndustry: 'Carburants', price: 3995, changePct: -2.20, mktCapBn: 130 },
  { ticker: 'SHEC', name: 'Vivo Energy CI', sector: 'Distribution', subIndustry: 'Carburants', price: 2190, changePct: -0.45, mktCapBn: 137 },
  { ticker: 'BNBC', name: 'Bernabé', sector: 'Distribution', subIndustry: 'Distribution générale', price: 1875, changePct: +0.10, mktCapBn: 12 },

  // ---- SERVICES PUBLICS ----
  { ticker: 'CIEC', name: 'CIE', sector: 'Services Publics', subIndustry: 'Électricité', price: 5195, changePct: +5.91, mktCapBn: 290 },
  { ticker: 'SDCC', name: 'Sodeci', sector: 'Services Publics', subIndustry: 'Eau', price: 11300, changePct: +0.36, mktCapBn: 101 },

  // ---- TRANSPORT ----
  { ticker: 'SDSC', name: 'Africa Global Logistics CI', sector: 'Transport', subIndustry: 'Logistique', price: 2720, changePct: +0.37, mktCapBn: 148 },
  { ticker: 'STAC', name: 'SETAO', sector: 'Transport', subIndustry: 'Logistique', price: 3185, changePct: -0.31, mktCapBn: 42 },
  { ticker: 'ABJC', name: 'Servair Abidjan', sector: 'Transport', subIndustry: 'Aviation & Services', price: 2990, changePct: +1.36, mktCapBn: 32 },
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

// Group by sector, then by sub-industry within each sector.
export function groupBySector() {
  const out = [];
  for (const sector of SECTOR_ORDER) {
    const inSector = STOCKS.filter((s) => s.sector === sector);
    if (inSector.length === 0) continue;
    const subMap = new Map();
    for (const s of inSector) {
      if (!subMap.has(s.subIndustry)) subMap.set(s.subIndustry, []);
      subMap.get(s.subIndustry).push(s);
    }
    const subgroups = Array.from(subMap.entries()).map(([name, stocks]) => {
      const sorted = [...stocks].sort((a, b) => b.mktCapBn - a.mktCapBn);
      return {
        name,
        stocks: sorted,
        totalWeight: sorted.reduce((s, x) => s + x.mktCapBn, 0),
      };
    }).sort((a, b) => b.totalWeight - a.totalWeight);
    out.push({
      sector,
      subgroups,
      totalWeight: subgroups.reduce((s, g) => s + g.totalWeight, 0),
    });
  }
  return out;
}

export function getStockByTicker(ticker) {
  return STOCKS.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
}

export function logoUrl(ticker) {
  return `/logos/${ticker}.png`;
}

// ------- Portfolio holdings -------------------------------------------------
export const HOLDINGS = [
  { ticker: 'SNTS', shares: 12, avgBuy: 31200 },
  { ticker: 'SGBC', shares: 4, avgBuy: 36500 },
  { ticker: 'ORAC', shares: 20, avgBuy: 15980 },
  { ticker: 'PALC', shares: 40, avgBuy: 8100 },
  { ticker: 'ETIT', shares: 5000, avgBuy: 72 },
  { ticker: 'SDCC', shares: 6, avgBuy: 10900 },
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

// ------- Deterministic stock detail generator -------------------------------
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

  const buyPct = 45 + Math.round(r() * 45);
  const holdPct = Math.max(0, Math.min(100 - buyPct, Math.round(r() * (100 - buyPct))));
  const sellPct = 100 - buyPct - holdPct;
  const upside = -0.05 + r() * 0.35;
  const targetPrice = Math.round(s.price * (1 + upside));

  return {
    ...s,
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
      { period: 'Juin 2026', value: 245 + Math.round(r() * 250) },
      { period: 'Mars 2026', value: 260 + Math.round(r() * 250) },
      { period: 'Déc. 2025', value: 240 + Math.round(r() * 250) },
      { period: 'Sept. 2025', value: 235 + Math.round(r() * 250) },
      { period: 'Juin 2025', value: 225 + Math.round(r() * 250) },
    ],
    events: [
      { day: '29', month: 'Juil.', title: 'Publication des résultats', desc: `Résultats semestriels de ${s.name} attendus le 29 juillet 2026.` },
      { day: '29', month: 'Juil.', title: 'Conférence analystes', desc: `${s.name} tiendra sa conférence trimestrielle avec les analystes le 29 juillet 2026.` },
      { day: '27', month: 'Oct.', title: 'Publication des résultats', desc: `Résultats du troisième trimestre de ${s.name} attendus le 27 octobre 2026.` },
    ],
    about: `${s.name} est cotée sur la Bourse Régionale des Valeurs Mobilières (BRVM), la place financière régionale de l'UEMOA. La société est classée dans le sous-secteur « ${s.subIndustry} » et opère principalement dans le secteur ${s.sector.toLowerCase()}.`,
  };
}

export function relatedStocks(ticker, limit = 4) {
  const s = getStockByTicker(ticker);
  if (!s) return [];
  const sameSub = STOCKS
    .filter((x) => x.subIndustry === s.subIndustry && x.ticker !== s.ticker)
    .sort((a, b) => b.mktCapBn - a.mktCapBn);
  if (sameSub.length >= limit) return sameSub.slice(0, limit);

  const already = new Set([s.ticker, ...sameSub.map((x) => x.ticker)]);
  const sameSector = STOCKS
    .filter((x) => x.sector === s.sector && !already.has(x.ticker))
    .sort((a, b) => b.mktCapBn - a.mktCapBn);
  const combined = [...sameSub, ...sameSector];
  if (combined.length >= limit) return combined.slice(0, limit);

  combined.forEach((c) => already.add(c.ticker));
  const fillers = STOCKS
    .filter((x) => !already.has(x.ticker))
    .sort((a, b) => b.mktCapBn - a.mktCapBn);
  return [...combined, ...fillers].slice(0, limit);
}

export function topMovers(limit = 5) {
  return [...STOCKS]
    .filter((s) => s.mktCapBn >= 20)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit);
}
