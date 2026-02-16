-- =============================================================================
-- Migration 004 : Top 10 blockchains - Nettoyage et ajout XRP, ADA, DOT, TRX
-- =============================================================================

-- 1. Supprimer les blockchains hors top 10
DELETE FROM blockchains WHERE symbol IN ('ARB', 'OP', 'BASE', 'FTM', 'CRO', 'LINEA', 'ZKSYNC');

-- 2. Ajouter les nouvelles blockchains du top 10 (ordre market cap)
INSERT INTO blockchains (symbol, name, icon, hash_pattern, address_pattern, needs_recipient_address, asset_symbol, api_type, api_url, api_key_env_var, is_active, is_custom)
VALUES
  ('XRP', 'XRP Ledger', E'\u2715', '^[A-F0-9]{64}$',
    '^r[1-9A-HJ-NP-Za-km-z]{24,34}$',
    false, 'XRP', 'unsupported', NULL, NULL, true, false),

  ('ADA', 'Cardano', E'\u2641', '^[a-fA-F0-9]{64}$',
    '^addr1[a-z0-9]{50,100}$',
    false, 'ADA', 'unsupported', NULL, NULL, true, false),

  ('TRX', 'Tron', E'\u25C8', '^[a-fA-F0-9]{64}$',
    '^T[a-zA-Z0-9]{33}$',
    false, 'TRX', 'unsupported', NULL, NULL, true, false),

  ('DOT', 'Polkadot', E'\u25CF', '^0x[a-fA-F0-9]{64}$',
    '^1[a-zA-Z0-9]{30,50}$',
    false, 'DOT', 'unsupported', NULL, NULL, true, false)
ON CONFLICT (symbol) DO NOTHING;
