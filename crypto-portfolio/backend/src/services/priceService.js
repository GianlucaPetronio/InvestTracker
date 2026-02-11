// =============================================================================
// Service de Prix - Recuperation des prix actuels et historiques
// =============================================================================
// Strategie multi-sources par precision decroissante :
//   1. Binance klines    - bougies 1 minute, pairs EUR directes, gratuit
//   2. CryptoCompare     - precision horaire, large couverture EUR
//   3. CoinGecko range   - horaire (<90j) ou journalier (>90j)
//
// L'ancien endpoint CoinGecko /history donnait UN prix par jour (minuit UTC),
// ce qui pouvait generer des ecarts de plusieurs % pour les transactions intra-day.

const axios = require('axios');
const { API_CONFIG, COINGECKO_IDS, BINANCE_EUR_SYMBOLS } = require('../config/apis');
const cacheService = require('./cacheService');

// ---------------------------------------------------------------------------
// Prix actuel (CoinGecko - suffisant pour les prix live)
// ---------------------------------------------------------------------------

async function getCurrentPrice(assetSymbol) {
  const cached = cacheService.get(`price:${assetSymbol}`);
  if (cached) return cached;

  const coinId = COINGECKO_IDS[assetSymbol.toUpperCase()];
  if (!coinId) {
    throw new Error(`Actif "${assetSymbol}" non trouve dans le mapping CoinGecko`);
  }

  const response = await axios.get(`${API_CONFIG.coingecko.baseUrl}/simple/price`, {
    params: {
      ids: coinId,
      vs_currencies: 'eur',
      include_24hr_change: true,
      include_market_cap: true,
    },
  });

  const data = response.data[coinId];
  if (!data) {
    throw new Error(`Pas de donnees de prix pour ${assetSymbol}`);
  }

  const result = {
    symbol: assetSymbol.toUpperCase(),
    price: data.eur,
    change24h: data.eur_24h_change || 0,
    marketCap: data.eur_market_cap || 0,
    currency: 'EUR',
    timestamp: new Date().toISOString(),
  };

  cacheService.set(`price:${assetSymbol}`, result, 60);
  return result;
}

// ---------------------------------------------------------------------------
// Prix de plusieurs actifs en une seule requete
// ---------------------------------------------------------------------------

async function getMultiplePrices(assetSymbols) {
  const coinIds = assetSymbols
    .map(s => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) return {};

  const response = await axios.get(`${API_CONFIG.coingecko.baseUrl}/simple/price`, {
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
}

// =============================================================================
// PRIX HISTORIQUE PRECIS - Multi-sources
// =============================================================================

// ---------------------------------------------------------------------------
// Source 1 : Binance klines - bougie 1 minute (le plus precis)
// ---------------------------------------------------------------------------
// Utilise la paire EUR directe. Retourne le prix close de la bougie 1m.
// Pas de cle API requise, historique illimite.

async function getPriceFromBinance(assetSymbol, timestampISO) {
  const pair = BINANCE_EUR_SYMBOLS[assetSymbol.toUpperCase()];
  if (!pair) return null;

  const tsMs = new Date(timestampISO).getTime();

  try {
    const response = await axios.get(`${API_CONFIG.binance.baseUrl}/klines`, {
      params: {
        symbol: pair,
        interval: '1m',
        startTime: tsMs,
        endTime: tsMs + 60000,
        limit: 1,
      },
      timeout: 8000,
    });

    if (!response.data || response.data.length === 0) {
      // Pas de bougie a cette minute exacte, elargir a 5 minutes
      const fallback = await axios.get(`${API_CONFIG.binance.baseUrl}/klines`, {
        params: {
          symbol: pair,
          interval: '1m',
          startTime: tsMs - 120000,
          endTime: tsMs + 180000,
          limit: 5,
        },
        timeout: 8000,
      });

      if (!fallback.data || fallback.data.length === 0) return null;

      // Trouver la bougie la plus proche du timestamp
      let closest = fallback.data[0];
      let minDiff = Math.abs(fallback.data[0][0] - tsMs);
      for (const candle of fallback.data) {
        const diff = Math.abs(candle[0] - tsMs);
        if (diff < minDiff) {
          minDiff = diff;
          closest = candle;
        }
      }
      return parseFloat(closest[4]); // close price
    }

    // close price de la bougie [0]=openTime [1]=open [2]=high [3]=low [4]=close
    return parseFloat(response.data[0][4]);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 2 : CryptoCompare - precision horaire (ou minute si < 7 jours)
// ---------------------------------------------------------------------------
// Utilise histominute pour les tx < 7 jours, histohour sinon.
// EUR direct via tsym=EUR.

async function getPriceFromCryptoCompare(assetSymbol, timestampISO) {
  const symbol = assetSymbol.toUpperCase();
  const tsSeconds = Math.floor(new Date(timestampISO).getTime() / 1000);
  const ageInDays = (Date.now() / 1000 - tsSeconds) / 86400;

  const baseUrl = API_CONFIG.cryptocompare.baseUrl;
  const apiKey = API_CONFIG.cryptocompare.apiKey;

  try {
    // < 7 jours : precision a la minute
    if (ageInDays < 7) {
      const response = await axios.get(`${baseUrl}/v2/histominute`, {
        params: {
          fsym: symbol,
          tsym: 'EUR',
          limit: 1,
          toTs: tsSeconds,
          ...(apiKey && { api_key: apiKey }),
        },
        timeout: 8000,
      });

      const dataPoints = response.data?.Data?.Data;
      if (dataPoints && dataPoints.length > 0) {
        // Prendre le dernier point (le plus proche de toTs)
        const candle = dataPoints[dataPoints.length - 1];
        if (candle.close > 0) return candle.close;
      }
    }

    // >= 7 jours : precision horaire
    const response = await axios.get(`${baseUrl}/v2/histohour`, {
      params: {
        fsym: symbol,
        tsym: 'EUR',
        limit: 1,
        toTs: tsSeconds,
        ...(apiKey && { api_key: apiKey }),
      },
      timeout: 8000,
    });

    const dataPoints = response.data?.Data?.Data;
    if (dataPoints && dataPoints.length > 0) {
      const candle = dataPoints[dataPoints.length - 1];
      if (candle.close > 0) return candle.close;
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 3 : CoinGecko market_chart/range - horaire (<90j) ou journalier
// ---------------------------------------------------------------------------
// Amelioration vs l'ancien /history qui donnait un seul prix par jour.
// Ici on demande une fenetre de 2h autour du timestamp et on prend le point
// le plus proche.

async function getPriceFromCoinGecko(assetSymbol, timestampISO) {
  const coinId = COINGECKO_IDS[assetSymbol.toUpperCase()];
  if (!coinId) return null;

  const tsSeconds = Math.floor(new Date(timestampISO).getTime() / 1000);

  try {
    // Fenetre de 2 heures autour du timestamp
    const from = tsSeconds - 3600;
    const to = tsSeconds + 3600;

    const response = await axios.get(
      `${API_CONFIG.coingecko.baseUrl}/coins/${coinId}/market_chart/range`,
      {
        params: {
          vs_currency: 'eur',
          from,
          to,
        },
        timeout: 10000,
      }
    );

    const prices = response.data?.prices;
    if (!prices || prices.length === 0) return null;

    // Trouver le point le plus proche du timestamp
    const tsMsTarget = tsSeconds * 1000;
    let closest = prices[0];
    let minDiff = Math.abs(prices[0][0] - tsMsTarget);

    for (const point of prices) {
      const diff = Math.abs(point[0] - tsMsTarget);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest[1]; // [timestamp_ms, price]
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getHistoricalPrice - Point d'entree principal
// ---------------------------------------------------------------------------
// Essaie les 3 sources par precision decroissante.
// Retourne le prix de la source la plus precise disponible.

async function getHistoricalPrice(assetSymbol, timestamp) {
  const cacheKey = `hist:${assetSymbol}:${timestamp}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const symbol = assetSymbol.toUpperCase();

  // Lancer les 3 sources en parallele pour la vitesse
  const [binancePrice, ccPrice, cgPrice] = await Promise.all([
    getPriceFromBinance(symbol, timestamp),
    getPriceFromCryptoCompare(symbol, timestamp),
    getPriceFromCoinGecko(symbol, timestamp),
  ]);

  // Prendre la meilleure source disponible (par ordre de precision)
  const price = binancePrice || ccPrice || cgPrice;

  if (!price) {
    throw new Error(`Aucun prix historique disponible pour ${symbol}`);
  }

  const result = {
    symbol,
    price,
    currency: 'EUR',
    source: binancePrice ? 'binance' : ccPrice ? 'cryptocompare' : 'coingecko',
    date: new Date(timestamp).toISOString(),
  };

  // Cache 1 heure pour les prix historiques
  cacheService.set(cacheKey, result, 3600);
  return result;
}

// ---------------------------------------------------------------------------
// getHistoricalPriceAllSources - Retourne les prix de TOUTES les sources
// ---------------------------------------------------------------------------
// Utilise pour le debug et la comparaison dans TransactionPreview.

async function getHistoricalPriceAllSources(assetSymbol, timestamp) {
  const cacheKey = `hist_all:${assetSymbol}:${timestamp}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const symbol = assetSymbol.toUpperCase();

  const [binancePrice, ccPrice, cgPrice] = await Promise.all([
    getPriceFromBinance(symbol, timestamp),
    getPriceFromCryptoCompare(symbol, timestamp),
    getPriceFromCoinGecko(symbol, timestamp),
  ]);

  const sources = {
    binance: binancePrice,
    cryptocompare: ccPrice,
    coingecko: cgPrice,
  };

  // Calculer la moyenne des sources disponibles
  const available = [binancePrice, ccPrice, cgPrice].filter(p => p !== null && p > 0);
  const average = available.length > 0
    ? available.reduce((sum, p) => sum + p, 0) / available.length
    : null;

  // Prix recommande : Binance > CryptoCompare > CoinGecko > moyenne
  const recommended = binancePrice || ccPrice || cgPrice || average;

  const result = {
    sources,
    average,
    recommended,
    recommendedSource: binancePrice ? 'binance' : ccPrice ? 'cryptocompare' : cgPrice ? 'coingecko' : 'average',
    sourcesCount: available.length,
  };

  cacheService.set(cacheKey, result, 3600);
  return result;
}

module.exports = {
  getCurrentPrice,
  getMultiplePrices,
  getHistoricalPrice,
  getHistoricalPriceAllSources,
  // Exporter les fonctions individuelles pour les tests/debug
  getPriceFromBinance,
  getPriceFromCryptoCompare,
  getPriceFromCoinGecko,
};
