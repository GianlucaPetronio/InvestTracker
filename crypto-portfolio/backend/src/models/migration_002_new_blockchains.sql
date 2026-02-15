-- =============================================================================
-- Migration 002 : Ajout de nouvelles blockchains + activation Solana
-- =============================================================================
-- Ajoute le support de : Solana (RPC), Base, Fantom, Cronos, Linea, zkSync Era
-- Met a jour Solana de 'unsupported' a 'solana' (JSON-RPC natif)

-- ---------------------------------------------------------------------------
-- 1. Activer Solana (passage de unsupported -> solana)
-- ---------------------------------------------------------------------------
UPDATE blockchains
SET api_type = 'solana',
    api_url = 'https://api.mainnet-beta.solana.com',
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'SOL' AND api_type = 'unsupported';

-- ---------------------------------------------------------------------------
-- 2. Ajout des nouvelles blockchains EVM (etherscan-like)
-- ---------------------------------------------------------------------------
INSERT INTO blockchains (symbol, name, icon, hash_pattern, address_pattern, needs_recipient_address, asset_symbol, api_type, api_url, api_key_env_var, is_active, is_custom)
VALUES
  ('BASE',  'Base',        E'\u25B3', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan', 'https://api.basescan.org/api',         'BASESCAN_API_KEY',    true, false),

  ('FTM',   'Fantom',      E'\u25C6', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'FTM',  'etherscan', 'https://api.ftmscan.com/api',          'FTMSCAN_API_KEY',     true, false),

  ('CRO',   'Cronos',      E'\u25C8', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'CRO',  'etherscan', 'https://api.cronoscan.com/api',        'CRONOSCAN_API_KEY',   true, false),

  ('LINEA', 'Linea',       E'\u25A0', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan', 'https://api.lineascan.build/api',      'LINEASCAN_API_KEY',   true, false),

  ('ZKSYNC','zkSync Era',  E'\u25CA', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan', 'https://api-era.zksync.network/api',   'ZKSYNC_API_KEY',      true, false)

ON CONFLICT (symbol) DO NOTHING;
