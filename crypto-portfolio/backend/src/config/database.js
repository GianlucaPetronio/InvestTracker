// =============================================================================
// Configuration de la connexion PostgreSQL
// =============================================================================

const { Pool } = require('pg');
require('dotenv').config();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || 'crypto_portfolio',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: parseInt(process.env.PG_MAX_CONNECTIONS, 10) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(IS_PRODUCTION && process.env.PG_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err.message);
});

// Test de connexion au demarrage
pool.query('SELECT NOW() as now, current_database() as db')
  .then(res => {
    console.log(`[DB] Connexion OK - base: ${res.rows[0].db}`);
  })
  .catch(err => {
    console.error('[DB] ECHEC connexion:', err.message);
  });

// Helper pour executer des requetes
const query = (text, params) => pool.query(text, params);

// Initialisation automatique des tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        asset_symbol VARCHAR(10) NOT NULL,
        asset_name VARCHAR(100),
        asset_type VARCHAR(20) NOT NULL,
        transaction_hash VARCHAR(100) UNIQUE,
        blockchain VARCHAR(20),
        recipient_address VARCHAR(100),
        transaction_date TIMESTAMP NOT NULL,
        amount_invested DECIMAL(15, 2),
        price_at_purchase DECIMAL(20, 8) NOT NULL,
        quantity_purchased DECIMAL(20, 8) NOT NULL,
        transaction_fees DECIMAL(20, 8) DEFAULT 0,
        source VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_symbol)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)');

    // Table utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ajouter colonne user_id aux transactions (idempotent)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'transactions' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);
        END IF;
      END $$
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)');

    console.log('[DB] Tables initialisees');
  } catch (error) {
    console.error('[DB] Erreur initialisation tables:', error.message);
  }
}

module.exports = { pool, query, initDatabase };
