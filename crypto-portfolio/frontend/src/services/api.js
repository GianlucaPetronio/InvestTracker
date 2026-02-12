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

// Intercepteurs de debug (requetes et reponses)
api.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log(`[API] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    console.error('[API] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

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
// Blockchain - Vérification de transactions
// ---------------------------------------------------------------------------
export const verifyBlockchainTx = (txHash, blockchain) =>
  api.post('/blockchain/verify', { txHash, blockchain });

export const validateBlockchainTx = (txHash, blockchain, recipientAddress = null) =>
  api.post('/blockchain/validate', { txHash, blockchain, recipientAddress });

export const detectBlockchain = (hash) =>
  api.get(`/blockchain/detect/${encodeURIComponent(hash)}`);

export const getTransactionOutputs = (blockchain, hash) =>
  api.get(`/blockchain/outputs/${blockchain}/${encodeURIComponent(hash)}`);

// ---------------------------------------------------------------------------
// Blockchains - Gestion des blockchains supportées
// ---------------------------------------------------------------------------
export const getBlockchains = (includeInactive = false) =>
  api.get('/blockchains', { params: { includeInactive } });

export const getBlockchain = (symbol) =>
  api.get(`/blockchains/${symbol}`);

export const createBlockchain = (data) =>
  api.post('/blockchains', data);

export const updateBlockchain = (symbol, data) =>
  api.put(`/blockchains/${symbol}`, data);

export const deleteBlockchain = (symbol) =>
  api.delete(`/blockchains/${symbol}`);

export const toggleBlockchain = (symbol) =>
  api.post(`/blockchains/${symbol}/toggle`);

export const saveBlockchainApiKey = (symbol, apiKey, label = null) =>
  api.post(`/blockchains/${symbol}/api-key`, { api_key: apiKey, label });

export const removeBlockchainApiKey = (symbol) =>
  api.delete(`/blockchains/${symbol}/api-key`);

export default api;
