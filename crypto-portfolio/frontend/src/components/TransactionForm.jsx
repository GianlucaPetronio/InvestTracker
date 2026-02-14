import { useState } from 'react';
import { createTransaction, verifyBlockchainTx } from '../services/api';
import TransactionPreview from './TransactionPreview';

function TransactionForm() {
  // Mode: 'crypto' (via hash blockchain) ou 'manual' (saisie manuelle)
  const [mode, setMode] = useState('crypto');

  // Champs communs
  const [assetSymbol, setAssetSymbol] = useState('');
  const [assetName, setAssetName] = useState('');

  // Champs mode crypto
  const [blockchain, setBlockchain] = useState('ETH');
  const [txHash, setTxHash] = useState('');
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  // Champs mode manuel
  const [assetType, setAssetType] = useState('crypto');
  const [transactionDate, setTransactionDate] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [priceAtPurchase, setPriceAtPurchase] = useState('');
  const [quantityPurchased, setQuantityPurchased] = useState('');
  const [transactionFees, setTransactionFees] = useState('0');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Vérifier le hash blockchain et afficher la prévisualisation
  async function handleVerify(e) {
    e.preventDefault();
    setVerifying(true);
    setMessage(null);
    setPreview(null);

    try {
      const response = await verifyBlockchainTx(txHash, blockchain);
      setPreview(response.data);
      const d = response.data;
      const feesEur = d.priceAtTime && d.fees ? d.fees * d.priceAtTime : 0;
      setAmountPaid(d.calculatedValue ? String(d.calculatedValue + feesEur) : '');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la vérification',
      });
    } finally {
      setVerifying(false);
    }
  }

  // Confirmer et enregistrer la transaction blockchain
  async function handleConfirmBlockchain() {
    if (!preview) return;
    setSubmitting(true);
    setMessage(null);

    try {
      await createTransaction({
        asset_symbol: preview.assetSymbol,
        asset_name: assetName || preview.assetSymbol,
        asset_type: 'crypto',
        transaction_hash: preview.hash,
        blockchain: preview.blockchain,
        transaction_date: preview.timestamp,
        amount_invested: parseFloat(amountPaid) || preview.calculatedValue,
        price_at_purchase: preview.priceAtTime || 0,
        quantity_purchased: preview.quantity,
        transaction_fees: preview.priceAtTime && preview.fees ? preview.fees * preview.priceAtTime : 0,
        source: 'blockchain',
      });

      setMessage({ type: 'success', text: 'Transaction ajoutee avec succes !' });
      resetForm();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de l\'enregistrement',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Soumettre une transaction manuelle
  async function handleManualSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await createTransaction({
        asset_symbol: assetSymbol.toUpperCase(),
        asset_name: assetName,
        asset_type: assetType,
        transaction_date: transactionDate,
        amount_invested: parseFloat(amountInvested),
        price_at_purchase: parseFloat(priceAtPurchase),
        quantity_purchased: parseFloat(quantityPurchased),
        transaction_fees: parseFloat(transactionFees) || 0,
        source: 'manual',
      });

      setMessage({ type: 'success', text: 'Transaction ajoutee avec succes !' });
      resetForm();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setMessage({
        type: 'error',
        text: errors ? errors.join(', ') : 'Erreur lors de l\'enregistrement',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setAssetSymbol('');
    setAssetName('');
    setTxHash('');
    setPreview(null);
    setAmountPaid('');
    setTransactionDate('');
    setAmountInvested('');
    setPriceAtPurchase('');
    setQuantityPurchased('');
    setTransactionFees('0');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Ajouter une transaction
      </h1>

      {/* Toggle de mode */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
        <button
          onClick={() => { setMode('crypto'); setPreview(null); setMessage(null); }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'crypto'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Crypto (via hash)
        </button>
        <button
          onClick={() => { setMode('manual'); setPreview(null); setMessage(null); }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Saisie manuelle
        </button>
      </div>

      {/* Message de feedback */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* ================================================================= */}
      {/* Mode Crypto : vérification via hash blockchain                     */}
      {/* ================================================================= */}
      {mode === 'crypto' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blockchain
            </label>
            <select
              value={blockchain}
              onChange={(e) => setBlockchain(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BSC">Binance Smart Chain (BSC)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hash de transaction
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value.trim())}
              placeholder="0x... ou hash Bitcoin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'actif (optionnel)
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Ex: Ethereum"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || !txHash}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? 'Verification en cours...' : 'Verifier la transaction'}
          </button>
        </form>
      )}

      {/* Prévisualisation des données blockchain */}
      {preview && (
        <div className="mt-6">
          <TransactionPreview
            data={preview}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
          />
          <button
            onClick={handleConfirmBlockchain}
            disabled={submitting || !amountPaid}
            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Enregistrement...' : 'Confirmer et enregistrer'}
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* Mode Manuel : saisie libre pour tout type d'actif                  */}
      {/* ================================================================= */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbole
              </label>
              <input
                type="text"
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value.toUpperCase())}
                placeholder="BTC, ETH, AAPL..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Bitcoin, Apple..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'actif
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="crypto">Crypto</option>
                <option value="traditional">Traditionnel (action, indice)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de transaction
              </label>
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix unitaire (EUR)
              </label>
              <input
                type="number"
                step="any"
                value={priceAtPurchase}
                onChange={(e) => setPriceAtPurchase(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantite
              </label>
              <input
                type="number"
                step="any"
                value={quantityPurchased}
                onChange={(e) => setQuantityPurchased(e.target.value)}
                placeholder="0.00000000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant total investi (EUR)
              </label>
              <input
                type="number"
                step="any"
                value={amountInvested}
                onChange={(e) => setAmountInvested(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frais de transaction
              </label>
              <input
                type="number"
                step="any"
                value={transactionFees}
                onChange={(e) => setTransactionFees(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Enregistrement...' : 'Ajouter la transaction'}
          </button>
        </form>
      )}
    </div>
  );
}

export default TransactionForm;
