// =============================================================================
// Service de Cache en mémoire
// =============================================================================
// Cache simple en mémoire avec TTL pour réduire les appels API.
// En production, remplacer par Redis pour un cache partagé et persistant.

const cache = new Map();

/**
 * Récupère une valeur du cache si elle n'est pas expirée
 */
function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Stocke une valeur dans le cache avec un TTL en secondes
 */
function set(key, value, ttlSeconds = 60) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Supprime une entrée du cache
 */
function del(key) {
  cache.delete(key);
}

/**
 * Vide tout le cache
 */
function clear() {
  cache.clear();
}

/**
 * Retourne le nombre d'entrées dans le cache
 */
function size() {
  return cache.size;
}

module.exports = { get, set, del, clear, size };
