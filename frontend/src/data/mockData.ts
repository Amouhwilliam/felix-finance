import type {
  Stock,
  Holding,
  HoldingRow,
  SubGroup,
  SectorGroup,
  StockDetail,
} from '../types';

// Official BRVM 47 valeurs — prices reflect recent BRVM data.
// mktCapBn is an estimate in milliards de FCFA (billions).
export const STOCKS: Stock[] = [
  // ---- TÉLÉCOMS ----
  { ticker: 'SNTS', name: 'Sonatel', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 31495, changePct: -0.96, mktCapBn: 3149 },
  { ticker: 'ORAC', name: 'Orange Côte d’Ivoire', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 16725, changePct: +2.61, mktCapBn: 2508 },
  { ticker: 'ONTBF', name: 'Onatel Burkina Faso', sector: 'Télécoms', subIndustry: 'Opérateurs mobiles', price: 2800, changePct: +0.90, mktCapBn: 189 },

  // ---- BANQUES ----
  { ticker: 'SGBC', name: 'Société Générale CI', sector: 'Banques', subIndustry: 'Banques universelles', price: 38000, changePct: +0.01, mktCapBn: 1596 },
  { ticker: 'BICC', name: 'BICI Côte d’Ivoire', sector: 'Banques', subIndustry: 'Banques universelles', price: 28305, changePct: +2.91, mktCapBn: 471 },
  { ticker: 'ECOC', name: 'Ecobank Côte d’Ivoire', sector: 'Banques', subIndustry: 'Banques universelles', price: 16245, changePct: +2.17, mktCapBn: 894 },
  { ticker: 'NSBC', name: 'NSIA Banque CI', sector: 'Banques', subIndustry: 'Banques universelles', price: 23400, changePct: +1.74, mktCapBn: 578 },
  { ticker: 'SIBC', name: 'Société Ivoirienne de Banque', sector: 'Banques', subIndustry: 'Banques universelles', price: 8900, changePct: +2.89, mktCapBn: 890 },
  { ticker: 'BICB', name: 'BIIC Bénin', sector: 'Banques', subIndustry: 'Banques universelles', price: 7615, changePct: +7.48, mktCapBn: 438 },

  { ticker: 'BOAC', name: 'Bank of Africa Côte d’Ivoire', sector: 'Banques', subIndustry: 'Réseau BOA', price: 10200, changePct: +2.00, mktCapBn: 408 },
  { ticker: 'BOAB', name: 'Bank of Africa Bénin', sector: 'Banques', subIndustry: 'Réseau BOA', price: 8600, changePct: -1.09, mktCapBn: 348 },
  { ticker: 'BOABF', name: 'Bank of Africa Burkina Faso', sector: 'Banques', subIndustry: 'Réseau BOA', price: 7150, changePct: 0.00, mktCapBn: 315 },
  { ticker: 'BOAM', name: 'Bank of Africa Mali', sector: 'Banques', subIndustry: 'Réseau BOA', price: 5600, changePct: -0.27, mktCapBn: 153 },
  { ticker: 'BOAN', name: 'Bank of Africa Niger', sector: 'Banques', subIndustry: 'Réseau BOA', price: 5300, changePct: -0.84, mktCapBn: 110 },
  { ticker: 'BOAS', name: 'Bank of Africa Sénégal', sector: 'Banques', subIndustry: 'Réseau BOA', price: 7845, changePct: +3.50, mktCapBn: 282 },

  { ticker: 'ETIT', name: 'Ecobank Transnational', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 73, changePct: -2.67, mktCapBn: 1320 },
  { ticker: 'CBIBF', name: 'Coris Bank Burkina Faso', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 27000, changePct: +2.08, mktCapBn: 864 },
  { ticker: 'ORGT', name: 'Oragroup Togo', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 2700, changePct: +0.75, mktCapBn: 187 },
  { ticker: 'SAFC', name: 'Safca', sector: 'Banques', subIndustry: 'Holdings panafricains', price: 4750, changePct: +4.40, mktCapBn: 38 },

  // ---- INDUSTRIE ----
  { ticker: 'NTLC', name: 'Nestlé Côte d’Ivoire', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 16490, changePct: -0.03, mktCapBn: 363 },
  { ticker: 'SLBC', name: 'Solibra', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 39495, changePct: -1.25, mktCapBn: 650 },
  { ticker: 'STBC', name: 'Sitab', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 23190, changePct: -0.92, mktCapBn: 417 },
  { ticker: 'NEIC', name: 'Nei-Ceda', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 2250, changePct: +2.74, mktCapBn: 28 },
  { ticker: 'SICC', name: 'Sicor', sector: 'Industrie', subIndustry: 'Alimentation & Tabac', price: 5300, changePct: 0.00, mktCapBn: 32 },
  { ticker: 'UNLC', name: 'Unilever Côte d’Ivoire', sector: 'Industrie', subIndustry: 'Biens de consommation', price: 52000, changePct: 0.00, mktCapBn: 478 },
  { ticker: 'UNXC', name: 'Uniwax', sector: 'Industrie', subIndustry: 'Biens de consommation', price: 1850, changePct: +1.09, mktCapBn: 38 },
  { ticker: 'CFAC', name: 'CFAO Motors CI', sector: 'Industrie', subIndustry: 'Automobile', price: 1680, changePct: -0.88, mktCapBn: 305 },
  { ticker: 'PRSC', name: 'Tractafric Motors CI', sector: 'Industrie', subIndustry: 'Automobile', price: 4610, changePct: +0.11, mktCapBn: 47 },
  { ticker: 'FTSC', name: 'Filtisac', sector: 'Industrie', subIndustry: 'Matériaux', price: 1985, changePct: +0.76, mktCapBn: 28 },
  { ticker: 'CABC', name: 'Sicable', sector: 'Industrie', subIndustry: 'Matériaux', price: 3795, changePct: -3.68, mktCapBn: 22 },
  { ticker: 'SEMC', name: 'Eviosys Packaging', sector: 'Industrie', subIndustry: 'Matériaux', price: 1515, changePct: -0.33, mktCapBn: 37 },
  { ticker: 'SIVC', name: 'Erium', sector: 'Industrie', subIndustry: 'Matériaux', price: 2250, changePct: 0.00, mktCapBn: 19 },
  { ticker: 'SMBC', name: 'SMB', sector: 'Industrie', subIndustry: 'Matériaux', price: 16000, changePct: 0.00, mktCapBn: 124 },

  // ---- AGRICULTURE ----
  { ticker: 'PALC', name: 'Palmci', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 8700, changePct: -1.69, mktCapBn: 134 },
  { ticker: 'SPHC', name: 'SAPH', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 7600, changePct: +1.60, mktCapBn: 194 },
  { ticker: 'SOGC', name: 'SOGB', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 8220, changePct: -0.96, mktCapBn: 178 },
  { ticker: 'SCRC', name: 'Sucrivoire', sector: 'Agriculture', subIndustry: 'Cultures & Agro', price: 3495, changePct: -0.14, mktCapBn: 68 },

  // ---- DISTRIBUTION ----
  { ticker: 'TTLC', name: 'TotalEnergies CI', sector: 'Distribution', subIndustry: 'Carburants', price: 2995, changePct: -0.17, mktCapBn: 188 },
  { ticker: 'TTLS', name: 'TotalEnergies Sénégal', sector: 'Distribution', subIndustry: 'Carburants', price: 3750, changePct: -1.32, mktCapBn: 122 },
  { ticker: 'SHEC', name: 'Vivo Energy CI', sector: 'Distribution', subIndustry: 'Carburants', price: 2195, changePct: -0.68, mktCapBn: 137 },
  { ticker: 'BNBC', name: 'Bernabé', sector: 'Distribution', subIndustry: 'Distribution générale', price: 1985, changePct: -0.25, mktCapBn: 13 },

  // ---- SERVICES PUBLICS ----
  { ticker: 'CIEC', name: 'CIE', sector: 'Services Publics', subIndustry: 'Électricité', price: 5300, changePct: -1.67, mktCapBn: 296 },
  { ticker: 'SDCC', name: 'Sodeci', sector: 'Services Publics', subIndustry: 'Eau', price: 11825, changePct: -0.63, mktCapBn: 106 },
  { ticker: 'LNBB', name: 'Loterie Nationale du Bénin', sector: 'Services Publics', subIndustry: 'Jeux & Loteries', price: 4305, changePct: -0.35, mktCapBn: 172 },

  // ---- TRANSPORT ----
  { ticker: 'SDSC', name: 'Africa Global Logistics CI', sector: 'Transport', subIndustry: 'Logistique', price: 2760, changePct: -0.36, mktCapBn: 150 },
  { ticker: 'STAC', name: 'SETAO', sector: 'Transport', subIndustry: 'Logistique', price: 2905, changePct: -3.17, mktCapBn: 38 },
  { ticker: 'ABJC', name: 'Servair Abidjan', sector: 'Transport', subIndustry: 'Aviation & Services', price: 3145, changePct: -1.10, mktCapBn: 34 },
];

export const SECTOR_ORDER: string[] = [
  'Télécoms',
  'Banques',
  'Industrie',
  'Agriculture',
  'Distribution',
  'Services Publics',
  'Transport',
];

export function groupBySector(): SectorGroup[] {
  const out: SectorGroup[] = [];
  for (const sector of SECTOR_ORDER) {
    const inSector = STOCKS.filter((s) => s.sector === sector);
    if (inSector.length === 0) continue;
    const subMap = new Map<string, Stock[]>();
    for (const s of inSector) {
      if (!subMap.has(s.subIndustry)) subMap.set(s.subIndustry, []);
      subMap.get(s.subIndustry)!.push(s);
    }
    const subgroups: SubGroup[] = Array.from(subMap.entries())
      .map(([name, stocks]) => {
        const sorted = [...stocks].sort((a, b) => b.mktCapBn - a.mktCapBn);
        return {
          name,
          stocks: sorted,
          totalWeight: sorted.reduce((s, x) => s + x.mktCapBn, 0),
        };
      })
      .sort((a, b) => b.totalWeight - a.totalWeight);
    out.push({
      sector,
      subgroups,
      totalWeight: subgroups.reduce((s, g) => s + g.totalWeight, 0),
    });
  }
  return out;
}

export function getStockByTicker(ticker: string): Stock | undefined {
  return STOCKS.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
}

export function logoUrl(ticker: string): string {
  return `/logos/${ticker}.png`;
}

// Kept for helper compatibility, even though visitors don't have a portfolio.
export const HOLDINGS: Holding[] = [
  { ticker: 'SNTS', shares: 12, avgBuy: 31200 },
  { ticker: 'SGBC', shares: 4, avgBuy: 36500 },
  { ticker: 'ORAC', shares: 20, avgBuy: 15980 },
  { ticker: 'PALC', shares: 40, avgBuy: 8100 },
  { ticker: 'ETIT', shares: 5000, avgBuy: 72 },
  { ticker: 'SDCC', shares: 6, avgBuy: 10900 },
];

export function computeHoldingRows(): HoldingRow[] {
  return HOLDINGS.map((h) => {
    const s = getStockByTicker(h.ticker)!;
    const value = h.shares * s.price;
    const cost = h.shares * h.avgBuy;
    const pl = value - cost;
    const plPct = cost === 0 ? 0 : (pl / cost) * 100;
    return { ...h, name: s.name, price: s.price, changePct: s.changePct, value, pl, plPct };
  });
}

function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rng(seedInt: number): () => number {
  let x = seedInt || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return ((x >>> 0) % 100000) / 100000;
  };
}

export function getStockDetail(ticker: string): StockDetail | null {
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

export function relatedStocks(ticker: string, limit = 4): Stock[] {
  const s = getStockByTicker(ticker);
  if (!s) return [];
  const sameSub = STOCKS.filter(
    (x) => x.subIndustry === s.subIndustry && x.ticker !== s.ticker
  ).sort((a, b) => b.mktCapBn - a.mktCapBn);
  if (sameSub.length >= limit) return sameSub.slice(0, limit);

  const already = new Set([s.ticker, ...sameSub.map((x) => x.ticker)]);
  const sameSector = STOCKS.filter(
    (x) => x.sector === s.sector && !already.has(x.ticker)
  ).sort((a, b) => b.mktCapBn - a.mktCapBn);
  const combined = [...sameSub, ...sameSector];
  if (combined.length >= limit) return combined.slice(0, limit);

  combined.forEach((c) => already.add(c.ticker));
  const fillers = STOCKS.filter((x) => !already.has(x.ticker)).sort(
    (a, b) => b.mktCapBn - a.mktCapBn
  );
  return [...combined, ...fillers].slice(0, limit);
}

export function topMovers(limit = 5): Stock[] {
  return [...STOCKS]
    .filter((s) => s.mktCapBn >= 20)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit);
}

export function marketStats() {
  const total = STOCKS.length;
  const up = STOCKS.filter((s) => s.changePct > 0).length;
  const down = STOCKS.filter((s) => s.changePct < 0).length;
  const flat = total - up - down;
  const mktCapBn = STOCKS.reduce((s, x) => s + x.mktCapBn, 0);
  return {
    total,
    up,
    down,
    flat,
    mktCapBn,
    dailyVolume: 2_214_573_355,
  };
}
