import { useState } from 'react';
import { formatCurrency, formatQuantity } from '../../utils/calculations';
import PriceDifferenceHelp from './PriceDifferenceHelp';

const CRYPTO_ICONS = {
  BTC: '\u20bf',
  ETH: '\u27e0',
  BNB: '\u25c7',
  SOL: '\u25ce',
  MATIC: '\u2b21',
};

function getCryptoIcon(symbol) {
  return CRYPTO_ICONS[symbol] || '\u25cf';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimestampUTC(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function formatDebugNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  return typeof num === 'number' ? num.toFixed(8) : String(num);
}

export default function TransactionPreview({ data, txDetails, onConfirm, onEdit, onDataChange, loading }) {
  const [showDebug, setShowDebug] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPrice, setEditedPrice] = useState(String(data.price || ''));
  // Montant reellement paye par l'utilisateur (source de verite comptable)
  const [amountPaid, setAmountPaid] = useState(String(data.amountPaid || data.amount || ''));

  const isBlockchain = !!data.txHash;
  // Valeur estimee on-chain (informative) = quantite x prix spot
  const estimatedOnchainValue = parseFloat(data.quantity || 0) * parseFloat(data.price || 0);
  const feesEur = parseFloat(data.fees || 0);
  const amountPaidNum = parseFloat(amountPaid || 0);
  // Ecart entre montant paye et valeur on-chain estimee
  const spread = isBlockchain && estimatedOnchainValue > 0
    ? amountPaidNum - (estimatedOnchainValue + feesEur)
    : null;

  const handlePriceChange = (value) => {
    setEditedPrice(value);
  };

  const handleSaveEdit = () => {
    const price = parseFloat(editedPrice);
    if (price > 0 && onDataChange) {
      const updates = { price, amount: price * parseFloat(data.quantity) };
      // Recalculer les frais EUR depuis les frais crypto quand le prix change
      if (data.feesCrypto > 0) {
        updates.fees = parseFloat(data.feesCrypto) * price;
      }
      onDataChange(updates);
    }
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedPrice(String(data.price || ''));
    setEditMode(false);
  };

  const handleAmountPaidChange = (value) => {
    setAmountPaid(value);
    if (onDataChange) {
      onDataChange({ amountPaid: parseFloat(value) || 0 });
    }
  };

  const debug = txDetails?.debug;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center
                      justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Verifiez les informations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Assurez-vous que toutes les donnees sont correctes avant de confirmer
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20
                    dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200
                    dark:border-indigo-800">

        {/* Asset Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-indigo-200
                      dark:border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center
                          justify-center text-2xl shadow-sm">
              {getCryptoIcon(data.assetSymbol)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.assetSymbol}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {data.assetName || data.blockchain || data.assetSymbol}
              </p>
            </div>
          </div>

          {/* Edit Mode Toggle */}
          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400
                       bg-amber-50 dark:bg-amber-900/20 border border-amber-300
                       dark:border-amber-700 rounded-lg hover:bg-amber-100
                       dark:hover:bg-amber-900/30 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Modifier le prix
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600
                         hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Valider
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                         dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </button>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailRow
            label="Quantite"
            value={`${formatQuantity(parseFloat(data.quantity))} ${data.assetSymbol}`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            }
          />

          {/* Prix d'achat (editable) */}
          <div>
            <div className="flex items-start gap-3">
              <div className="text-indigo-600 dark:text-indigo-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Prix d'achat
                  {editMode && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      (modifiable)
                    </span>
                  )}
                </p>
                {editMode ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={editedPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full px-3 py-2 text-lg font-semibold border-2 border-amber-400
                               dark:border-amber-600 rounded-lg bg-amber-50 dark:bg-amber-900/20
                               text-gray-900 dark:text-gray-100
                               focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm
                                    text-gray-400">EUR</span>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {data.price ? formatCurrency(parseFloat(data.price)) : 'Non disponible'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Valeur estimee on-chain (informative) */}
          {isBlockchain && (
            <div>
              <div className="flex items-start gap-3">
                <div className="text-gray-400 dark:text-gray-500 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Valeur estimee on-chain
                    <span className="ml-1 text-xs">(qty x prix spot)</span>
                  </p>
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                    {formatCurrency(estimatedOnchainValue)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Montant reellement paye - SOURCE DE VERITE */}
          <div className={isBlockchain ? 'md:col-span-2' : 'md:col-span-2'}>
            <div className="flex items-start gap-3">
              <div className="text-green-600 dark:text-green-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 font-medium">
                  Montant reellement paye (EUR)
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    className="w-full px-3 py-2 text-2xl font-bold border-2 border-green-400
                             dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20
                             text-green-700 dark:text-green-400
                             focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">EUR</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Saisissez le montant exact que vous avez paye (virement, CB, etc.)
                </p>
                {spread !== null && Math.abs(spread) > 0.01 && (
                  <p className={`text-xs mt-1 font-medium ${
                    Math.abs(spread) < amountPaidNum * 0.05
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    Ecart avec la valeur on-chain : {spread > 0 ? '+' : ''}{formatCurrency(spread)}
                    {' '}({((spread / (estimatedOnchainValue + feesEur)) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-3">
              <div className="text-indigo-600 dark:text-indigo-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frais de transaction</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(parseFloat(data.fees || 0))}
                </p>
                {data.feesCrypto > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatQuantity(parseFloat(data.feesCrypto))} {data.assetSymbol}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DetailRow
            label="Date"
            value={formatDate(data.date)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          />

          {data.blockchain && (
            <DetailRow
              label="Blockchain"
              value={data.blockchain}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              }
            />
          )}
        </div>

        {/* Edit mode info banner */}
        {editMode && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300
                        dark:border-amber-700 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Mode edition active
                </h5>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Corrigez le prix spot de reference si necessaire.
                  La valeur estimee on-chain sera recalculee. Le montant reellement paye n'est pas affecte.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recipient Address */}
        {data.recipientAddress && (
          <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Adresse de reception
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-xs
                          break-all text-gray-700 dark:text-gray-300">
              {data.recipientAddress}
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {data.txHash && (
          <div className={`${data.recipientAddress ? 'mt-4' : 'mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-800'}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Hash de Transaction
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-xs
                          break-all text-gray-700 dark:text-gray-300">
              {data.txHash}
            </div>
          </div>
        )}

        {/* Multi-output info */}
        {txDetails?.totalOutputs > 1 && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Cette transaction avait {txDetails.totalOutputs} destinations.
              Seul le montant recu sur votre adresse ({txDetails.relevantOutputs} output{txDetails.relevantOutputs > 1 ? 's' : ''}) est comptabilise.
            </p>
          </div>
        )}

        {/* Blockchain Confirmations */}
        {txDetails?.confirmations && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">
              {txDetails.confirmations} confirmations sur la blockchain
            </span>
          </div>
        )}
      </div>

      {/* Info banner for blockchain transactions */}
      {isBlockchain && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200
                      dark:border-blue-800/50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Le <strong>montant reellement paye</strong> est la source de verite pour vos calculs de performance.
                La valeur on-chain et les frais reseau sont affiches a titre indicatif.
              </p>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                Pourquoi les montants peuvent differer ?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Resume
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Cout d'acquisition</span>
            <span className="font-bold text-green-700 dark:text-green-400 text-base">
              {formatCurrency(amountPaidNum)}
            </span>
          </div>
          {isBlockchain && estimatedOnchainValue > 0 && (
            <>
              <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                <span>Valeur on-chain (qty x prix spot)</span>
                <span>{formatCurrency(estimatedOnchainValue)}</span>
              </div>
              {feesEur > 0 && (
                <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                  <span>Frais reseau estimes</span>
                  <span>{formatCurrency(feesEur)}</span>
                </div>
              )}
              {spread !== null && Math.abs(spread) > 0.01 && (
                <div className="flex justify-between items-center text-gray-400 dark:text-gray-500 italic">
                  <span>Ecart (spread / commission exchange)</span>
                  <span>{spread > 0 ? '+' : ''}{formatCurrency(spread)}</span>
                </div>
              )}
            </>
          )}
          {!isBlockchain && feesEur > 0 && (
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span>dont frais</span>
              <span>{formatCurrency(feesEur)}</span>
            </div>
          )}
          {parseFloat(data.quantity) > 0 && amountPaidNum > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Prix effectif par unite</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(amountPaidNum / parseFloat(data.quantity))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Debug Section Toggle */}
      {debug && (
        <button
          type="button"
          onClick={() => setShowDebug(!showDebug)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm
                   text-gray-500 dark:text-gray-400 hover:text-gray-700
                   dark:hover:text-gray-300 transition-colors rounded-lg
                   border border-dashed border-gray-300 dark:border-gray-600
                   hover:border-gray-400 dark:hover:border-gray-500"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            Mode debug - Details du calcul
          </div>
          <svg className={`w-4 h-4 transition-transform ${showDebug ? 'rotate-180' : ''}`}
               fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Debug Panel */}
      {showDebug && debug && (
        <div className="bg-gray-900 rounded-xl p-5 text-sm font-mono overflow-x-auto
                      border border-gray-700">
          <h4 className="text-green-400 font-bold mb-4 text-xs uppercase tracking-wider">
            // Donnees de debug - Calcul du montant
          </h4>

          {/* Raw blockchain data */}
          <div className="mb-4">
            <p className="text-gray-500 text-xs mb-2">// Donnees brutes blockchain</p>
            <div className="space-y-1 text-gray-300">
              <p>
                <span className="text-purple-400">timestamp_bloc</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">{formatTimestampUTC(data.date)}</span>
              </p>
              <p>
                <span className="text-purple-400">heure_locale</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">{formatDate(data.date)}</span>
              </p>
              <p>
                <span className="text-purple-400">quantite_brute</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">{formatDebugNumber(debug.quantityRaw)}</span>
                <span className="text-gray-500"> {data.assetSymbol}</span>
              </p>
              <p>
                <span className="text-purple-400">frais_bruts</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">{formatDebugNumber(debug.feesRaw)}</span>
                <span className="text-gray-500"> {data.assetSymbol}</span>
              </p>
            </div>
            <p className="text-gray-600 text-xs mt-2 italic">
              Note : l'heure correspond a la validation du bloc, pas a la soumission de la transaction.
              Un ecart de quelques secondes/minutes avec Ledger Live est normal.
            </p>
          </div>

          {/* Price sources */}
          <div className="mb-4">
            <p className="text-gray-500 text-xs mb-2">// Sources de prix (EUR) - par precision</p>
            <div className="space-y-1 text-gray-300">
              {[
                { name: 'Binance', key: 'binance', desc: '1 min' },
                { name: 'CryptoCompare', key: 'cryptocompare', desc: 'horaire' },
                { name: 'CoinGecko', key: 'coingecko', desc: 'range' },
              ].map(({ name, key, desc }) => {
                const price = debug.priceSources?.sources?.[key];
                const isUsed = debug.calculation?.priceSource === key;
                return (
                  <p key={key}>
                    <span className="text-blue-400">{name}</span>
                    <span className="text-gray-600 text-xs"> ({desc})</span>
                    <span className="text-gray-500"> = </span>
                    <span className={price ? 'text-green-400' : 'text-red-400'}>
                      {price ? `${price.toFixed(2)} EUR` : 'indisponible'}
                    </span>
                    {isUsed && <span className="text-cyan-400 text-xs ml-2">&#x2190; utilise</span>}
                  </p>
                );
              })}
              <p>
                <span className="text-blue-400">Moyenne</span>
                <span className="text-gray-500"> = </span>
                <span className="text-cyan-400">
                  {debug.priceSources?.average
                    ? `${debug.priceSources.average.toFixed(2)} EUR`
                    : 'N/A'}
                </span>
                <span className="text-gray-600 text-xs ml-2">
                  ({debug.priceSources?.sourcesCount || 0} source{(debug.priceSources?.sourcesCount || 0) > 1 ? 's' : ''})
                </span>
              </p>
            </div>
          </div>

          {/* Calculation breakdown */}
          <div className="mb-2">
            <p className="text-gray-500 text-xs mb-2">
              // Detail du calcul (prix {debug.calculation?.priceSource || 'meilleure source'})
            </p>
            <div className="space-y-1 text-gray-300">
              <p>
                <span className="text-purple-400">quantite</span>
                <span className="text-gray-500"> x </span>
                <span className="text-purple-400">prix</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">
                  {formatDebugNumber(debug.calculation?.quantity)}
                </span>
                <span className="text-gray-500"> x </span>
                <span className="text-yellow-300">
                  {debug.calculation?.price ? debug.calculation.price.toFixed(2) : 'N/A'}
                </span>
                <span className="text-gray-500"> = </span>
                <span className="text-green-400">
                  {debug.calculation?.subtotal ? debug.calculation.subtotal.toFixed(2) : 'N/A'} EUR
                </span>
              </p>
              <p>
                <span className="text-purple-400">frais_en_eur</span>
                <span className="text-gray-500"> = </span>
                <span className="text-yellow-300">
                  {formatDebugNumber(debug.calculation?.fees)}
                </span>
                <span className="text-gray-500"> x </span>
                <span className="text-yellow-300">
                  {debug.calculation?.price ? debug.calculation.price.toFixed(2) : 'N/A'}
                </span>
                <span className="text-gray-500"> = </span>
                <span className="text-orange-400">
                  {debug.calculation?.feesInEur ? debug.calculation.feesInEur.toFixed(2) : 'N/A'} EUR
                </span>
              </p>
              <div className="border-t border-gray-700 pt-1 mt-1">
                <p>
                  <span className="text-white font-bold">total</span>
                  <span className="text-gray-500"> = </span>
                  <span className="text-green-400">
                    {debug.calculation?.subtotal ? debug.calculation.subtotal.toFixed(2) : '?'}
                  </span>
                  <span className="text-gray-500"> + </span>
                  <span className="text-orange-400">
                    {debug.calculation?.feesInEur ? debug.calculation.feesInEur.toFixed(2) : '?'}
                  </span>
                  <span className="text-gray-500"> = </span>
                  <span className="text-white font-bold text-base">
                    {debug.calculation?.total ? debug.calculation.total.toFixed(2) : 'N/A'} EUR
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Value used by the app */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <p className="text-gray-500 text-xs mb-1">// Valeur retenue par l'application</p>
            <p className="text-gray-300">
              <span className="text-white font-bold">montant_paye</span>
              <span className="text-gray-500"> = </span>
              <span className="text-green-400 font-bold">
                {amountPaid ? parseFloat(amountPaid).toFixed(2) : 'N/A'} EUR
              </span>
              <span className="text-gray-600"> (saisi par l'utilisateur - source de verite)</span>
            </p>
            <p className="text-gray-300 mt-1">
              <span className="text-gray-400">valeur_onchain</span>
              <span className="text-gray-500"> = </span>
              <span className="text-yellow-300">
                {estimatedOnchainValue ? estimatedOnchainValue.toFixed(2) : 'N/A'} EUR
              </span>
              <span className="text-gray-600"> (quantite x prix {debug?.calculation?.priceSource || 'API'}, informatif)</span>
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onEdit}
          disabled={loading}
          className="flex-1 py-3 px-6 border-2 border-gray-300 dark:border-gray-600
                   text-gray-700 dark:text-gray-300 font-semibold rounded-lg
                   hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &larr; Modifier
        </button>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white
                   font-semibold rounded-lg transition-colors
                   disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Enregistrement...
            </>
          ) : (
            <>
              Confirmer et Ajouter
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Price Difference Help Modal */}
      {showHelp && (
        <PriceDifferenceHelp onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

function DetailRow({ label, value, icon, highlight = false }) {
  return (
    <div className={highlight ? 'md:col-span-2' : ''}>
      <div className="flex items-start gap-3">
        <div className="text-indigo-600 dark:text-indigo-400 mt-0.5">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className={`font-semibold ${
            highlight
              ? 'text-2xl text-indigo-600 dark:text-indigo-400'
              : 'text-lg text-gray-900 dark:text-gray-100'
          }`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
