// =============================================================================
// Service Portfolio - Logique métier pour les calculs du dashboard
// =============================================================================

const { query } = require('../config/database');
const { getMultiplePrices } = require('./priceService');

// ---------------------------------------------------------------------------
// Données de démonstration (utilisées quand PostgreSQL est indisponible)
// ---------------------------------------------------------------------------
const USE_DEMO = process.env.NODE_ENV !== 'production';

const DEMO_TRANSACTIONS = [
  { id: 1, asset_symbol: 'BTC', asset_name: 'Bitcoin', asset_type: 'crypto', transaction_date: '2025-06-15T10:00:00Z', amount_invested: 5000, price_at_purchase: 62500, quantity_purchased: 0.08, transaction_fees: 2.5, source: 'blockchain', blockchain: 'BTC', transaction_hash: 'abc123...demo', created_at: '2025-06-15T10:00:00Z' },
  { id: 2, asset_symbol: 'BTC', asset_name: 'Bitcoin', asset_type: 'crypto', transaction_date: '2025-08-20T14:00:00Z', amount_invested: 3000, price_at_purchase: 58000, quantity_purchased: 0.05172, transaction_fees: 1.8, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2025-08-20T14:00:00Z' },
  { id: 3, asset_symbol: 'ETH', asset_name: 'Ethereum', asset_type: 'crypto', transaction_date: '2025-07-10T09:00:00Z', amount_invested: 4000, price_at_purchase: 3400, quantity_purchased: 1.17647, transaction_fees: 3.2, source: 'blockchain', blockchain: 'ETH', transaction_hash: '0xdef456...demo', created_at: '2025-07-10T09:00:00Z' },
  { id: 4, asset_symbol: 'ETH', asset_name: 'Ethereum', asset_type: 'crypto', transaction_date: '2025-10-05T16:00:00Z', amount_invested: 2500, price_at_purchase: 3100, quantity_purchased: 0.80645, transaction_fees: 2.1, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2025-10-05T16:00:00Z' },
  { id: 5, asset_symbol: 'SOL', asset_name: 'Solana', asset_type: 'crypto', transaction_date: '2025-09-01T12:00:00Z', amount_invested: 2000, price_at_purchase: 145, quantity_purchased: 13.7931, transaction_fees: 0.5, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2025-09-01T12:00:00Z' },
  { id: 6, asset_symbol: 'ADA', asset_name: 'Cardano', asset_type: 'crypto', transaction_date: '2025-11-12T08:00:00Z', amount_invested: 1500, price_at_purchase: 0.62, quantity_purchased: 2419.35, transaction_fees: 0.3, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2025-11-12T08:00:00Z' },
  { id: 7, asset_symbol: 'AAPL', asset_name: 'Apple Inc.', asset_type: 'traditional', transaction_date: '2025-07-25T15:00:00Z', amount_invested: 3500, price_at_purchase: 198, quantity_purchased: 17.6767, transaction_fees: 5.0, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2025-07-25T15:00:00Z' },
  { id: 8, asset_symbol: 'BNB', asset_name: 'Binance Coin', asset_type: 'crypto', transaction_date: '2025-12-01T11:00:00Z', amount_invested: 1000, price_at_purchase: 620, quantity_purchased: 1.6129, transaction_fees: 0.8, source: 'blockchain', blockchain: 'BSC', transaction_hash: '0xghi789...demo', created_at: '2025-12-01T11:00:00Z' },
  { id: 9, asset_symbol: 'ETH', asset_name: 'Ethereum', asset_type: 'crypto', transaction_date: '2026-01-15T10:00:00Z', amount_invested: 1800, price_at_purchase: 3250, quantity_purchased: 0.55385, transaction_fees: 1.5, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2026-01-15T10:00:00Z' },
  { id: 10, asset_symbol: 'BTC', asset_name: 'Bitcoin', asset_type: 'crypto', transaction_date: '2026-02-01T09:00:00Z', amount_invested: 2000, price_at_purchase: 97000, quantity_purchased: 0.02062, transaction_fees: 1.2, source: 'manual', blockchain: null, transaction_hash: null, created_at: '2026-02-01T09:00:00Z' },
];

// Simuler des prix actuels pour le mode démo
const DEMO_PRICES = {
  BTC: { price: 97500, change24h: 2.3 },
  ETH: { price: 3380, change24h: -1.1 },
  SOL: { price: 195, change24h: 5.7 },
  ADA: { price: 0.78, change24h: 3.2 },
  BNB: { price: 685, change24h: 0.8 },
};

// Helper : tenter une requête DB, fallback sur demo
async function tryQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (USE_DEMO) {
      console.log('[DEMO MODE] DB indisponible, utilisation des donnees de demonstration');
      return null;
    }
    throw err;
  }
}

// Helper : agréger les transactions de demo par actif (avec frais)
function aggregateDemo() {
  const map = {};
  for (const tx of DEMO_TRANSACTIONS) {
    if (!map[tx.asset_symbol]) {
      map[tx.asset_symbol] = {
        asset_symbol: tx.asset_symbol,
        asset_name: tx.asset_name,
        asset_type: tx.asset_type,
        total_quantity: 0,
        total_invested: 0,
        total_fees: 0,
        weighted_cost: 0,
        tx_count: 0,
      };
    }
    map[tx.asset_symbol].total_quantity += tx.quantity_purchased;
    map[tx.asset_symbol].total_invested += tx.amount_invested;
    map[tx.asset_symbol].total_fees += tx.transaction_fees;
    map[tx.asset_symbol].weighted_cost += tx.amount_invested + tx.transaction_fees;
    map[tx.asset_symbol].tx_count += 1;
  }
  return Object.values(map);
}

// ---------------------------------------------------------------------------
// Statistiques globales du portfolio
// ---------------------------------------------------------------------------
async function calculateGlobalStats() {
  const result = await tryQuery(`
    SELECT
      asset_symbol,
      asset_type,
      SUM(quantity_purchased) as total_quantity,
      SUM(amount_invested) as total_invested,
      SUM(transaction_fees) as total_fees
    FROM transactions
    GROUP BY asset_symbol, asset_type
  `);

  const assets = result ? result.rows : aggregateDemo();
  if (assets.length === 0) {
    return { totalInvested: 0, totalFees: 0, currentValue: 0, profitLoss: 0, profitLossPercent: 0 };
  }

  // Récupérer les prix actuels des cryptos
  const cryptoSymbols = assets
    .filter(a => a.asset_type === 'crypto')
    .map(a => a.asset_symbol);

  let prices = result ? {} : DEMO_PRICES;
  if (result && cryptoSymbols.length > 0) {
    try {
      prices = await getMultiplePrices(cryptoSymbols);
    } catch {
      // Continuer sans prix si l'API est indisponible
    }
  }

  let totalInvested = 0;
  let totalFees = 0;
  let currentValue = 0;

  for (const asset of assets) {
    const invested = parseFloat(asset.total_invested || 0);
    const fees = parseFloat(asset.total_fees || 0);
    const qty = parseFloat(asset.total_quantity);
    totalInvested += invested + fees;
    totalFees += fees;

    const priceData = prices[asset.asset_symbol];
    if (priceData) {
      currentValue += qty * priceData.price;
    } else {
      currentValue += invested + fees;
    }
  }

  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return { totalInvested, totalFees, currentValue, profitLoss, profitLossPercent };
}

// ---------------------------------------------------------------------------
// Détail par actif avec métriques complètes (frais inclus)
// ---------------------------------------------------------------------------
async function calculateAssetBreakdown() {
  const result = await tryQuery(`
    SELECT
      asset_symbol,
      asset_name,
      asset_type,
      SUM(quantity_purchased) as total_quantity,
      SUM(amount_invested) as total_invested,
      SUM(transaction_fees) as total_fees,
      SUM(amount_invested + transaction_fees) / NULLIF(SUM(quantity_purchased), 0) as avg_price,
      COUNT(*) as tx_count
    FROM transactions
    GROUP BY asset_symbol, asset_name, asset_type
    ORDER BY SUM(amount_invested) + SUM(transaction_fees) DESC
  `);

  let assets;
  let prices;

  if (result) {
    assets = result.rows;
    if (assets.length === 0) return [];

    const cryptoSymbols = assets
      .filter(a => a.asset_type === 'crypto')
      .map(a => a.asset_symbol);

    prices = {};
    if (cryptoSymbols.length > 0) {
      try {
        prices = await getMultiplePrices(cryptoSymbols);
      } catch {
        // Continuer sans prix
      }
    }
  } else {
    // Mode demo
    const agg = aggregateDemo();
    assets = agg.map(a => ({
      ...a,
      avg_price: a.weighted_cost / a.total_quantity,
    }));
    assets.sort((a, b) => (b.total_invested + b.total_fees) - (a.total_invested + a.total_fees));
    prices = DEMO_PRICES;
  }

  let totalPortfolioValue = 0;
  const enrichedAssets = assets.map(asset => {
    const qty = parseFloat(asset.total_quantity);
    const invested = parseFloat(asset.total_invested || 0);
    const totalFees = parseFloat(asset.total_fees || 0);
    const avgPrice = parseFloat(asset.avg_price || 0);
    const txCount = parseInt(asset.tx_count || 0, 10);
    const priceData = prices[asset.asset_symbol];
    const currentPrice = priceData?.price || null;
    const totalCost = invested + totalFees;
    const currentValue = currentPrice ? qty * currentPrice : totalCost;

    totalPortfolioValue += currentValue;

    return { asset, qty, invested, totalFees, totalCost, avgPrice, currentPrice, currentValue, txCount, change24h: priceData?.change24h || 0 };
  });

  return enrichedAssets.map(({ asset, qty, invested, totalFees, totalCost, avgPrice, currentPrice, currentValue, txCount, change24h }) => {
    const profitLoss = currentPrice ? currentValue - totalCost : 0;
    const profitLossPercent = totalCost > 0 && currentPrice ? (profitLoss / totalCost) * 100 : 0;
    const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

    return {
      symbol: asset.asset_symbol,
      name: asset.asset_name,
      type: asset.asset_type,
      quantity: qty,
      avgPrice,
      invested: totalCost,
      totalFees,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
      weight,
      change24h,
      txCount,
    };
  });
}

// ---------------------------------------------------------------------------
// Historique d'évolution du portfolio (investissement cumulé par jour)
// ---------------------------------------------------------------------------
async function calculatePortfolioHistory(period) {
  let dateFilter = '';
  const params = [];

  if (period && period !== 'ALL') {
    const periodMap = {
      '1M': '1 month',
      '3M': '3 months',
      '6M': '6 months',
      '1Y': '1 year',
    };
    const interval = periodMap[period];
    if (interval) {
      params.push(interval);
      dateFilter = `WHERE transaction_date >= NOW() - $1::interval`;
    }
  }

  const result = await tryQuery(`
    SELECT
      DATE(transaction_date) as date,
      SUM(amount_invested + transaction_fees) as daily_invested,
      SUM(SUM(amount_invested + transaction_fees)) OVER (ORDER BY DATE(transaction_date)) as cumulative_invested,
      COUNT(*) as transaction_count
    FROM transactions
    ${dateFilter}
    GROUP BY DATE(transaction_date)
    ORDER BY date
  `, params);

  if (result) {
    // Si on filtre par période, le cumulatif doit inclure les transactions antérieures
    if (dateFilter && result.rows.length > 0) {
      const priorResult = await query(`
        SELECT COALESCE(SUM(amount_invested + transaction_fees), 0) as prior_total
        FROM transactions
        WHERE transaction_date < $1::date
      `, [result.rows[0].date]);

      const priorTotal = parseFloat(priorResult.rows[0].prior_total);
      if (priorTotal > 0) {
        for (const row of result.rows) {
          row.cumulative_invested = parseFloat(row.cumulative_invested) + priorTotal;
        }
      }
    }

    return result.rows.map(row => ({
      date: row.date,
      value: parseFloat(row.cumulative_invested),
      dailyInvested: parseFloat(row.daily_invested),
      transactionCount: parseInt(row.transaction_count, 10),
    }));
  }

  // Mode demo : construire l'historique cumulé (avec frais)
  const periodMonths = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'ALL': 999 };
  const months = periodMonths[period] || 999;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const filtered = DEMO_TRANSACTIONS
    .filter(tx => new Date(tx.transaction_date) >= cutoff)
    .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

  // Calculer le cumulatif des transactions avant la période (avec frais)
  const priorTotal = DEMO_TRANSACTIONS
    .filter(tx => new Date(tx.transaction_date) < cutoff)
    .reduce((sum, tx) => sum + tx.amount_invested + tx.transaction_fees, 0);

  // Agréger par jour
  const dayMap = {};
  for (const tx of filtered) {
    const day = tx.transaction_date.split('T')[0];
    if (!dayMap[day]) dayMap[day] = { daily: 0, count: 0 };
    dayMap[day].daily += tx.amount_invested + tx.transaction_fees;
    dayMap[day].count += 1;
  }

  let cumulative = priorTotal;
  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      cumulative += data.daily;
      return {
        date,
        value: cumulative,
        dailyInvested: data.daily,
        transactionCount: data.count,
      };
    });
}

// ---------------------------------------------------------------------------
// Répartition du portfolio pour le pie chart
// ---------------------------------------------------------------------------
async function calculateAllocation() {
  const assets = await calculateAssetBreakdown();

  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  return assets.map(asset => ({
    name: asset.symbol,
    fullName: asset.name,
    type: asset.type,
    value: asset.currentValue,
    percent: totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0,
  }));
}

// ---------------------------------------------------------------------------
// Dernières transactions
// ---------------------------------------------------------------------------
async function getRecentTransactions(limit = 5) {
  const result = await tryQuery(`
    SELECT
      id, asset_symbol, asset_name, asset_type,
      transaction_date, amount_invested, price_at_purchase,
      quantity_purchased, transaction_fees, source, blockchain,
      transaction_hash, created_at
    FROM transactions
    ORDER BY transaction_date DESC
    LIMIT $1
  `, [limit]);

  if (result) return result.rows;

  // Mode demo
  return [...DEMO_TRANSACTIONS]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Historique d'évolution par actif (pour le graphique multi-lignes)
// Retourne un objet { symbol: [{ date, value, quantity }, ...] }
// ---------------------------------------------------------------------------
async function calculateAssetHistory(period) {
  // Récupérer toutes les transactions
  const result = await tryQuery(`
    SELECT
      asset_symbol, asset_name, asset_type,
      DATE(transaction_date) as date,
      quantity_purchased, price_at_purchase,
      amount_invested, transaction_fees
    FROM transactions
    ORDER BY transaction_date ASC
  `);

  const transactions = result ? result.rows : [...DEMO_TRANSACTIONS].sort(
    (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)
  );

  // Filtrer par période
  let cutoff = null;
  if (period && period !== 'ALL') {
    const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[period];
    if (months) {
      cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
    }
  }

  // Grouper par actif
  const assetMap = {};
  for (const tx of transactions) {
    const symbol = tx.asset_symbol;
    if (!assetMap[symbol]) {
      assetMap[symbol] = { name: tx.asset_name || symbol, type: tx.asset_type || 'crypto', txs: [] };
    }
    assetMap[symbol].txs.push(tx);
  }

  // Récupérer les prix actuels des cryptos
  const cryptoSymbols = Object.entries(assetMap)
    .filter(([, v]) => v.type === 'crypto')
    .map(([s]) => s);

  let currentPrices = result ? {} : DEMO_PRICES;
  if (result && cryptoSymbols.length > 0) {
    try {
      currentPrices = await getMultiplePrices(cryptoSymbols);
    } catch {
      // Continuer sans prix
    }
  }

  // Pour chaque actif, construire l'historique
  const histories = {};

  for (const [symbol, { name, txs }] of Object.entries(assetMap)) {
    const points = [];
    let cumulativeQty = 0;
    let cumulativeInvested = 0;

    // Calculer le cumulatif AVANT le cutoff (quantité acquise avant la période)
    let priorQty = 0;
    let priorInvested = 0;
    const filteredTxs = [];

    for (const tx of txs) {
      const txDate = result
        ? new Date(tx.date)
        : new Date(tx.transaction_date);
      const qty = parseFloat(tx.quantity_purchased);
      const invested = parseFloat(tx.amount_invested || 0) + parseFloat(tx.transaction_fees || 0);

      if (cutoff && txDate < cutoff) {
        priorQty += qty;
        priorInvested += invested;
      } else {
        filteredTxs.push({ date: txDate, qty, invested, price: parseFloat(tx.price_at_purchase) });
      }
    }

    cumulativeQty = priorQty;
    cumulativeInvested = priorInvested;

    // Si on a des positions avant la période, ajouter un point de départ
    if (cumulativeQty > 0 && cutoff && filteredTxs.length > 0) {
      const startPrice = filteredTxs[0].price;
      points.push({
        date: cutoff.toISOString().split('T')[0],
        value: cumulativeQty * startPrice,
        quantity: cumulativeQty,
        invested: cumulativeInvested,
      });
    }

    // Agréger les transactions par jour
    const dayMap = {};
    for (const tx of filteredTxs) {
      const day = tx.date.toISOString().split('T')[0];
      if (!dayMap[day]) {
        dayMap[day] = { qty: 0, invested: 0, price: tx.price };
      }
      dayMap[day].qty += tx.qty;
      dayMap[day].invested += tx.invested;
      dayMap[day].price = tx.price; // dernier prix du jour
    }

    // Construire les points jour par jour
    const days = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
    for (const [date, data] of days) {
      cumulativeQty += data.qty;
      cumulativeInvested += data.invested;

      points.push({
        date,
        value: cumulativeQty * data.price,
        quantity: cumulativeQty,
        invested: cumulativeInvested,
      });
    }

    // Ajouter le point "aujourd'hui" avec le prix actuel
    if (cumulativeQty > 0) {
      const today = new Date().toISOString().split('T')[0];
      const lastPoint = points[points.length - 1];

      // Ne pas doubler si la dernière transaction est aujourd'hui
      if (!lastPoint || lastPoint.date !== today) {
        const priceData = currentPrices[symbol];
        const todayPrice = priceData?.price || (lastPoint ? lastPoint.value / lastPoint.quantity : 0);
        points.push({
          date: today,
          value: cumulativeQty * todayPrice,
          quantity: cumulativeQty,
          invested: cumulativeInvested,
        });
      } else if (currentPrices[symbol]) {
        // Mettre à jour le dernier point avec le prix actuel
        lastPoint.value = cumulativeQty * currentPrices[symbol].price;
      }
    }

    if (points.length > 0) {
      histories[symbol] = { name, points };
    }
  }

  return histories;
}

module.exports = {
  calculateGlobalStats,
  calculateAssetBreakdown,
  calculatePortfolioHistory,
  calculateAllocation,
  getRecentTransactions,
  calculateAssetHistory,
};
