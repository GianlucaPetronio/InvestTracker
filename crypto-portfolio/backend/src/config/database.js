// =============================================================================
// Configuration de la connexion PostgreSQL
// =============================================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || 'crypto_portfolio',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
});

// Log de connexion
pool.on('connect', () => {
  console.log('Connecte a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err);
});

// Test de connexion au démarrage
pool.query('SELECT NOW() as now, current_database() as db')
  .then(res => {
    console.log(`[DB] Connexion OK - base: ${res.rows[0].db} - ${res.rows[0].now}`);
  })
  .catch(err => {
    console.error('[DB] ECHEC connexion:', err.message);
  });

// Helper pour exécuter des requêtes
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

    console.log('[DB] Tables initialisees');
  } catch (error) {
    console.error('[DB] Erreur initialisation tables:', error.message);
  }
}

module.exports = { pool, query, initDatabase };
