-- Migration 003 : Table utilisateurs et colonne user_id sur transactions

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter user_id aux transactions (nullable pour migration progressive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
