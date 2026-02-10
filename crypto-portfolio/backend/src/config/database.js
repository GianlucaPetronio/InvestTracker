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
  console.log('Connecté à PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err);
});

// Helper pour exécuter des requêtes
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
