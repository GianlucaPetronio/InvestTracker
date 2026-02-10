// =============================================================================
// Service de Prix - Récupération des prix actuels et historiques
// =============================================================================
// Utilise CoinGecko comme source principale de données de prix.

const axios = require('axios');
const { API_CONFIG, COINGECKO_IDS } = require('../config/apis');
const cacheService = require('./cacheService');

const { baseUrl } = API_CONFIG.coingecko;

// ---------------------------------------------------------------------------
// Prix actuel d'un actif
// ---------------------------------------------------------------------------
async function getCurrentPrice(assetSymbol) {
  // Vérifier le cache d'abord (valide 60 secondes)
  const cached = cacheService.get(`price:${assetSymbol}`);
  if (cached) return cached;

  const coinId = COINGECKO_IDS[assetSymbol.toUpperCase()];
  if (!coinId) {
    throw new Error(`Actif "${assetSymbol}" non trouvé dans le mapping CoinGecko`);
  }

  try {
    const response = await axios.get(`${baseUrl}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: 'eur',
        include_24hr_change: true,
        include_market_cap: true,
      },
    });

    const data = response.data[coinId];
    if (!data) {
      throw new Error(`Pas de données de prix pour ${assetSymbol}`);
    }

    const result = {
      symbol: assetSymbol.toUpperCase(),
      price: data.eur,
      change24h: data.eur_24h_change || 0,
      marketCap: data.eur_market_cap || 0,
      currency: 'EUR',
      timestamp: new Date().toISOString(),
    };

    // Mettre en cache pour 60 secondes
    cacheService.set(`price:${assetSymbol}`, result, 60);
    return result;
  } catch (error) {
    throw new Error(`Erreur récupération prix pour ${assetSymbol}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Prix de plusieurs actifs en une seule requête
// ---------------------------------------------------------------------------
async function getMultiplePrices(assetSymbols) {
  const coinIds = assetSymbols
    .map(s => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) {
    return {};
  }

  try {
    const response = await axios.get(`${baseUrl}/simple/price`, {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'eur',
        include_24hr_change: true,
      },
    });

    const results = {};
    for (const symbol of assetSymbols) {
      const coinId = COINGECKO_IDS[symbol.toUpperCase()];
      if (coinId && response.data[coinId]) {
        results[symbol.toUpperCase()] = {
          price: response.data[coinId].eur,
          change24h: response.data[coinId].eur_24h_change || 0,
        };
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Erreur récupération prix multiples: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Prix historique d'un actif à une date donnée
// ---------------------------------------------------------------------------
async function getHistoricalPrice(assetSymbol, timestamp) {
  const cacheKey = `hist:${assetSymbol}:${timestamp}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const coinId = COINGECKO_IDS[assetSymbol.toUpperCase()];
  if (!coinId) {
    throw new Error(`Actif "${assetSymbol}" non trouvé dans le mapping CoinGecko`);
  }

  // CoinGecko attend le format dd-mm-yyyy
  const date = new Date(timestamp);
  const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

  try {
    const response = await axios.get(`${baseUrl}/coins/${coinId}/history`, {
      params: { date: dateStr, localization: false },
    });

    const price = response.data.market_data?.current_price?.eur;
    if (!price) {
      throw new Error(`Pas de prix historique pour ${assetSymbol} au ${dateStr}`);
    }

    const result = {
      symbol: assetSymbol.toUpperCase(),
      price,
      date: dateStr,
      currency: 'EUR',
    };

    // Cache longue durée pour les prix historiques (1 heure)
    cacheService.set(cacheKey, result, 3600);
    return result;
  } catch (error) {
    throw new Error(`Erreur prix historique ${assetSymbol}: ${error.message}`);
  }
}

module.exports = {
  getCurrentPrice,
  getMultiplePrices,
  getHistoricalPrice,
};
