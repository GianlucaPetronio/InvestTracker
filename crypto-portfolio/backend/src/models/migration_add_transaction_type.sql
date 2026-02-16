-- Migration: Ajouter le champ transaction_type a la table transactions
-- Permet de distinguer les achats (buy) des ventes (sell)
-- Executer avec : psql -U postgres -d crypto_portfolio -f src/models/migration_add_transaction_type.sql

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(10) DEFAULT 'buy';
