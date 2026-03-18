// =============================================================================
// Service de gestion des blockchains - BTC uniquement (config hardcodee)
// =============================================================================

const BTC_CONFIG = {
  symbol: 'BTC',
  name: 'Bitcoin',
  icon: '\u20bf',
  hash_pattern: '^[a-fA-F0-9]{64}$',
  address_pattern: '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$',
  needs_recipient_address: true,
  asset_symbol: 'BTC',
  api_type: 'bitcoin',
  api_url: 'https://blockchain.info',
  api_key_env_var: null,
  is_active: true,
  is_custom: false,
};

function getAllBlockchains() {
  return [BTC_CONFIG];
}

function getBlockchainBySymbol(symbol) {
  return symbol.toUpperCase() === 'BTC' ? BTC_CONFIG : null;
}

function validateHash(hash, blockchainConfig) {
  try {
    return new RegExp(blockchainConfig.hash_pattern).test(hash);
  } catch {
    return false;
  }
}

function validateAddress(address, blockchainConfig) {
  if (!blockchainConfig.address_pattern) return true;
  try {
    return new RegExp(blockchainConfig.address_pattern).test(address);
  } catch {
    return false;
  }
}

module.exports = {
  getAllBlockchains,
  getBlockchainBySymbol,
  validateHash,
  validateAddress,
};
