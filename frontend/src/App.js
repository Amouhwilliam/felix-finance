import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Heatmap from './pages/Heatmap';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import BottomTabBar from './components/BottomTabBar';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[520px] min-h-screen relative">
        <Routes>
          <Route path="/" element={<Heatmap />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomTabBar />
      </div>
    </div>
  );
}
