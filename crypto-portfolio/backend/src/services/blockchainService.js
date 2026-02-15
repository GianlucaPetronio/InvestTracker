// =============================================================================
// Service Blockchain - Recuperation des donnees de transaction on-chain
// =============================================================================
// Ce service interroge les APIs des blockchain explorers pour extraire
// les details d'une transaction a partir de son hash.
// Supporte le filtrage par adresse de reception pour les transactions
// multi-outputs (notamment Bitcoin).
//
// La configuration des blockchains est chargee depuis la table `blockchains`
// via blockchainManager.js. Le dispatch se fait sur le champ `api_type`.

const axios = require('axios');
const priceService = require('./priceService');
const blockchainManager = require('./blockchainManager');

// ---------------------------------------------------------------------------
// Bitcoin - via Blockchain.info API
// ---------------------------------------------------------------------------
async function getBitcoinTxDetails(txHash, blockchainConfig, recipientAddress = null) {
  try {
    const baseUrl = blockchainConfig.api_url || 'https://blockchain.info';
    const url = `${baseUrl}/rawtx/${txHash}`;
    const response = await axios.get(url);
    const tx = response.data;

    // ✅ DÉCLARATION AVANT UTILISATION
    let blockTimestamp = null;

    // ✅ Récupération du timestamp du bloc (source de vérité)
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
      blockchain: blockchainConfig.symbol,
      // ✅ PRIORITÉ AU TIMESTAMP DU BLOC
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
// Solana - via Solana JSON-RPC API (public ou Helius)
// ---------------------------------------------------------------------------
async function getSolanaTxDetails(txHash, blockchainConfig, recipientAddress = null) {
  const rpcUrl = blockchainConfig.api_url || 'https://api.mainnet-beta.solana.com';

  try {
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [txHash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    });

    const tx = response.data.result;
    if (!tx) {
      throw new Error('Transaction Solana non trouvee');
    }

    const fee = tx.meta.fee / 1e9; // lamports -> SOL
    const timestamp = tx.blockTime
      ? new Date(tx.blockTime * 1000).toISOString()
      : null;

    // Detecter les transferts SOL via les changements de balance
    const accountKeys = tx.transaction.message.accountKeys;
    const preBalances = tx.meta.preBalances;
    const postBalances = tx.meta.postBalances;

    const outputs = [];
    let fromAddress = null;

    for (let i = 0; i < accountKeys.length; i++) {
      const address = typeof accountKeys[i] === 'string'
        ? accountKeys[i]
        : accountKeys[i].pubkey;
      const diff = (postBalances[i] - preBalances[i]) / 1e9;

      if (diff < 0) {
        if (!fromAddress) fromAddress = address;
      } else if (diff > 0) {
        outputs.push({ address, value: diff });
      }
    }

    let quantity;
    let relevantOutputs;

    if (recipientAddress) {
      const matched = outputs.filter(o => o.address === recipientAddress);
      if (matched.length === 0) {
        throw new Error("Cette adresse n'a pas recu de fonds dans cette transaction");
      }
      quantity = matched.reduce((sum, o) => sum + o.value, 0);
      relevantOutputs = matched.length;
    } else {
      quantity = outputs.reduce((sum, o) => sum + o.value, 0);
      relevantOutputs = outputs.length;
    }

    return {
      hash: txHash,
      blockchain: blockchainConfig.symbol,
      timestamp,
      confirmations: tx.meta.err ? 'echouee' : 'confirmee',
      blockHeight: tx.slot,
      from: fromAddress,
      to: recipientAddress || outputs[0]?.address || null,
      quantity,
      fees: fee,
      outputs,
      totalOutputs: outputs.length,
      relevantOutputs,
    };
  } catch (error) {
    if (error.message.includes('non trouvee')) throw error;
    if (error.message.includes('pas recu de fonds')) throw error;
    throw new Error(`Erreur API Solana: ${error.message}`);
  }
}


// ---------------------------------------------------------------------------
// Handler generique Etherscan-like (ETH, BSC, MATIC, ARB, OP, AVAX, etc.)
// ---------------------------------------------------------------------------
async function getEtherscanLikeTxDetails(txHash, blockchainConfig, apiKey, recipientAddress = null) {
  const baseUrl = blockchainConfig.api_url;
  const symbol = blockchainConfig.symbol;

  try {
    const txResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
        apikey: apiKey || '',
      },
    });

    const tx = txResponse.data.result;
    if (!tx) {
      throw new Error(`Transaction ${symbol} non trouvee`);
    }

    if (recipientAddress) {
      const normalizedRecipient = recipientAddress.toLowerCase();
      const normalizedTo = (tx.to || '').toLowerCase();
      if (normalizedRecipient !== normalizedTo) {
        throw new Error('Cette adresse n\'est pas la destination de cette transaction');
      }
    }

    const receiptResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash,
        apikey: apiKey || '',
      },
    });

    const receipt = receiptResponse.data.result;

    const valueWei = parseInt(tx.value, 16);
    const value = valueWei / 1e18;
    const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 0;
    const gasPrice = parseInt(tx.gasPrice, 16);
    const fees = (gasUsed * gasPrice) / 1e18;

    let timestamp = null;
    if (tx.blockNumber) {
      const blockResponse = await axios.get(baseUrl, {
        params: {
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: tx.blockNumber,
          boolean: 'false',
          apikey: apiKey || '',
        },
      });
      const block = blockResponse.data.result;
      if (block) {
        timestamp = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();
      }
    }

    return {
      hash: tx.hash,
      blockchain: symbol,
      timestamp,
      confirmations: receipt?.status === '0x1' ? 'confirmee' : 'echouee',
      blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : null,
      from: tx.from,
      to: tx.to,
      quantity: value,
      fees,
      outputs: [{ address: tx.to, value }],
      totalOutputs: 1,
      relevantOutputs: 1,
    };
  } catch (error) {
    if (error.message.includes('non trouvee')) throw error;
    if (error.message.includes('pas la destination')) throw error;
    throw new Error(`Erreur API ${symbol}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Routeur principal - dispatch sur api_type depuis la config DB
// ---------------------------------------------------------------------------
async function getTransactionDetails(txHash, blockchain, recipientAddress = null) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  if (!config) {
    throw new Error(`Blockchain "${blockchain}" non configuree`);
  }
  if (!config.is_active) {
    throw new Error(`Blockchain "${blockchain}" est desactivee`);
  }

  const apiKey = await blockchainManager.getApiKey(blockchain);

  switch (config.api_type) {
    case 'bitcoin':
      return getBitcoinTxDetails(txHash, config, recipientAddress);
    case 'etherscan':
      return getEtherscanLikeTxDetails(txHash, config, apiKey, recipientAddress);
    case 'solana':
      return getSolanaTxDetails(txHash, config, recipientAddress);
    case 'unsupported':
      throw new Error(
        `La recuperation automatique n'est pas disponible pour ${config.name}. ` +
        'Utilisez la saisie manuelle.'
      );
    default:
      throw new Error(`Type d'API "${config.api_type}" non supporte`);
  }
}

// ---------------------------------------------------------------------------
// Validation async via DB
// ---------------------------------------------------------------------------
async function isValidHash(hash, blockchain) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  if (!config) return false;
  return blockchainManager.validateHash(hash, config);
}

async function isValidAddress(address, blockchain) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  if (!config) return false;
  return blockchainManager.validateAddress(address, config);
}

async function getAssetSymbol(blockchain) {
  const config = await blockchainManager.getBlockchainBySymbol(blockchain);
  return config?.asset_symbol || null;
}

// ---------------------------------------------------------------------------
// Recuperation du prix depuis plusieurs sources pour comparaison/debug
// ---------------------------------------------------------------------------
// Delegue a priceService.getHistoricalPriceAllSources qui interroge
// Binance (1min), CryptoCompare (horaire) et CoinGecko (range) en parallele.
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
    if (!(await isValidHash(txHash, blockchain))) {
      return {
        success: false,
        error: 'FORMAT_INVALID',
        message: 'Le format du hash de transaction est invalide',
      };
    }

    if (recipientAddress && !(await isValidAddress(recipientAddress, blockchain))) {
      return {
        success: false,
        error: 'ADDRESS_INVALID',
        message: "Le format de l'adresse est invalide pour " + blockchain,
      };
    }

    let txDetails;
    try {
      txDetails = await getTransactionDetails(txHash, blockchain, recipientAddress);
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
      if (err.message.includes('recuperation automatique')) {
        return {
          success: false,
          error: 'UNSUPPORTED',
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

    const priceSymbol = await getAssetSymbol(blockchain);
    let priceAtTime = null;
    let estimatedValue = null;
    let priceSources = null;

    if (txDetails.timestamp && priceSymbol) {
      try {
        priceSources = await getPriceFromMultipleSources(priceSymbol, txDetails.timestamp);
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
        blockchain,
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
        assetSymbol: priceSymbol,
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
// Recupere toutes les adresses de destination d'une transaction
// ---------------------------------------------------------------------------
async function getTransactionOutputAddresses(txHash, blockchain) {
  try {
    const config = await blockchainManager.getBlockchainBySymbol(blockchain);
    if (!config) {
      return { success: false, error: `Blockchain ${blockchain} non configuree` };
    }

    const apiKey = await blockchainManager.getApiKey(blockchain);

    if (config.api_type === 'bitcoin') {
      const baseUrl = config.api_url || 'https://blockchain.info';
      const response = await axios.get(`${baseUrl}/rawtx/${txHash}`);
      const addresses = response.data.out
        .filter(output => output.addr)
        .map(output => ({
          address: output.addr,
          amount: output.value / 1e8,
          spent: output.spent,
        }));
      return { success: true, addresses };
    }

    if (config.api_type === 'etherscan') {
      const txResponse = await axios.get(config.api_url, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionByHash',
          txhash: txHash,
          apikey: apiKey || '',
        },
      });
      const tx = txResponse.data.result;
      if (!tx) {
        return { success: false, error: 'Transaction non trouvee' };
      }
      return {
        success: true,
        addresses: [{
          address: tx.to,
          amount: parseInt(tx.value, 16) / 1e18,
        }],
      };
    }

    if (config.api_type === 'solana') {
      const rpcUrl = config.api_url || 'https://api.mainnet-beta.solana.com';
      const rpcResponse = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [txHash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
      });
      const tx = rpcResponse.data.result;
      if (!tx) {
        return { success: false, error: 'Transaction non trouvee' };
      }
      const accountKeys = tx.transaction.message.accountKeys;
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;
      const addresses = [];
      for (let i = 0; i < accountKeys.length; i++) {
        const address = typeof accountKeys[i] === 'string'
          ? accountKeys[i]
          : accountKeys[i].pubkey;
        const diff = (postBalances[i] - preBalances[i]) / 1e9;
        if (diff > 0) {
          addresses.push({ address, amount: diff });
        }
      }
      return { success: true, addresses };
    }

    return {
      success: false,
      error: `Recuperation des outputs non supportee pour ${config.name}`,
    };
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
