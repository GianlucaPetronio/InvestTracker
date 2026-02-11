-- =============================================================================
-- Migration 001 : Tables de configuration des blockchains
-- =============================================================================
-- Permet la gestion dynamique des blockchains supportees par l'application.
-- Remplace les constantes hardcodees dans blockchainService.js et validators.js.

-- ---------------------------------------------------------------------------
-- Table principale : configuration de chaque blockchain
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blockchains (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,          -- BTC, ETH, BSC, etc.
    name VARCHAR(100) NOT NULL,                  -- Bitcoin, Ethereum, etc.
    icon VARCHAR(10) NOT NULL DEFAULT E'\u25CF',  -- Caractere Unicode pour l'affichage
    hash_pattern VARCHAR(200) NOT NULL,          -- Regex de validation du hash de transaction
    address_pattern VARCHAR(200),                -- Regex de validation d'adresse (NULL si non applicable)
    needs_recipient_address BOOLEAN DEFAULT false,-- Necessite adresse pour multi-outputs (BTC)
    asset_symbol VARCHAR(10) NOT NULL,           -- Symbole de l'actif natif (BSC -> BNB, ARB -> ETH)
    api_type VARCHAR(30) NOT NULL,               -- 'bitcoin', 'etherscan', 'unsupported'
    api_url VARCHAR(500),                        -- URL de base de l'API explorer
    api_key_env_var VARCHAR(100),                -- Nom de la variable d'env pour la cle API
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,             -- true = ajoutee par l'utilisateur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blockchains_symbol ON blockchains(symbol);
CREATE INDEX IF NOT EXISTS idx_blockchains_active ON blockchains(is_active);

-- ---------------------------------------------------------------------------
-- Table des cles API (override runtime, prioritaire sur les variables d'env)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blockchain_api_keys (
    id SERIAL PRIMARY KEY,
    blockchain_symbol VARCHAR(10) NOT NULL REFERENCES blockchains(symbol) ON DELETE CASCADE,
    api_key VARCHAR(500) NOT NULL,
    label VARCHAR(100),                          -- Description optionnelle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_symbol)
);

CREATE INDEX IF NOT EXISTS idx_blockchain_api_keys_symbol ON blockchain_api_keys(blockchain_symbol);

-- ---------------------------------------------------------------------------
-- Seed : blockchains par defaut
-- ---------------------------------------------------------------------------
-- api_type determine le handler utilise :
--   'bitcoin'     -> getBitcoinTxDetails (Blockchain.info API)
--   'etherscan'   -> getEtherscanLikeTxDetails (generique pour toutes les EVM chains)
--   'unsupported' -> pas de recuperation automatique (erreur explicite)

INSERT INTO blockchains (symbol, name, icon, hash_pattern, address_pattern, needs_recipient_address, asset_symbol, api_type, api_url, api_key_env_var, is_active, is_custom)
VALUES
  ('BTC',   'Bitcoin',          E'\u20BF', '^[a-fA-F0-9]{64}$',
    '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$',
    true,  'BTC',  'bitcoin',     'https://blockchain.info',                      NULL,                  true, false),

  ('ETH',   'Ethereum',         E'\u27E0', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.etherscan.io/api',                 'ETHERSCAN_API_KEY',   true, false),

  ('BSC',   'BNB Smart Chain',  E'\u25C7', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'BNB',  'etherscan',   'https://api.bscscan.com/api',                  'BSCSCAN_API_KEY',     true, false),

  ('MATIC', 'Polygon',          E'\u2B21', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'MATIC','etherscan',   'https://api.polygonscan.com/api',               'POLYGONSCAN_API_KEY', true, false),

  ('SOL',   'Solana',           E'\u25CE', '^[1-9A-HJ-NP-Za-km-z]{87,88}$',
    '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
    true,  'SOL',  'unsupported', NULL,                                            NULL,                  true, false),

  ('AVAX',  'Avalanche',        E'\u25B2', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'AVAX', 'etherscan',   'https://api.snowtrace.io/api',                 'SNOWTRACE_API_KEY',   true, false),

  ('ARB',   'Arbitrum',         E'\u25CF', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.arbiscan.io/api',                  'ARBISCAN_API_KEY',    true, false),

  ('OP',    'Optimism',         E'\u25CB', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api-optimistic.etherscan.io/api',      'OPTIMISM_API_KEY',    true, false)

ON CONFLICT (symbol) DO NOTHING;
