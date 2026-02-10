// =============================================================================
// Service Blockchain - Récupération des données de transaction on-chain
// =============================================================================
// Ce service interroge les APIs des blockchain explorers pour extraire
// les détails d'une transaction à partir de son hash.

const axios = require('axios');
const { API_CONFIG } = require('../config/apis');

// ---------------------------------------------------------------------------
// Bitcoin - via Blockchain.com API
// ---------------------------------------------------------------------------
async function getBitcoinTxDetails(txHash) {
  try {
    const url = `${API_CONFIG.bitcoin.baseUrl}/rawtx/${txHash}`;
    const response = await axios.get(url);
    const tx = response.data;

    // Calcul du montant total en sortie (en BTC, l'API retourne en satoshis)
    const totalOutputBTC = tx.out.reduce((sum, output) => sum + output.value, 0) / 1e8;
    const feeBTC = tx.fee / 1e8;

    return {
      hash: tx.hash,
      blockchain: 'BTC',
      timestamp: new Date(tx.time * 1000).toISOString(),
      confirmations: tx.block_height ? 'confirmée' : 'non confirmée',
      blockHeight: tx.block_height || null,
      quantity: totalOutputBTC,
      fees: feeBTC,
      inputs: tx.inputs.map(input => ({
        address: input.prev_out?.addr || 'coinbase',
        value: (input.prev_out?.value || 0) / 1e8,
      })),
      outputs: tx.out.map(output => ({
        address: output.addr,
        value: output.value / 1e8,
      })),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Transaction Bitcoin non trouvée');
    }
    throw new Error(`Erreur API Bitcoin: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Ethereum - via Etherscan API
// ---------------------------------------------------------------------------
async function getEthereumTxDetails(txHash) {
  try {
    const { baseUrl, apiKey } = API_CONFIG.ethereum;

    // Récupérer les détails de la transaction
    const txResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
        apikey: apiKey,
      },
    });

    const tx = txResponse.data.result;
    if (!tx) {
      throw new Error('Transaction Ethereum non trouvée');
    }

    // Récupérer le reçu pour les frais réels
    const receiptResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash,
        apikey: apiKey,
      },
    });

    const receipt = receiptResponse.data.result;

    // Conversion des valeurs hex en décimal
    const valueWei = parseInt(tx.value, 16);
    const valueETH = valueWei / 1e18;
    const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 0;
    const gasPrice = parseInt(tx.gasPrice, 16);
    const feesETH = (gasUsed * gasPrice) / 1e18;

    // Récupérer le timestamp du bloc
    let timestamp = null;
    if (tx.blockNumber) {
      const blockResponse = await axios.get(baseUrl, {
        params: {
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: tx.blockNumber,
          boolean: 'false',
          apikey: apiKey,
        },
      });
      const block = blockResponse.data.result;
      if (block) {
        timestamp = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();
      }
    }

    return {
      hash: tx.hash,
      blockchain: 'ETH',
      timestamp,
      confirmations: receipt?.status === '0x1' ? 'confirmée' : 'échouée',
      blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : null,
      from: tx.from,
      to: tx.to,
      quantity: valueETH,
      fees: feesETH,
    };
  } catch (error) {
    if (error.message.includes('non trouvée')) throw error;
    throw new Error(`Erreur API Ethereum: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// BSC (Binance Smart Chain) - via BscScan API (même format qu'Etherscan)
// ---------------------------------------------------------------------------
async function getBscTxDetails(txHash) {
  try {
    const { baseUrl, apiKey } = API_CONFIG.bsc;

    const txResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
        apikey: apiKey,
      },
    });

    const tx = txResponse.data.result;
    if (!tx) {
      throw new Error('Transaction BSC non trouvée');
    }

    const receiptResponse = await axios.get(baseUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash,
        apikey: apiKey,
      },
    });

    const receipt = receiptResponse.data.result;

    const valueWei = parseInt(tx.value, 16);
    const valueBNB = valueWei / 1e18;
    const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : 0;
    const gasPrice = parseInt(tx.gasPrice, 16);
    const feesBNB = (gasUsed * gasPrice) / 1e18;

    return {
      hash: tx.hash,
      blockchain: 'BSC',
      timestamp: null, // TODO: récupérer le timestamp du bloc comme pour ETH
      confirmations: receipt?.status === '0x1' ? 'confirmée' : 'échouée',
      blockHeight: tx.blockNumber ? parseInt(tx.blockNumber, 16) : null,
      from: tx.from,
      to: tx.to,
      quantity: valueBNB,
      fees: feesBNB,
    };
  } catch (error) {
    if (error.message.includes('non trouvée')) throw error;
    throw new Error(`Erreur API BSC: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Routeur principal - redirige vers la bonne blockchain
// ---------------------------------------------------------------------------
async function getTransactionDetails(txHash, blockchain) {
  switch (blockchain.toUpperCase()) {
    case 'BTC':
      return getBitcoinTxDetails(txHash);
    case 'ETH':
      return getEthereumTxDetails(txHash);
    case 'BSC':
      return getBscTxDetails(txHash);
    default:
      throw new Error(`Blockchain "${blockchain}" non supportée. Blockchains supportées: BTC, ETH, BSC`);
  }
}

module.exports = {
  getBitcoinTxDetails,
  getEthereumTxDetails,
  getBscTxDetails,
  getTransactionDetails,
};
