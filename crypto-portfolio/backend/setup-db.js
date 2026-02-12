const { pool, query } = require('./src/config/database');

async function setupDatabase() {
  try {
    await query(`
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

    await query('CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_symbol)');
    await query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)');

    console.log('Table transactions creee avec succes');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

setupDatabase();
