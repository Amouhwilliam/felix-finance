export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  subIndustry: string;
  price: number;
  changePct: number;
  mktCapBn: number;
}

export interface Holding {
  ticker: string;
  shares: number;
  avgBuy: number;
}

export interface HoldingRow extends Holding {
  name: string;
  price: number;
  changePct: number;
  value: number;
  pl: number;
  plPct: number;
}

export interface SubGroup {
  name: string;
  stocks: Stock[];
  totalWeight: number;
}

export interface SectorGroup {
  sector: string;
  subgroups: SubGroup[];
  totalWeight: number;
}

export interface Dividend {
  period: string;
  value: number;
}

export interface CalendarEvent {
  day: string;
  month: string;
  title: string;
  desc: string;
}

export interface Analysts {
  buy: number;
  hold: number;
  sell: number;
  count: number;
}

export interface StockDetail extends Stock {
  peRatio: string;
  beta52w: string;
  divYield: string;
  open: number;
  close: number;
  bid: number;
  ask: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  analysts: Analysts;
  targetPrice: number;
  dividends: Dividend[];
  events: CalendarEvent[];
  about: string;
}
