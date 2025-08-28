'use client'; // Necesario para que funcione en App Router

import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store'; // Importa tu store

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
}; 