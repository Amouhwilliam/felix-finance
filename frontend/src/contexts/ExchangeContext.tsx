import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface ExchangeState {
  currency: string;
  exchangeName: string;
}

const ExchangeContext = createContext<ExchangeState>({ currency: 'XOF', exchangeName: 'BRVM' });

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExchangeState>({ currency: 'XOF', exchangeName: 'BRVM' });

  useEffect(() => {
    api.marketStats('BRVM')
      .then((s) => {
        if (s.currency) setState((prev) => ({ ...prev, currency: s.currency }));
      })
      .catch(() => {/* keep defaults */});
  }, []);

  return <ExchangeContext.Provider value={state}>{children}</ExchangeContext.Provider>;
}

export function useExchange(): ExchangeState {
  return useContext(ExchangeContext);
}
