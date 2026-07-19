import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import TopNav from './components/TopNav';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
