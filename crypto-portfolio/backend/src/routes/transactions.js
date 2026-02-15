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

    const params = [req.user.id];
    let sql = 'SELECT * FROM transactions WHERE user_id = $1';

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
    const result = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
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

    // Validation des champs requis (toutes sources)
    if (!asset_symbol || !transaction_date || !price_at_purchase || !quantity_purchased) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        missing: {
          asset_symbol: !asset_symbol,
          transaction_date: !transaction_date,
          price_at_purchase: !price_at_purchase,
          quantity_purchased: !quantity_purchased,
        }
      });
    }

    // Validation supplémentaire pour les transactions manuelles
    if (source === 'manual') {
      const validation = validateManualTransaction(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }
    }

    // Vérifier si le hash existe déjà (éviter les doublons par utilisateur)
    if (transaction_hash) {
      const existing = await query(
        'SELECT id FROM transactions WHERE transaction_hash = $1 AND user_id = $2',
        [transaction_hash, req.user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: 'Cette transaction existe déjà dans votre portfolio'
        });
      }
    }

    const result = await query(
      `INSERT INTO transactions
        (asset_symbol, asset_name, asset_type, transaction_hash, blockchain,
         transaction_date, amount_invested, price_at_purchase, quantity_purchased,
         transaction_fees, source, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        asset_symbol.toUpperCase(), asset_name || asset_symbol.toUpperCase(), asset_type || 'crypto',
        transaction_hash || null, blockchain || null,
        transaction_date, amount_invested || (price_at_purchase * quantity_purchased),
        price_at_purchase, quantity_purchased, transaction_fees || 0, source || 'manual',
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      transaction: result.rows[0],
      message: 'Transaction créée avec succès'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cette transaction blockchain existe déjà' });
    }
    res.status(500).json({
      error: 'Erreur lors de la création de la transaction'
    });
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
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        asset_symbol, asset_name, asset_type,
        transaction_date, amount_invested, price_at_purchase,
        quantity_purchased, transaction_fees, req.params.id,
        req.user.id,
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
// DELETE /api/transactions/bulk - Supprimer plusieurs transactions
// ---------------------------------------------------------------------------
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Liste d\'ids requise' });
    }

    // Construire les placeholders $2, $3, $4...
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    const result = await query(
      `DELETE FROM transactions WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`,
      [req.user.id, ...ids]
    );

    res.json({
      message: `${result.rows.length} transaction(s) supprimee(s)`,
      deletedIds: result.rows.map(r => r.id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/transactions/:id - Supprimer une transaction
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json({ message: 'Transaction supprimée', transaction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
