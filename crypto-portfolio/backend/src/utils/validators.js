// =============================================================================
// Fonctions de validation (hash, formats, montants)
// =============================================================================

const blockchainManager = require('../services/blockchainManager');

// ---------------------------------------------------------------------------
// Fonctions utilitaires sync (legacy, pour validation rapide sans DB)
// ---------------------------------------------------------------------------

function isValidBitcoinHash(hash) {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

function isValidEthereumHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// ---------------------------------------------------------------------------
// Fonctions async basees sur la configuration DB
// ---------------------------------------------------------------------------

async function isValidTransactionHash(hash, blockchain) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  if (!config) return false;
  return blockchainManager.validateHash(hash, config);
}

async function isSupportedBlockchain(blockchain) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  return config !== null && config.is_active;
}

// ---------------------------------------------------------------------------
// Validation de transaction manuelle
// ---------------------------------------------------------------------------

function validateManualTransaction(data) {
  const errors = [];

  if (!data.asset_symbol || data.asset_symbol.trim() === '') {
    errors.push('Le symbole de l\'actif est requis');
  }
  if (!data.asset_type || !['crypto', 'traditional'].includes(data.asset_type)) {
    errors.push('Le type d\'actif doit etre "crypto" ou "traditional"');
  }
  if (!data.transaction_date) {
    errors.push('La date de transaction est requise');
  }
  if (!data.price_at_purchase || data.price_at_purchase <= 0) {
    errors.push('Le prix d\'achat doit etre positif');
  }
  if (!data.quantity_purchased || data.quantity_purchased <= 0) {
    errors.push('La quantite achetee doit etre positive');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  isValidBitcoinHash,
  isValidEthereumHash,
  isValidTransactionHash,
  isSupportedBlockchain,
  validateManualTransaction,
};
