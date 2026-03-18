// =============================================================================
// Routes Blockchain - Verification de hash de transaction (BTC uniquement)
// =============================================================================

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const { getTransactionDetails } = blockchainService;
const { getHistoricalPrice } = require('../services/priceService');

// ---------------------------------------------------------------------------
// POST /api/blockchain/verify - Verifie un hash et retourne les details
// ---------------------------------------------------------------------------
router.post('/verify', async (req, res) => {
  try {
    const { txHash } = req.body;
    const blockchain = 'BTC';

    if (!txHash) {
      return res.status(400).json({
        error: 'Le champ txHash est requis',
      });
    }

    if (!blockchainService.isValidHash(txHash)) {
      return res.status(400).json({
        error: 'Format de hash invalide pour Bitcoin',
      });
    }

    const txDetails = await getTransactionDetails(txHash, blockchain);

    let priceAtTime = null;
    let calculatedValue = null;

    if (txDetails.timestamp) {
      try {
        const priceData = await getHistoricalPrice('BTC', txDetails.timestamp);
        priceAtTime = priceData.price;
        calculatedValue = txDetails.quantity * priceAtTime;
      } catch {
        // Le prix historique peut ne pas etre disponible
      }
    }

    res.json({
      hash: txDetails.hash,
      blockchain: 'BTC',
      timestamp: txDetails.timestamp,
      quantity: txDetails.quantity,
      fees: txDetails.fees,
      confirmations: txDetails.confirmations,
      blockHeight: txDetails.blockHeight,
      from: txDetails.from || null,
      to: txDetails.to || null,
      priceAtTime,
      calculatedValue,
      assetSymbol: 'BTC',
    });
  } catch (error) {
    const isNotFound = error.message.includes('non trouvee');
    res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'Transaction non trouvee' : 'Erreur interne du serveur'
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/blockchain/validate - Valide et recupere les details complets
// ---------------------------------------------------------------------------
router.post('/validate', async (req, res) => {
  try {
    const { txHash, recipientAddress } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: 'Hash de transaction requis',
      });
    }

    const result = await blockchainService.validateAndFetchTransaction(
      txHash.trim(),
      'BTC',
      recipientAddress?.trim() || null
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Erreur serveur',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/blockchain/outputs/:blockchain/:hash
// Recupere toutes les adresses de destination d'une transaction BTC
// ---------------------------------------------------------------------------
router.get('/outputs/:blockchain/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    const result = await blockchainService.getTransactionOutputAddresses(hash, 'BTC');

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Erreur serveur',
    });
  }
});

module.exports = router;
