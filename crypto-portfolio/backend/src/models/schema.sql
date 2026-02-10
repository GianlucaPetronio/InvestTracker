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
