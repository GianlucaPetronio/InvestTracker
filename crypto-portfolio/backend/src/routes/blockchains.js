// =============================================================================
// Routes Blockchains - CRUD de gestion des blockchains supportées
// =============================================================================

const express = require('express');
const router = express.Router();
const blockchainManager = require('../services/blockchainManager');

// ---------------------------------------------------------------------------
// GET /api/blockchains - Liste toutes les blockchains
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const blockchains = await blockchainManager.getAllBlockchains(includeInactive);
    res.json({ success: true, blockchains });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/blockchains/:symbol - Récupère une blockchain par symbol
// ---------------------------------------------------------------------------
router.get('/:symbol', async (req, res) => {
  try {
    const blockchain = await blockchainManager.getBlockchainBySymbol(req.params.symbol);
    if (!blockchain) {
      return res.status(404).json({ success: false, error: 'Blockchain non trouvée' });
    }
    res.json({ success: true, blockchain });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/blockchains - Ajoute une nouvelle blockchain
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { symbol, name, icon, hash_pattern, address_pattern,
            needs_recipient_address, asset_symbol, api_type,
            api_url, api_key_env_var } = req.body;

    if (!symbol || !name || !hash_pattern) {
      return res.status(400).json({
        success: false,
        error: 'Les champs symbol, name et hash_pattern sont requis',
      });
    }

    const blockchain = await blockchainManager.createBlockchain({
      symbol, name, icon, hash_pattern, address_pattern,
      needs_recipient_address, asset_symbol, api_type,
      api_url, api_key_env_var,
    });

    res.status(201).json({ success: true, blockchain });
  } catch (error) {
    const status = error.message.includes('existe déjà') || error.message.includes('duplicate') ? 409 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/blockchains/:symbol - Met à jour une blockchain
// ---------------------------------------------------------------------------
router.put('/:symbol', async (req, res) => {
  try {
    const blockchain = await blockchainManager.updateBlockchain(
      req.params.symbol,
      req.body
    );

    if (!blockchain) {
      return res.status(404).json({ success: false, error: 'Blockchain non trouvée' });
    }

    res.json({ success: true, blockchain });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/blockchains/:symbol - Supprime une blockchain custom
// ---------------------------------------------------------------------------
router.delete('/:symbol', async (req, res) => {
  try {
    const blockchain = await blockchainManager.deleteBlockchain(req.params.symbol);
    res.json({ success: true, blockchain });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/blockchains/:symbol/toggle - Active/désactive une blockchain
// ---------------------------------------------------------------------------
router.post('/:symbol/toggle', async (req, res) => {
  try {
    const blockchain = await blockchainManager.toggleBlockchain(req.params.symbol);
    if (!blockchain) {
      return res.status(404).json({ success: false, error: 'Blockchain non trouvée' });
    }
    res.json({ success: true, blockchain });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/blockchains/:symbol/api-key - Sauvegarde une clé API
// ---------------------------------------------------------------------------
router.post('/:symbol/api-key', async (req, res) => {
  try {
    const { api_key, label } = req.body;
    if (!api_key) {
      return res.status(400).json({ success: false, error: 'Clé API requise' });
    }
    await blockchainManager.setApiKey(req.params.symbol, api_key, label);
    res.json({ success: true, message: 'Clé API sauvegardée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/blockchains/:symbol/api-key - Supprime une clé API
// ---------------------------------------------------------------------------
router.delete('/:symbol/api-key', async (req, res) => {
  try {
    await blockchainManager.removeApiKey(req.params.symbol);
    res.json({ success: true, message: 'Clé API supprimée' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
