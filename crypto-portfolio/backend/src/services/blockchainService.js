// =============================================================================
// Service Blockchain - Recuperation des donnees de transaction on-chain
// =============================================================================
// Ce service interroge l'API Blockchain.info pour extraire les details
// d'une transaction Bitcoin a partir de son hash.

const axios = require('axios');
const priceService = require('./priceService');

const BTC_CONFIG = {
  symbol: 'BTC',
  name: 'Bitcoin',
  hash_pattern: '^[a-fA-F0-9]{64}$',
  address_pattern: '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$',
  needs_recipient_address: true,
  asset_symbol: 'BTC',
  api_type: 'bitcoin',
  api_url: 'https://blockchain.info',
  is_active: true,
};

// ---------------------------------------------------------------------------
// Bitcoin - via Blockchain.info API
// ---------------------------------------------------------------------------
async function getBitcoinTxDetails(txHash, recipientAddress = null) {
  try {
    const baseUrl = BTC_CONFIG.api_url;
    const url = `${baseUrl}/rawtx/${txHash}`;
    const response = await axios.get(url);
    const tx = response.data;

    let blockTimestamp = null;

    if (tx.block_height) {
      const blockUrl = `${baseUrl}/block-height/${tx.block_height}?format=json`;
      const blockResponse = await axios.get(blockUrl);
      const block = blockResponse.data?.blocks?.[0];

      if (block?.time) {
        blockTimestamp = new Date(block.time * 1000).toISOString();
      }
    }

    const totalInput = tx.inputs.reduce(
      (sum, input) => sum + (input.prev_out?.value || 0),
      0
    );
    const totalOutput = tx.out.reduce(
      (sum, output) => sum + output.value,
      0
    );

    const feeBTC = (totalInput - totalOutput) / 1e8;

    const allOutputs = tx.out.map(output => ({
      address: output.addr,
      value: output.value / 1e8,
      spent: output.spent,
    }));

    let quantity;
    let relevantOutputs;

    if (recipientAddress) {
      const matched = allOutputs.filter(o => o.address === recipientAddress);
      if (matched.length === 0) {
        throw new Error("Cette adresse n'a pas recu de fonds dans cette transaction");
      }
      quantity = matched.reduce((sum, o) => sum + o.value, 0);
      relevantOutputs = matched.length;
    } else {
      quantity = allOutputs.reduce((sum, o) => sum + o.value, 0);
      relevantOutputs = allOutputs.length;
    }

    return {
      hash: tx.hash,
      blockchain: 'BTC',
      timestamp: blockTimestamp || new Date(tx.time * 1000).toISOString(),
      confirmations: tx.block_height ? 'confirmee' : 'non confirmee',
      blockHeight: tx.block_height || null,
      quantity,
      fees: feeBTC,
      from: tx.inputs[0]?.prev_out?.addr || 'coinbase',
      to: recipientAddress || allOutputs[0]?.address || null,
      inputs: tx.inputs.map(input => ({
        address: input.prev_out?.addr || 'coinbase',
        value: (input.prev_out?.value || 0) / 1e8,
      })),
      outputs: allOutputs,
      totalOutputs: allOutputs.length,
      relevantOutputs,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Transaction Bitcoin non trouvee');
    }
    if (error.message.includes('pas recu de fonds')) throw error;
    throw new Error(`Erreur API Bitcoin: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Routeur principal - BTC uniquement
// ---------------------------------------------------------------------------
async function getTransactionDetails(txHash, blockchain, recipientAddress = null) {
  if (blockchain !== 'BTC') {
    throw new Error(`Blockchain "${blockchain}" non supportee. Seul Bitcoin (BTC) est supporte.`);
  }
  return getBitcoinTxDetails(txHash, recipientAddress);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function isValidHash(hash) {
  return new RegExp(BTC_CONFIG.hash_pattern).test(hash);
}

function isValidAddress(address) {
  return new RegExp(BTC_CONFIG.address_pattern).test(address);
}

function getAssetSymbol() {
  return 'BTC';
}

// ---------------------------------------------------------------------------
// Recuperation du prix depuis plusieurs sources pour comparaison/debug
// ---------------------------------------------------------------------------
async function getPriceFromMultipleSources(assetSymbol, timestamp) {
  try {
    return await priceService.getHistoricalPriceAllSources(assetSymbol, timestamp);
  } catch {
    return {
      sources: { binance: null, cryptocompare: null, coingecko: null },
      average: null,
      recommended: null,
      recommendedSource: null,
      sourcesCount: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Validation complete et recuperation des details d'une transaction
// ---------------------------------------------------------------------------
async function validateAndFetchTransaction(txHash, blockchain, recipientAddress = null) {
  try {
    if (blockchain !== 'BTC') {
      return {
        success: false,
        error: 'UNSUPPORTED',
        message: 'Seul Bitcoin (BTC) est supporte.',
      };
    }

    if (!isValidHash(txHash)) {
      return {
        success: false,
        error: 'FORMAT_INVALID',
        message: 'Le format du hash de transaction est invalide',
      };
    }

    if (recipientAddress && !isValidAddress(recipientAddress)) {
      return {
        success: false,
        error: 'ADDRESS_INVALID',
        message: "Le format de l'adresse est invalide pour BTC",
      };
    }

    let txDetails;
    try {
      txDetails = await getBitcoinTxDetails(txHash, recipientAddress);
    } catch (err) {
      if (err.message.includes('non trouvee')) {
        return {
          success: false,
          error: 'TX_NOT_FOUND',
          message: 'Transaction non trouvee sur la blockchain',
        };
      }
      if (err.message.includes('pas recu de fonds') || err.message.includes('pas la destination')) {
        return {
          success: false,
          error: 'ADDRESS_NOT_IN_TX',
          message: err.message,
        };
      }
      throw err;
    }

    if (!txDetails) {
      return {
        success: false,
        error: 'TX_NOT_FOUND',
        message: 'Transaction non trouvee sur la blockchain',
      };
    }

    let timestamp;
    if (txDetails.timestamp) {
      const d = new Date(txDetails.timestamp);
      timestamp = Math.floor(d.getTime() / 1000);
    }

    let priceAtTime = null;
    let estimatedValue = null;
    let priceSources = null;

    if (txDetails.timestamp) {
      try {
        priceSources = await getPriceFromMultipleSources('BTC', txDetails.timestamp);
        priceAtTime = priceSources.recommended || priceSources.average;
        if (priceAtTime) {
          estimatedValue = txDetails.quantity * priceAtTime;
        }
      } catch {
        // Prix non disponible
      }
    }

    const debug = {
      quantityRaw: txDetails.quantity,
      feesRaw: txDetails.fees,
      priceSources: priceSources || {
        sources: { binance: null, cryptocompare: null, coingecko: null },
        average: null, recommended: null, recommendedSource: null, sourcesCount: 0,
      },
      calculation: {
        quantity: txDetails.quantity,
        price: priceAtTime,
        priceSource: priceSources?.recommendedSource || null,
        subtotal: priceAtTime ? txDetails.quantity * priceAtTime : null,
        fees: txDetails.fees,
        feesInEur: priceAtTime ? txDetails.fees * priceAtTime : null,
        total: priceAtTime
          ? (txDetails.quantity * priceAtTime) + (txDetails.fees * priceAtTime)
          : null,
      },
    };

    return {
      success: true,
      data: {
        hash: txHash,
        blockchain: 'BTC',
        recipientAddress: recipientAddress || null,
        timestamp: timestamp || null,
        date: txDetails.timestamp || new Date().toISOString(),
        quantity: txDetails.quantity,
        fees: txDetails.fees,
        confirmations: txDetails.confirmations,
        blockHeight: txDetails.blockHeight || null,
        priceAtTime,
        estimatedValue,
        fromAddress: txDetails.from || (txDetails.inputs?.[0]?.address) || null,
        toAddress: txDetails.to || (txDetails.outputs?.[0]?.address) || null,
        assetSymbol: 'BTC',
        totalOutputs: txDetails.totalOutputs || 1,
        relevantOutputs: txDetails.relevantOutputs || 1,
        debug,
      },
    };
  } catch (error) {
    console.error('Error validating transaction:', error);
    return {
      success: false,
      error: 'API_ERROR',
      message: error.message || 'Erreur lors de la recuperation des donnees blockchain',
    };
  }
}

// ---------------------------------------------------------------------------
// Recupere toutes les adresses de destination d'une transaction BTC
// ---------------------------------------------------------------------------
async function getTransactionOutputAddresses(txHash, blockchain) {
  try {
    if (blockchain !== 'BTC') {
      return { success: false, error: 'Seul Bitcoin (BTC) est supporte' };
    }

    const baseUrl = BTC_CONFIG.api_url;
    const response = await axios.get(`${baseUrl}/rawtx/${txHash}`);
    const addresses = response.data.out
      .filter(output => output.addr)
      .map(output => ({
        address: output.addr,
        amount: output.value / 1e8,
        spent: output.spent,
      }));
    return { success: true, addresses };
  } catch (error) {
    console.error('Error getting output addresses:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getTransactionDetails,
  validateAndFetchTransaction,
  getTransactionOutputAddresses,
  getPriceFromMultipleSources,
  isValidHash,
  isValidAddress,
  getAssetSymbol,
};
