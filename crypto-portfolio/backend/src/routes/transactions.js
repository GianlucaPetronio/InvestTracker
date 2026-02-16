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
// POST /api/transactions/bulk - Créer plusieurs transactions (atomique)
// ---------------------------------------------------------------------------
router.post('/bulk', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Un tableau de transactions est requis' });
    }
    if (transactions.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 transactions par requête' });
    }

    // Valider chaque transaction
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t.asset_symbol || !t.transaction_date || !t.price_at_purchase || !t.quantity_purchased) {
        return res.status(400).json({
          error: `Transaction #${i + 1} : champs requis manquants (asset_symbol, transaction_date, price_at_purchase, quantity_purchased)`,
        });
      }
      if (t.source === 'manual') {
        const validation = validateManualTransaction(t);
        if (!validation.valid) {
          return res.status(400).json({ error: `Transaction #${i + 1} : ${validation.errors.join(', ')}` });
        }
      }
    }

    // Vérifier les doublons de hash
    const hashes = transactions.filter(t => t.transaction_hash).map(t => t.transaction_hash);
    if (hashes.length > 0) {
      const placeholders = hashes.map((_, i) => `$${i + 2}`).join(', ');
      const existing = await query(
        `SELECT transaction_hash FROM transactions WHERE user_id = $1 AND transaction_hash IN (${placeholders})`,
        [req.user.id, ...hashes]
      );
      if (existing.rows.length > 0) {
        const dupes = existing.rows.map(r => r.transaction_hash).join(', ');
        return res.status(409).json({ error: `Hash déjà existant(s) : ${dupes}` });
      }
    }

    // Insertion atomique
    const insertedRows = [];
    await query('BEGIN');
    try {
      for (const t of transactions) {
        const result = await query(
          `INSERT INTO transactions
            (asset_symbol, asset_name, asset_type, transaction_hash, blockchain,
             transaction_date, amount_invested, price_at_purchase, quantity_purchased,
             transaction_fees, source, transaction_type, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            t.asset_symbol.toUpperCase(),
            t.asset_name || t.asset_symbol.toUpperCase(),
            t.asset_type || 'crypto',
            t.transaction_hash || null,
            t.blockchain || null,
            t.transaction_date,
            t.amount_invested || (t.price_at_purchase * t.quantity_purchased),
            t.price_at_purchase,
            t.quantity_purchased,
            t.transaction_fees || 0,
            t.source || 'manual',
            t.transaction_type || 'buy',
            req.user.id,
          ]
        );
        insertedRows.push(result.rows[0]);
      }
      await query('COMMIT');
    } catch (insertError) {
      await query('ROLLBACK');
      throw insertError;
    }

    res.status(201).json({
      success: true,
      count: insertedRows.length,
      transactions: insertedRows,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Une transaction blockchain en doublon a été détectée' });
    }
    res.status(500).json({ error: error.message || 'Erreur lors de la création des transactions' });
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
      quantity_purchased, transaction_fees, source, transaction_type,
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
         transaction_fees, source, transaction_type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        asset_symbol.toUpperCase(), asset_name || asset_symbol.toUpperCase(), asset_type || 'crypto',
        transaction_hash || null, blockchain || null,
        transaction_date, amount_invested || (price_at_purchase * quantity_purchased),
        price_at_purchase, quantity_purchased, transaction_fees || 0, source || 'manual',
        transaction_type || 'buy',
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
      quantity_purchased, transaction_fees, transaction_type,
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
        transaction_type = COALESCE($9, transaction_type),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        asset_symbol, asset_name, asset_type,
        transaction_date, amount_invested, price_at_purchase,
        quantity_purchased, transaction_fees, transaction_type,
        req.params.id, req.user.id,
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
