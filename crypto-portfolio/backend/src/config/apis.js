// =============================================================================
// Configuration des APIs externes (blockchain explorers, prix)
// =============================================================================

require('dotenv').config();

const API_CONFIG = {
  // Blockchain explorers
  bitcoin: {
    baseUrl: 'https://blockchain.info',
    // Pas de clé API requise pour l'API publique Blockchain.com
  },

  ethereum: {
    baseUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },

  bsc: {
    baseUrl: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || '',
  },

  // Prix et données de marché
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
};

// Mapping des symboles vers les IDs CoinGecko
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
};

module.exports = { API_CONFIG, COINGECKO_IDS };
