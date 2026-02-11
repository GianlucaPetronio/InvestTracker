// =============================================================================
// Routes Blockchain - Vérification de hash de transaction
// =============================================================================

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const { getTransactionDetails } = blockchainService;
const { getHistoricalPrice } = require('../services/priceService');
const { isValidTransactionHash, isSupportedBlockchain } = require('../utils/validators');

// ---------------------------------------------------------------------------
// POST /api/blockchain/verify - Vérifie un hash et retourne les détails
// ---------------------------------------------------------------------------
// Body: { txHash: string, blockchain: 'BTC' | 'ETH' | 'BSC' }
// Retourne: { timestamp, quantity, fees, confirmations, priceAtTime, calculatedValue }
// ---------------------------------------------------------------------------
router.post('/verify', async (req, res) => {
  try {
    const { txHash, blockchain } = req.body;

    // Validation des entrées
    if (!txHash || !blockchain) {
      return res.status(400).json({
        error: 'Les champs txHash et blockchain sont requis',
      });
    }

    if (!(await isSupportedBlockchain(blockchain))) {
      return res.status(400).json({
        error: `Blockchain "${blockchain}" non supportée`,
      });
    }

    if (!(await isValidTransactionHash(txHash, blockchain))) {
      return res.status(400).json({
        error: `Format de hash invalide pour la blockchain ${blockchain}`,
      });
    }

    // Récupérer les détails de la transaction on-chain
    const txDetails = await getTransactionDetails(txHash, blockchain);

    // Tenter de récupérer le prix historique au moment de la transaction
    let priceAtTime = null;
    let calculatedValue = null;

    // Récupérer le symbole de l'actif natif depuis la DB
    const priceSymbol = await blockchainService.getAssetSymbol(blockchain) || blockchain.toUpperCase();

    if (txDetails.timestamp) {
      try {
        const priceData = await getHistoricalPrice(priceSymbol, txDetails.timestamp);
        priceAtTime = priceData.price;
        calculatedValue = txDetails.quantity * priceAtTime;
      } catch {
        // Le prix historique peut ne pas être disponible
      }
    }

    res.json({
      hash: txDetails.hash,
      blockchain: txDetails.blockchain,
      timestamp: txDetails.timestamp,
      quantity: txDetails.quantity,
      fees: txDetails.fees,
      confirmations: txDetails.confirmations,
      blockHeight: txDetails.blockHeight,
      from: txDetails.from || null,
      to: txDetails.to || null,
      priceAtTime,
      calculatedValue,
      assetSymbol: priceSymbol,
    });
  } catch (error) {
    const status = error.message.includes('non trouvée') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/blockchain/validate - Valide et récupère les détails complets
// ---------------------------------------------------------------------------
// Body: { txHash: string, blockchain: string, recipientAddress?: string }
// Retourne: { success: boolean, data?: {...}, error?: string, message?: string }
// ---------------------------------------------------------------------------
router.post('/validate', async (req, res) => {
  try {
    const { txHash, blockchain, recipientAddress } = req.body;

    if (!txHash || !blockchain) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: 'Hash de transaction et blockchain requis',
      });
    }

    const result = await blockchainService.validateAndFetchTransaction(
      txHash.trim(),
      blockchain.toUpperCase(),
      recipientAddress?.trim() || null
    );

    res.json(result);
  } catch (error) {
    console.error('Error validating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Erreur serveur',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/blockchain/detect/:hash - Détecte la blockchain depuis le hash
// ---------------------------------------------------------------------------
router.get('/detect/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const blockchainManager = require('../services/blockchainManager');
    const allBlockchains = await blockchainManager.getAllBlockchains();

    for (const bc of allBlockchains) {
      if (blockchainManager.validateHash(hash, bc)) {
        return res.json({
          success: true,
          blockchain: bc.symbol,
          symbol: bc.asset_symbol,
        });
      }
    }

    res.json({
      success: false,
      message: 'Format de hash non reconnu',
    });
  } catch (error) {
    console.error('Error detecting blockchain:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/blockchain/outputs/:blockchain/:hash
// Récupère toutes les adresses de destination d'une transaction
// Utile pour BTC où une tx peut avoir plusieurs outputs
// ---------------------------------------------------------------------------
router.get('/outputs/:blockchain/:hash', async (req, res) => {
  try {
    const { blockchain, hash } = req.params;

    const result = await blockchainService.getTransactionOutputAddresses(
      hash,
      blockchain.toUpperCase()
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching outputs:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Erreur serveur',
    });
  }
});

module.exports = router;
