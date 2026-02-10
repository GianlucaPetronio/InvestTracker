// =============================================================================
// Routes Transactions - CRUD complet
// =============================================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { validateManualTransaction } = require('../utils/validators');

// ---------------------------------------------------------------------------
// GET /api/transactions - Liste toutes les transactions
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { asset_symbol, asset_type, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (asset_symbol) {
      params.push(asset_symbol.toUpperCase());
      sql += ` AND asset_symbol = $${params.length}`;
    }
    if (asset_type) {
      params.push(asset_type);
      sql += ` AND asset_type = $${params.length}`;
    }

    sql += ' ORDER BY transaction_date DESC';
    params.push(parseInt(limit, 10));
    sql += ` LIMIT $${params.length}`;
    params.push(parseInt(offset, 10));
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/transactions/:id - Détail d'une transaction
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/transactions - Créer une transaction (manuelle ou blockchain)
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      asset_symbol, asset_name, asset_type,
      transaction_hash, blockchain,
      transaction_date, amount_invested, price_at_purchase,
      quantity_purchased, transaction_fees, source,
    } = req.body;

    // Validation pour les transactions manuelles
    if (source === 'manual') {
      const validation = validateManualTransaction(req.body);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }
    }

    const result = await query(
      `INSERT INTO transactions
        (asset_symbol, asset_name, asset_type, transaction_hash, blockchain,
         transaction_date, amount_invested, price_at_purchase, quantity_purchased,
         transaction_fees, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        asset_symbol.toUpperCase(), asset_name, asset_type,
        transaction_hash || null, blockchain || null,
        transaction_date, amount_invested, price_at_purchase,
        quantity_purchased, transaction_fees || 0, source,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cette transaction blockchain existe déjà' });
    }
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/transactions/:id - Modifier une transaction
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const {
      asset_symbol, asset_name, asset_type,
      transaction_date, amount_invested, price_at_purchase,
      quantity_purchased, transaction_fees,
    } = req.body;

    const result = await query(
      `UPDATE transactions SET
        asset_symbol = COALESCE($1, asset_symbol),
        asset_name = COALESCE($2, asset_name),
        asset_type = COALESCE($3, asset_type),
        transaction_date = COALESCE($4, transaction_date),
        amount_invested = COALESCE($5, amount_invested),
        price_at_purchase = COALESCE($6, price_at_purchase),
        quantity_purchased = COALESCE($7, quantity_purchased),
        transaction_fees = COALESCE($8, transaction_fees),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        asset_symbol, asset_name, asset_type,
        transaction_date, amount_invested, price_at_purchase,
        quantity_purchased, transaction_fees, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/transactions/:id - Supprimer une transaction
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM transactions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json({ message: 'Transaction supprimée', transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
