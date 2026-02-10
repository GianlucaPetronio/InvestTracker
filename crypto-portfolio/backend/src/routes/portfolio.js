// =============================================================================
// Routes Portfolio - Endpoints du dashboard
// =============================================================================

const express = require('express');
const router = express.Router();
const {
  calculateGlobalStats,
  calculateAssetBreakdown,
  calculatePortfolioHistory,
  calculateAllocation,
  getRecentTransactions,
  calculateAssetHistory,
} = require('../services/portfolioService');

// ---------------------------------------------------------------------------
// GET /api/portfolio/stats - Statistiques globales (cartes du dashboard)
// ---------------------------------------------------------------------------
router.get('/stats', async (_req, res) => {
  try {
    const stats = await calculateGlobalStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/portfolio/assets - Liste détaillée des actifs avec métriques
// ---------------------------------------------------------------------------
router.get('/assets', async (_req, res) => {
  try {
    const assets = await calculateAssetBreakdown();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/portfolio/history?period=1M - Historique pour le graphique
// Paramètres : period = 1M | 3M | 6M | 1Y | ALL (défaut: ALL)
// ---------------------------------------------------------------------------
router.get('/history', async (req, res) => {
  try {
    const { period = 'ALL' } = req.query;
    const validPeriods = ['1M', '3M', '6M', '1Y', 'ALL'];

    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: `Periode invalide. Valeurs acceptees: ${validPeriods.join(', ')}`,
      });
    }

    const history = await calculatePortfolioHistory(period);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/portfolio/allocation - Répartition pour le pie chart
// ---------------------------------------------------------------------------
router.get('/allocation', async (_req, res) => {
  try {
    const allocation = await calculateAllocation();
    res.json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/portfolio/recent-transactions?limit=5 - Dernières transactions
// ---------------------------------------------------------------------------
router.get('/recent-transactions', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 50);
    const transactions = await getRecentTransactions(limit);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/portfolio/assets-history?period=ALL - Evolution par actif
// ---------------------------------------------------------------------------
router.get('/assets-history', async (req, res) => {
  try {
    const { period = 'ALL' } = req.query;
    const validPeriods = ['1M', '3M', '6M', '1Y', 'ALL'];

    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: `Periode invalide. Valeurs acceptees: ${validPeriods.join(', ')}`,
      });
    }

    const history = await calculateAssetHistory(period);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
