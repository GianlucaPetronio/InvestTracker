// =============================================================================
// Routes Blockchain - Vérification de hash de transaction
// =============================================================================

const express = require('express');
const router = express.Router();
const { getTransactionDetails } = require('../services/blockchainService');
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

    if (!isSupportedBlockchain(blockchain)) {
      return res.status(400).json({
        error: `Blockchain "${blockchain}" non supportée. Supportées: BTC, ETH, BSC`,
      });
    }

    if (!isValidTransactionHash(txHash, blockchain)) {
      return res.status(400).json({
        error: `Format de hash invalide pour la blockchain ${blockchain}`,
      });
    }

    // Récupérer les détails de la transaction on-chain
    const txDetails = await getTransactionDetails(txHash, blockchain);

    // Tenter de récupérer le prix historique au moment de la transaction
    let priceAtTime = null;
    let calculatedValue = null;

    // Mapper blockchain vers symbole pour le prix
    const priceSymbol = blockchain.toUpperCase() === 'BSC' ? 'BNB' : blockchain.toUpperCase();

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

module.exports = router;
