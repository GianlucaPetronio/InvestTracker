// =============================================================================
// Fonctions de validation (hash, formats, montants)
// =============================================================================

/**
 * Valide un hash de transaction Bitcoin (64 caractères hexadécimaux)
 */
function isValidBitcoinHash(hash) {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Valide un hash de transaction Ethereum/BSC (0x + 64 caractères hexadécimaux)
 */
function isValidEthereumHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Valide un hash de transaction selon la blockchain spécifiée
 */
function isValidTransactionHash(hash, blockchain) {
  switch (blockchain.toUpperCase()) {
    case 'BTC':
      return isValidBitcoinHash(hash);
    case 'ETH':
    case 'BSC':
      return isValidEthereumHash(hash);
    default:
      return false;
  }
}

/**
 * Valide les blockchains supportées
 */
const SUPPORTED_BLOCKCHAINS = ['BTC', 'ETH', 'BSC'];

function isSupportedBlockchain(blockchain) {
  return SUPPORTED_BLOCKCHAINS.includes(blockchain.toUpperCase());
}

/**
 * Valide les données d'une transaction manuelle
 */
function validateManualTransaction(data) {
  const errors = [];

  if (!data.asset_symbol || data.asset_symbol.trim() === '') {
    errors.push('Le symbole de l\'actif est requis');
  }
  if (!data.asset_type || !['crypto', 'traditional'].includes(data.asset_type)) {
    errors.push('Le type d\'actif doit être "crypto" ou "traditional"');
  }
  if (!data.transaction_date) {
    errors.push('La date de transaction est requise');
  }
  if (!data.price_at_purchase || data.price_at_purchase <= 0) {
    errors.push('Le prix d\'achat doit être positif');
  }
  if (!data.quantity_purchased || data.quantity_purchased <= 0) {
    errors.push('La quantité achetée doit être positive');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  isValidBitcoinHash,
  isValidEthereumHash,
  isValidTransactionHash,
  isSupportedBlockchain,
  validateManualTransaction,
  SUPPORTED_BLOCKCHAINS,
};
