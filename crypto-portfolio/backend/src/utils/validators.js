// =============================================================================
// Fonctions de validation (hash, formats, montants)
// =============================================================================

function isValidBitcoinHash(hash) {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

function isValidTransactionHash(hash) {
  return isValidBitcoinHash(hash);
}

function isSupportedBlockchain(blockchain) {
  return blockchain === 'BTC';
}

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
  isValidTransactionHash,
  isSupportedBlockchain,
  validateManualTransaction,
};
