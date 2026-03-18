// =============================================================================
// Configuration des APIs externes (blockchain explorer, prix)
// =============================================================================

require('dotenv').config();

const API_CONFIG = {
  bitcoin: {
    baseUrl: 'https://blockchain.info',
  },

  // Sources de prix
  binance: {
    baseUrl: 'https://api.binance.com/api/v3',
  },

  cryptocompare: {
    baseUrl: 'https://min-api.cryptocompare.com/data',
    apiKey: process.env.CRYPTOCOMPARE_API_KEY || '',
  },

  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
};

const BINANCE_EUR_SYMBOLS = {
  BTC: 'BTCEUR',
};

const COINGECKO_IDS = {
  BTC: 'bitcoin',
};

module.exports = { API_CONFIG, COINGECKO_IDS, BINANCE_EUR_SYMBOLS };
