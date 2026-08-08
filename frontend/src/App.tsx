import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import TopNav from './components/TopNav';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <ScrollToTop />
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
