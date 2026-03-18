// =============================================================================
// Configuration Axios et endpoints vers le backend
// =============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : injecter le token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Intercepteur : gerer les 401 (token expire/invalide)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (import.meta.env.DEV) {
      console.error('[API] Error:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerUser = (email, password, name) =>
  api.post('/auth/register', { email, password, name });

export const getCurrentUser = () =>
  api.get('/auth/me');

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

export const exportTransactionsCsv = () =>
  api.get('/transactions/export/csv', { responseType: 'blob' });

export const createTransactionsBulk = (transactions) =>
  api.post('/transactions/bulk', { transactions });

export const deleteTransactionsBulk = (ids) =>
  api.delete('/transactions/bulk', { data: { ids } });

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

export const getCapitalGains = () =>
  api.get('/portfolio/capital-gains');

export const getAssetsHistory = (period = 'ALL') =>
  api.get('/portfolio/assets-history', { params: { period } });

// ---------------------------------------------------------------------------
// Blockchain - Verification de transactions (BTC uniquement)
// ---------------------------------------------------------------------------
export const verifyBlockchainTx = (txHash) =>
  api.post('/blockchain/verify', { txHash });

export const validateBlockchainTx = (txHash, recipientAddress = null) =>
  api.post('/blockchain/validate', { txHash, recipientAddress });

export const getTransactionOutputs = (hash) =>
  api.get(`/blockchain/outputs/BTC/${encodeURIComponent(hash)}`);

export default api;
