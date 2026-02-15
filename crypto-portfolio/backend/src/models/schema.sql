-- =============================================================================
-- Schéma de base de données - Crypto Portfolio Tracker
-- =============================================================================
-- Exécuter avec : psql -U postgres -f src/models/schema.sql

-- Création de la base de données
CREATE DATABASE crypto_portfolio;
\c crypto_portfolio;

-- =============================================================================
-- Table des transactions
-- =============================================================================
-- Stocke toutes les transactions (crypto via blockchain ou saisie manuelle)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    asset_symbol VARCHAR(10) NOT NULL,          -- Ex: BTC, ETH, AAPL
    asset_name VARCHAR(100),                     -- Ex: Bitcoin, Ethereum, Apple
    asset_type VARCHAR(20) NOT NULL,             -- 'crypto' ou 'traditional'

    -- Champs spécifiques aux transactions blockchain
    transaction_hash VARCHAR(100) UNIQUE,        -- Hash de la transaction on-chain
    blockchain VARCHAR(20),                      -- 'BTC', 'ETH', 'BSC', etc.

    -- Données de transaction
    transaction_date TIMESTAMP NOT NULL,
    amount_invested DECIMAL(15, 2),              -- Montant total en EUR
    price_at_purchase DECIMAL(20, 8) NOT NULL,   -- Prix unitaire au moment de l'achat
    quantity_purchased DECIMAL(20, 8) NOT NULL,  -- Quantité achetée
    transaction_fees DECIMAL(20, 8) DEFAULT 0,   -- Frais de transaction

    -- Métadonnées
    source VARCHAR(20) NOT NULL,                 -- 'blockchain' ou 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Table de cache des prix
-- =============================================================================
-- Évite les appels API répétés pour les mêmes données de prix
CREATE TABLE price_cache (
    id SERIAL PRIMARY KEY,
    asset_symbol VARCHAR(10) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(50),                          -- Source de l'API (coingecko, etc.)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_symbol, timestamp)
);

-- =============================================================================
-- Index pour optimiser les requêtes fréquentes
-- =============================================================================
CREATE INDEX idx_transactions_asset ON transactions(asset_symbol);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX idx_price_cache_symbol ON price_cache(asset_symbol);
CREATE INDEX idx_price_cache_timestamp ON price_cache(timestamp);

-- =============================================================================
-- Table des blockchains supportées
-- =============================================================================
-- Permet la gestion dynamique des blockchains supportées par l'application.
-- api_type détermine le handler utilisé :
--   'bitcoin'     -> getBitcoinTxDetails (Blockchain.info API)
--   'etherscan'   -> getEtherscanLikeTxDetails (générique pour toutes les EVM chains)
--   'solana'      -> getSolanaTxDetails (Solana JSON-RPC API)
--   'unsupported' -> pas de récupération automatique (erreur explicite)

CREATE TABLE blockchains (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL DEFAULT '●',
    hash_pattern VARCHAR(200) NOT NULL,
    address_pattern VARCHAR(200),
    needs_recipient_address BOOLEAN DEFAULT false,
    asset_symbol VARCHAR(10) NOT NULL,
    api_type VARCHAR(30) NOT NULL,
    api_url VARCHAR(500),
    api_key_env_var VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchains_symbol ON blockchains(symbol);
CREATE INDEX idx_blockchains_active ON blockchains(is_active);

-- Blockchains par défaut
INSERT INTO blockchains (symbol, name, icon, hash_pattern, address_pattern, needs_recipient_address, asset_symbol, api_type, api_url, api_key_env_var, is_active, is_custom)
VALUES
  ('BTC',   'Bitcoin',          '₿', '^[a-fA-F0-9]{64}$',
    '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$',
    true,  'BTC',  'bitcoin',     'https://blockchain.info',                      NULL,                  true, false),
  ('ETH',   'Ethereum',         '⟠', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.etherscan.io/api',                 'ETHERSCAN_API_KEY',   true, false),
  ('BSC',   'BNB Smart Chain',  '◇', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'BNB',  'etherscan',   'https://api.bscscan.com/api',                  'BSCSCAN_API_KEY',     true, false),
  ('MATIC', 'Polygon',          '⬡', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'MATIC','etherscan',   'https://api.polygonscan.com/api',               'POLYGONSCAN_API_KEY', true, false),
  ('SOL',   'Solana',           '◎', '^[1-9A-HJ-NP-Za-km-z]{87,88}$',
    '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
    true,  'SOL',  'solana',      'https://api.mainnet-beta.solana.com',            NULL,                  true, false),
  ('AVAX',  'Avalanche',        '▲', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'AVAX', 'etherscan',   'https://api.snowtrace.io/api',                 'SNOWTRACE_API_KEY',   true, false),
  ('ARB',   'Arbitrum',         '●', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.arbiscan.io/api',                  'ARBISCAN_API_KEY',    true, false),
  ('OP',    'Optimism',         '○', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api-optimistic.etherscan.io/api',      'OPTIMISM_API_KEY',    true, false),
  ('BASE',  'Base',             '△', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.basescan.org/api',                  'BASESCAN_API_KEY',    true, false),
  ('FTM',   'Fantom',           '◆', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'FTM',  'etherscan',   'https://api.ftmscan.com/api',                   'FTMSCAN_API_KEY',     true, false),
  ('CRO',   'Cronos',           '◈', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'CRO',  'etherscan',   'https://api.cronoscan.com/api',                 'CRONOSCAN_API_KEY',   true, false),
  ('LINEA', 'Linea',            '■', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api.lineascan.build/api',               'LINEASCAN_API_KEY',   true, false),
  ('ZKSYNC','zkSync Era',       '◊', '^0x[a-fA-F0-9]{64}$',
    '^0x[a-fA-F0-9]{40}$',
    false, 'ETH',  'etherscan',   'https://api-era.zksync.network/api',            'ZKSYNC_API_KEY',      true, false)
ON CONFLICT (symbol) DO NOTHING;

-- =============================================================================
-- Table des clés API (override runtime, prioritaire sur les variables d'env)
-- =============================================================================
CREATE TABLE blockchain_api_keys (
    id SERIAL PRIMARY KEY,
    blockchain_symbol VARCHAR(10) NOT NULL REFERENCES blockchains(symbol) ON DELETE CASCADE,
    api_key VARCHAR(500) NOT NULL,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blockchain_symbol)
);

CREATE INDEX idx_blockchain_api_keys_symbol ON blockchain_api_keys(blockchain_symbol);
