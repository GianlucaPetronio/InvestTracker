// =============================================================================
// Configuration Axios et endpoints vers le backend
// =============================================================================

import axios from 'axios';

// En développement, le proxy Vite redirige /api vers le backend
// En production, configurer l'URL de base du backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export const getTransactions = (params = {}) =>
  api.get('/transactions', { params });

export const getTransaction = (id) =>
  api.get(`/transactions/${id}`);

export const createTransaction = (data) =>
  api.post('/transactions', data);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`);

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export const getAssets = () =>
  api.get('/assets');

export const getAssetDetail = (symbol) =>
  api.get(`/assets/${symbol}`);

export const getCurrentPrices = () =>
  api.get('/assets/prices/current');

// ---------------------------------------------------------------------------
// Portfolio - Dashboard endpoints
// ---------------------------------------------------------------------------
export const getPortfolioStats = () =>
  api.get('/portfolio/stats');

export const getPortfolioAssets = () =>
  api.get('/portfolio/assets');

export const getPortfolioHistory = (period = 'ALL') =>
  api.get('/portfolio/history', { params: { period } });

export const getPortfolioAllocation = () =>
  api.get('/portfolio/allocation');

export const getRecentTransactions = (limit = 5) =>
  api.get('/portfolio/recent-transactions', { params: { limit } });

export const getAssetsHistory = (period = 'ALL') =>
  api.get('/portfolio/assets-history', { params: { period } });

// ---------------------------------------------------------------------------
// Blockchain
// ---------------------------------------------------------------------------
export const verifyBlockchainTx = (txHash, blockchain) =>
  api.post('/blockchain/verify', { txHash, blockchain });

export default api;
