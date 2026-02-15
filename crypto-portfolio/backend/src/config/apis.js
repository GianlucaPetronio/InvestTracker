// =============================================================================
// Configuration des APIs externes (blockchain explorers, prix)
// =============================================================================

require('dotenv').config();

const API_CONFIG = {
  // Blockchain explorers
  bitcoin: {
    baseUrl: 'https://blockchain.info',
  },

  ethereum: {
    baseUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },

  bsc: {
    baseUrl: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || '',
  },

  // ---------------------------------------------------------------------------
  // Sources de prix (par ordre de precision)
  // ---------------------------------------------------------------------------

  // Binance - bougies 1 minute, le plus precis, pas de cle API requise
  binance: {
    baseUrl: 'https://api.binance.com/api/v3',
  },

  // CryptoCompare - precision horaire, large couverture, EUR direct
  cryptocompare: {
    baseUrl: 'https://min-api.cryptocompare.com/data',
    apiKey: process.env.CRYPTOCOMPARE_API_KEY || '',
  },

  // CoinGecko - fallback, precision horaire/journaliere
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
};

// ---------------------------------------------------------------------------
// Mappings de symboles par API
// ---------------------------------------------------------------------------

// Binance : paires EUR directes (les plus liquides)
const BINANCE_EUR_SYMBOLS = {
  BTC: 'BTCEUR',
  ETH: 'ETHEUR',
  BNB: 'BNBEUR',
  SOL: 'SOLEUR',
  AVAX: 'AVAXEUR',
  ADA: 'ADAEUR',
  DOT: 'DOTEUR',
  MATIC: 'MATICEUR',
  LINK: 'LINKEUR',
  UNI: 'UNIEUR',
  XRP: 'XRPEUR',
  OP: 'OPEUR',
  ARB: 'ARBEUR',
  FTM: 'FTMEUR',
  CRO: 'CROEUR',
  DOGE: 'DOGEEUR',
  LTC: 'LTCEUR',
  NEAR: 'NEAREUR',
  APT: 'APTEUR',
};

// CoinGecko : mapping symbole -> id CoinGecko
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  OP: 'optimism',
  ARB: 'arbitrum',
  XRP: 'ripple',
  FTM: 'fantom',
  CRO: 'crypto-com-chain',
  DOGE: 'dogecoin',
  LTC: 'litecoin',
  NEAR: 'near',
  APT: 'aptos',
};

module.exports = { API_CONFIG, COINGECKO_IDS, BINANCE_EUR_SYMBOLS };
