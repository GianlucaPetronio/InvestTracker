// =============================================================================
// Service de gestion des blockchains - CRUD + cache + cles API
// =============================================================================
// Fournit un acces aux configurations de blockchains stockees en base de donnees.
// Utilise un cache memoire pour eviter les round-trips DB a chaque validation.
// Fallback sur une config hardcodee si la table n'existe pas encore.

const { query } = require('../config/database');

// ---------------------------------------------------------------------------
// Config hardcodee de secours (utilisee si la table blockchains n'existe pas)
// ---------------------------------------------------------------------------
const FALLBACK_BLOCKCHAINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '\u20bf', hash_pattern: '^[a-fA-F0-9]{64}$',
    address_pattern: '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$',
    needs_recipient_address: true, asset_symbol: 'BTC', api_type: 'bitcoin',
    api_url: 'https://blockchain.info', api_key_env_var: null, is_active: true, is_custom: false },
  { symbol: 'ETH', name: 'Ethereum', icon: '\u27e0', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api.etherscan.io/api', api_key_env_var: 'ETHERSCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'BSC', name: 'BNB Smart Chain', icon: '\u25c7', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'BNB', api_type: 'etherscan',
    api_url: 'https://api.bscscan.com/api', api_key_env_var: 'BSCSCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'MATIC', name: 'Polygon', icon: '\u2b21', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'MATIC', api_type: 'etherscan',
    api_url: 'https://api.polygonscan.com/api', api_key_env_var: 'POLYGONSCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'SOL', name: 'Solana', icon: '\u25ce', hash_pattern: '^[1-9A-HJ-NP-Za-km-z]{87,88}$',
    address_pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
    needs_recipient_address: true, asset_symbol: 'SOL', api_type: 'solana',
    api_url: 'https://api.mainnet-beta.solana.com', api_key_env_var: null, is_active: true, is_custom: false },
  { symbol: 'AVAX', name: 'Avalanche', icon: '\u25b2', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'AVAX', api_type: 'etherscan',
    api_url: 'https://api.snowtrace.io/api', api_key_env_var: 'SNOWTRACE_API_KEY', is_active: true, is_custom: false },
  { symbol: 'ARB', name: 'Arbitrum', icon: '\u25cf', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api.arbiscan.io/api', api_key_env_var: 'ARBISCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'OP', name: 'Optimism', icon: '\u25cb', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api-optimistic.etherscan.io/api', api_key_env_var: 'OPTIMISM_API_KEY', is_active: true, is_custom: false },
  { symbol: 'BASE', name: 'Base', icon: '\u25b3', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api.basescan.org/api', api_key_env_var: 'BASESCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'FTM', name: 'Fantom', icon: '\u25c6', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'FTM', api_type: 'etherscan',
    api_url: 'https://api.ftmscan.com/api', api_key_env_var: 'FTMSCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'CRO', name: 'Cronos', icon: '\u25c8', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'CRO', api_type: 'etherscan',
    api_url: 'https://api.cronoscan.com/api', api_key_env_var: 'CRONOSCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'LINEA', name: 'Linea', icon: '\u25a0', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api.lineascan.build/api', api_key_env_var: 'LINEASCAN_API_KEY', is_active: true, is_custom: false },
  { symbol: 'ZKSYNC', name: 'zkSync Era', icon: '\u25ca', hash_pattern: '^0x[a-fA-F0-9]{64}$',
    address_pattern: '^0x[a-fA-F0-9]{40}$',
    needs_recipient_address: false, asset_symbol: 'ETH', api_type: 'etherscan',
    api_url: 'https://api-era.zksync.network/api', api_key_env_var: 'ZKSYNC_API_KEY', is_active: true, is_custom: false },
];

// Indique si la table DB est disponible (null = pas encore teste)
let dbAvailable = null;

// ---------------------------------------------------------------------------
// Cache memoire simple (TTL 60s, invalide sur ecriture)
// ---------------------------------------------------------------------------
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, ts: Date.now() });
}

function cacheClear() {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

async function getAllBlockchains(includeInactive = false) {
  const cacheKey = `all_${includeInactive}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const sql = includeInactive
      ? 'SELECT * FROM blockchains ORDER BY is_custom ASC, symbol ASC'
      : 'SELECT * FROM blockchains WHERE is_active = true ORDER BY is_custom ASC, symbol ASC';

    const result = await query(sql);
    dbAvailable = true;
    cacheSet(cacheKey, result.rows);
    return result.rows;
  } catch (error) {
    // Table n'existe pas encore -> fallback hardcode
    if (dbAvailable === null) {
      console.warn('Table blockchains non disponible, utilisation du fallback hardcode');
      dbAvailable = false;
    }
    const rows = includeInactive
      ? FALLBACK_BLOCKCHAINS
      : FALLBACK_BLOCKCHAINS.filter(b => b.is_active);
    cacheSet(cacheKey, rows);
    return rows;
  }
}

async function getBlockchainBySymbol(symbol) {
  const key = `sym_${symbol.toUpperCase()}`;
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  try {
    const result = await query(
      'SELECT * FROM blockchains WHERE symbol = $1',
      [symbol.toUpperCase()]
    );
    dbAvailable = true;
    const row = result.rows[0] || null;
    cacheSet(key, row);
    return row;
  } catch (error) {
    // Table n'existe pas encore -> fallback hardcode
    if (dbAvailable === null) {
      console.warn('Table blockchains non disponible, utilisation du fallback hardcode');
      dbAvailable = false;
    }
    const row = FALLBACK_BLOCKCHAINS.find(b => b.symbol === symbol.toUpperCase()) || null;
    cacheSet(key, row);
    return row;
  }
}

// ---------------------------------------------------------------------------
// Ecriture
// ---------------------------------------------------------------------------

async function createBlockchain(data) {
  const {
    symbol, name, icon, hash_pattern, address_pattern,
    needs_recipient_address, asset_symbol, api_type,
    api_url, api_key_env_var,
  } = data;

  const result = await query(
    `INSERT INTO blockchains
       (symbol, name, icon, hash_pattern, address_pattern,
        needs_recipient_address, asset_symbol, api_type,
        api_url, api_key_env_var, is_custom)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
     RETURNING *`,
    [
      symbol.toUpperCase(), name, icon || '\u25CF',
      hash_pattern, address_pattern || null,
      needs_recipient_address || false,
      asset_symbol || symbol.toUpperCase(),
      api_type || 'unsupported',
      api_url || null, api_key_env_var || null,
    ]
  );
  cacheClear();
  return result.rows[0];
}

async function updateBlockchain(symbol, data) {
  const result = await query(
    `UPDATE blockchains SET
       name = COALESCE($1, name),
       icon = COALESCE($2, icon),
       hash_pattern = COALESCE($3, hash_pattern),
       address_pattern = COALESCE($4, address_pattern),
       needs_recipient_address = COALESCE($5, needs_recipient_address),
       asset_symbol = COALESCE($6, asset_symbol),
       api_type = COALESCE($7, api_type),
       api_url = COALESCE($8, api_url),
       api_key_env_var = COALESCE($9, api_key_env_var),
       is_active = COALESCE($10, is_active),
       updated_at = CURRENT_TIMESTAMP
     WHERE symbol = $11
     RETURNING *`,
    [
      data.name ?? null, data.icon ?? null,
      data.hash_pattern ?? null, data.address_pattern ?? null,
      data.needs_recipient_address ?? null,
      data.asset_symbol ?? null, data.api_type ?? null,
      data.api_url ?? null, data.api_key_env_var ?? null,
      data.is_active ?? null,
      symbol.toUpperCase(),
    ]
  );
  cacheClear();
  return result.rows[0] || null;
}

async function deleteBlockchain(symbol) {
  const result = await query(
    'DELETE FROM blockchains WHERE symbol = $1 AND is_custom = true RETURNING *',
    [symbol.toUpperCase()]
  );
  if (result.rows.length === 0) {
    throw new Error('Impossible de supprimer une blockchain native. Vous pouvez la desactiver.');
  }
  cacheClear();
  return result.rows[0];
}

async function toggleBlockchain(symbol) {
  const result = await query(
    `UPDATE blockchains
     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
     WHERE symbol = $1
     RETURNING *`,
    [symbol.toUpperCase()]
  );
  cacheClear();
  return result.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Gestion des cles API
// ---------------------------------------------------------------------------
// Priorite : blockchain_api_keys (DB) > process.env[api_key_env_var]

async function getApiKey(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // 1. Chercher dans la table blockchain_api_keys (si DB disponible)
  try {
    const dbResult = await query(
      'SELECT api_key FROM blockchain_api_keys WHERE blockchain_symbol = $1 AND is_active = true LIMIT 1',
      [upperSymbol]
    );
    if (dbResult.rows.length > 0) {
      return dbResult.rows[0].api_key;
    }
  } catch {
    // Table pas encore creee, on continue avec le fallback
  }

  // 2. Fallback sur la variable d'environnement
  const bc = await getBlockchainBySymbol(upperSymbol);
  if (bc && bc.api_key_env_var) {
    return process.env[bc.api_key_env_var] || '';
  }
  return '';
}

async function setApiKey(symbol, apiKey, label = null) {
  const result = await query(
    `INSERT INTO blockchain_api_keys (blockchain_symbol, api_key, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (blockchain_symbol)
     DO UPDATE SET api_key = $2, label = $3, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [symbol.toUpperCase(), apiKey, label]
  );
  return result.rows[0];
}

async function removeApiKey(symbol) {
  await query(
    'DELETE FROM blockchain_api_keys WHERE blockchain_symbol = $1',
    [symbol.toUpperCase()]
  );
}

async function hasApiKey(symbol) {
  const key = await getApiKey(symbol);
  return key !== '';
}

// ---------------------------------------------------------------------------
// Utilitaires de validation
// ---------------------------------------------------------------------------

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
  createBlockchain,
  updateBlockchain,
  deleteBlockchain,
  toggleBlockchain,
  getApiKey,
  setApiKey,
  removeApiKey,
  hasApiKey,
  validateHash,
  validateAddress,
};
