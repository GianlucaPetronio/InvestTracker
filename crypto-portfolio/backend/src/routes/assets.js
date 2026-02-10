// =============================================================================
// Routes Assets - Liste des actifs et prix actuels
// =============================================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { getCurrentPrice, getMultiplePrices } = require('../services/priceService');

// ---------------------------------------------------------------------------
// GET /api/assets - Liste tous les actifs distincts du portfolio
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        asset_symbol,
        asset_name,
        asset_type,
        COUNT(*) as transaction_count,
        SUM(quantity_purchased) as total_quantity,
        SUM(amount_invested) as total_invested,
        MIN(transaction_date) as first_purchase,
        MAX(transaction_date) as last_purchase
      FROM transactions
      GROUP BY asset_symbol, asset_name, asset_type
      ORDER BY asset_symbol
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/assets/:symbol - Détail d'un actif avec prix actuel
// ---------------------------------------------------------------------------
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // Récupérer les transactions de cet actif
    const txResult = await query(
      `SELECT * FROM transactions WHERE asset_symbol = $1 ORDER BY transaction_date DESC`,
      [symbol]
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({ error: `Aucune transaction pour ${symbol}` });
    }

    // Tenter de récupérer le prix actuel (crypto uniquement)
    let currentPrice = null;
    const assetType = txResult.rows[0].asset_type;
    if (assetType === 'crypto') {
      try {
        const priceData = await getCurrentPrice(symbol);
        currentPrice = priceData.price;
      } catch {
        // Le prix peut ne pas être disponible, ce n'est pas bloquant
        currentPrice = null;
      }
    }

    // Calculs agrégés
    const totalQuantity = txResult.rows.reduce((sum, tx) => sum + parseFloat(tx.quantity_purchased), 0);
    const totalInvested = txResult.rows.reduce((sum, tx) => sum + parseFloat(tx.amount_invested || 0), 0);
    const avgPrice = totalInvested / totalQuantity;

    res.json({
      symbol,
      name: txResult.rows[0].asset_name,
      type: assetType,
      totalQuantity,
      totalInvested,
      avgPrice,
      currentPrice,
      currentValue: currentPrice ? totalQuantity * currentPrice : null,
      pnl: currentPrice ? (totalQuantity * currentPrice) - totalInvested : null,
      transactions: txResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/assets/prices/current - Prix actuels de tous les actifs crypto
// ---------------------------------------------------------------------------
router.get('/prices/current', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT asset_symbol FROM transactions WHERE asset_type = 'crypto'`
    );

    const symbols = result.rows.map(r => r.asset_symbol);
    if (symbols.length === 0) {
      return res.json({});
    }

    const prices = await getMultiplePrices(symbols);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
