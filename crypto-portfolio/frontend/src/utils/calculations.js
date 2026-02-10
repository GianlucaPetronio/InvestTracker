// =============================================================================
// Fonctions de calcul - Prix moyen, P&L, métriques
// =============================================================================

/**
 * Calcule le prix moyen pondéré d'achat
 * @param {Array} transactions - Liste des transactions pour un actif
 * @returns {number} Prix moyen pondéré
 */
export function calculateAveragePrice(transactions) {
  const totalCost = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.price_at_purchase) * parseFloat(tx.quantity_purchased),
    0
  );
  const totalQuantity = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.quantity_purchased),
    0
  );
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * Calcule le P&L (Profit and Loss) pour un actif
 * @param {number} currentPrice - Prix actuel
 * @param {number} avgPrice - Prix moyen d'achat
 * @param {number} quantity - Quantité totale détenue
 * @returns {{ pnl: number, pnlPercent: number }}
 */
export function calculatePnL(currentPrice, avgPrice, quantity) {
  const invested = avgPrice * quantity;
  const currentValue = currentPrice * quantity;
  const pnl = currentValue - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
  return { pnl, pnlPercent };
}

/**
 * Calcule la quantité totale d'un actif
 * @param {Array} transactions - Liste des transactions
 * @returns {number}
 */
export function calculateTotalQuantity(transactions) {
  return transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.quantity_purchased),
    0
  );
}

/**
 * Calcule le total investi pour un actif
 * @param {Array} transactions - Liste des transactions
 * @returns {number}
 */
export function calculateTotalInvested(transactions) {
  return transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount_invested || 0),
    0
  );
}

/**
 * Formate un nombre en devise EUR
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formate un pourcentage avec signe
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formate une quantité crypto (jusqu'à 8 décimales)
 * @param {number} value
 * @returns {string}
 */
export function formatQuantity(value) {
  if (value >= 1) {
    return value.toFixed(4);
  }
  return value.toFixed(8);
}
