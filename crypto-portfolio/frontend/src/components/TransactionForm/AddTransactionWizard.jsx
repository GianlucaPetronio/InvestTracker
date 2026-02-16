import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from './StepIndicator';
import TypeSelection from './TypeSelection';
import BlockchainHashInput from './BlockchainHashInput';
import ManualInput from './ManualInput';
import TransactionPreview from './TransactionPreview';
import LedgerGuide from './LedgerGuide';
import api, { createTransaction, createTransactionsBulk } from '../../services/api';
import { formatCurrency, formatQuantity } from '../../utils/calculations';

export default function AddTransactionWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [transactionType, setTransactionType] = useState(null); // 'blockchain' ou 'manual'
  const [buyOrSell, setBuyOrSell] = useState('buy'); // 'buy' ou 'sell'
  const [formData, setFormData] = useState({
    blockchain: '',
    txHash: '',
    assetSymbol: '',
    assetName: '',
    assetType: 'crypto',
    date: '',
    quantity: '',
    price: '',
    amount: '',
    amountPaid: '',
    fees: 0,
  });
  const [txDetails, setTxDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLedgerGuide, setShowLedgerGuide] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Multi-hash: array of validated transactions (when > 1 hash)
  const [multiTxResults, setMultiTxResults] = useState(null);
  // Progression de la validation multi-hash
  const [validationProgress, setValidationProgress] = useState(null);

  const steps = [
    { number: 1, title: 'Type' },
    { number: 2, title: transactionType === 'blockchain' ? 'Hash' : 'Details' },
    { number: 3, title: 'Confirmation' },
  ];

  const resetWizard = () => {
    setCurrentStep(1);
    setTransactionType(null);
    setBuyOrSell('buy');
    setFormData({
      blockchain: '',
      txHash: '',
      assetSymbol: '',
      assetName: '',
      assetType: 'crypto',
      date: '',
      quantity: '',
      price: '',
      amount: '',
      amountPaid: '',
      fees: 0,
    });
    setTxDetails(null);
    setError(null);
    setSuccessData(null);
    setMultiTxResults(null);
    setValidationProgress(null);
  };

  // STEP 1: Selection du type
  const handleTypeSelection = (type) => {
    setTransactionType(type);
    setCurrentStep(2);
    setError(null);
  };

  // STEP 2a: Validation du hash blockchain (supporte un array de hashes)
  const handleHashValidation = async (blockchain, txHashes, recipientAddress = null) => {
    setLoading(true);
    setError(null);

    // Single hash: comportement original
    if (txHashes.length === 1) {
      const txHash = txHashes[0];
      try {
        const response = await api.post('/blockchain/validate', {
          txHash: txHash.trim(),
          blockchain,
          recipientAddress: recipientAddress?.trim() || null,
        });

        if (response.data.success) {
          const d = response.data.data;
          setTxDetails(d);

          const feesInEur = d.priceAtTime && d.fees
            ? d.fees * d.priceAtTime
            : 0;

          setFormData(prev => ({
            ...prev,
            blockchain,
            txHash,
            recipientAddress: recipientAddress || '',
            assetSymbol: d.assetSymbol || blockchain,
            date: d.date,
            quantity: d.quantity,
            price: d.priceAtTime,
            amount: d.estimatedValue,
            amountPaid: (d.estimatedValue || 0) + feesInEur,
            fees: feesInEur,
            feesCrypto: d.fees,
          }));
          setMultiTxResults(null);
          setCurrentStep(3);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la validation de la transaction');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Multiple hashes: valider chacun sequentiellement
    const results = [];
    const errors = [];
    setValidationProgress({ current: 0, total: txHashes.length });

    for (let i = 0; i < txHashes.length; i++) {
      setValidationProgress({ current: i + 1, total: txHashes.length });
      try {
        const response = await api.post('/blockchain/validate', {
          txHash: txHashes[i].trim(),
          blockchain,
          recipientAddress: recipientAddress?.trim() || null,
        });

        if (response.data.success) {
          const d = response.data.data;
          const feesInEur = d.priceAtTime && d.fees
            ? d.fees * d.priceAtTime
            : 0;

          results.push({
            txHash: txHashes[i],
            blockchain,
            recipientAddress: recipientAddress || '',
            assetSymbol: d.assetSymbol || blockchain,
            date: d.date,
            quantity: d.quantity,
            price: d.priceAtTime,
            amount: d.estimatedValue,
            amountPaid: (d.estimatedValue || 0) + feesInEur,
            fees: feesInEur,
            feesCrypto: d.fees,
          });
        } else {
          errors.push(`Hash #${i + 1} : ${response.data.message}`);
        }
      } catch (err) {
        errors.push(`Hash #${i + 1} : ${err.response?.data?.message || 'Erreur de validation'}`);
      }
    }

    setValidationProgress(null);
    setLoading(false);

    if (results.length === 0) {
      setError(errors.join('\n'));
      return;
    }

    if (errors.length > 0) {
      setError(`${results.length}/${txHashes.length} transactions validees. Erreurs : ${errors.join(' ; ')}`);
    }

    setMultiTxResults(results);
    setCurrentStep(3);
  };

  // STEP 2b: Saisie manuelle
  const handleManualInput = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setMultiTxResults(null);
    setCurrentStep(3);
  };

  // STEP 3: Confirmation et sauvegarde (single)
  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const isBlockchainSource = transactionType === 'blockchain';

      const payload = {
        asset_symbol: formData.assetSymbol,
        asset_name: formData.assetName || formData.assetSymbol,
        asset_type: formData.assetType || 'crypto',
        transaction_hash: formData.txHash || null,
        blockchain: formData.blockchain || null,
        transaction_date: formData.date,
        amount_invested: parseFloat(formData.amount) || (parseFloat(formData.price) * parseFloat(formData.quantity)),
        price_at_purchase: parseFloat(formData.price) || 0,
        quantity_purchased: parseFloat(formData.quantity),
        transaction_fees: isBlockchainSource && formData.feesCrypto
          ? parseFloat(formData.feesCrypto) * (parseFloat(formData.price) || 0)
          : parseFloat(formData.fees || 0),
        source: isBlockchainSource ? 'blockchain' : 'manual',
        transaction_type: buyOrSell,
      };

      await createTransaction(payload);
      setSuccessData({
        quantity: payload.quantity_purchased,
        symbol: payload.asset_symbol,
        count: 1,
      });
    } catch (err) {
      const errorDetail = err.response?.data?.error
        || err.response?.data?.details
        || err.message;
      const errorCode = err.response?.data?.code;

      setError(
        errorCode
          ? `${errorDetail} (code: ${errorCode})`
          : errorDetail
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Confirmation multi-hash (bulk)
  const handleConfirmMulti = async () => {
    setLoading(true);
    setError(null);

    try {
      const payloads = multiTxResults.map(tx => ({
        asset_symbol: tx.assetSymbol,
        asset_name: tx.assetSymbol,
        asset_type: 'crypto',
        transaction_hash: tx.txHash,
        blockchain: tx.blockchain,
        transaction_date: tx.date,
        amount_invested: parseFloat(tx.amount) || (parseFloat(tx.price) * parseFloat(tx.quantity)),
        price_at_purchase: parseFloat(tx.price) || 0,
        quantity_purchased: parseFloat(tx.quantity),
        transaction_fees: tx.feesCrypto
          ? parseFloat(tx.feesCrypto) * (parseFloat(tx.price) || 0)
          : parseFloat(tx.fees || 0),
        source: 'blockchain',
        transaction_type: buyOrSell,
      }));

      const response = await createTransactionsBulk(payloads);
      setSuccessData({
        symbol: multiTxResults[0]?.assetSymbol || '',
        count: response.data.count,
      });
    } catch (err) {
      const errorDetail = err.response?.data?.error || err.message;
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  // Callback pour mettre a jour les donnees depuis TransactionPreview (edition prix/montant)
  const handleDataChange = (updatedFields) => {
    setFormData(prev => ({ ...prev, ...updatedFields }));
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/');
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setTransactionType(null);
      setError(null);
    } else {
      setCurrentStep(2);
      setError(null);
      setMultiTxResults(null);
    }
  };

  // Success screen
  if (successData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200
                      dark:border-gray-700 mt-8">
          <div className="text-center space-y-6">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                          flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {successData.count > 1 ? 'Transactions ajoutees !' : 'Transaction ajoutee !'}
            </h2>

            <p className="text-gray-600 dark:text-gray-400">
              {successData.count > 1
                ? `${successData.count} transactions ${successData.symbol} enregistrees avec succes.`
                : `${successData.quantity} ${successData.symbol} enregistre avec succes.`
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={resetWizard}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white
                         font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter une autre transaction
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700
                         dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                         font-semibold rounded-lg transition-colors"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-transaction preview (step 3 with multiple hashes)
  const renderMultiPreview = () => {
    const totalQuantity = multiTxResults.reduce((sum, tx) => sum + parseFloat(tx.quantity || 0), 0);
    const totalAmount = multiTxResults.reduce((sum, tx) => sum + parseFloat(tx.amountPaid || tx.amount || 0), 0);
    const totalFees = multiTxResults.reduce((sum, tx) => sum + parseFloat(tx.fees || 0), 0);

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
            {multiTxResults.length} transactions trouvees
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verifiez le resume avant de confirmer
          </p>
        </div>

        {/* Transactions table */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20
                      dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200
                      dark:border-indigo-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-indigo-200
                             dark:border-indigo-700">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Symbole</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium text-right">Quantite</th>
                  <th className="pb-3 pr-4 font-medium text-right">Prix</th>
                  <th className="pb-3 pr-4 font-medium text-right">Frais</th>
                  <th className="pb-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {multiTxResults.map((tx, i) => (
                  <tr key={i} className="border-b border-indigo-100 dark:border-indigo-800/50">
                    <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                      {tx.assetSymbol}
                    </td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-gray-900 dark:text-gray-100">
                      {tx.quantity != null ? formatQuantity(parseFloat(tx.quantity)) : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-700 dark:text-gray-300">
                      {tx.price != null ? formatCurrency(parseFloat(tx.price)) : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-500 dark:text-gray-400">
                      {formatCurrency(parseFloat(tx.fees || 0))}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(parseFloat(tx.amountPaid || tx.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-indigo-300 dark:border-indigo-600 font-bold">
                  <td colSpan={3} className="pt-4 text-gray-900 dark:text-gray-100">
                    Total
                  </td>
                  <td className="pt-4 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatQuantity(totalQuantity)}
                  </td>
                  <td className="pt-4"></td>
                  <td className="pt-4 text-right text-gray-500 dark:text-gray-400">
                    {formatCurrency(totalFees)}
                  </td>
                  <td className="pt-4 text-right text-indigo-600 dark:text-indigo-400 text-base">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Hashes */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hashes de transaction
          </p>
          <div className="space-y-1">
            {multiTxResults.map((tx, i) => (
              <p key={i} className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
                {i + 1}. {tx.txHash}
              </p>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex-1 py-3 px-6 border-2 border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 font-semibold rounded-lg
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &larr; Modifier
          </button>

          <button
            onClick={handleConfirmMulti}
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
                Confirmer {multiTxResults.length} transactions
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900
                   dark:hover:text-gray-200 mb-4 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {currentStep === 1 ? 'Retour au dashboard' : "Retour a l'etape precedente"}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Ajouter une transaction
        </h1>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200
                    dark:border-gray-700 mt-8">

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200
                        dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg
                        flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {/* Validation Progress */}
        {validationProgress && (
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200
                        dark:border-indigo-800 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
              <span className="text-indigo-700 dark:text-indigo-300 text-sm">
                Validation du hash {validationProgress.current}/{validationProgress.total}...
              </span>
            </div>
            <div className="mt-2 bg-indigo-200 dark:bg-indigo-800 rounded-full h-2">
              <div
                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all"
                style={{ width: `${(validationProgress.current / validationProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Type Selection */}
        {currentStep === 1 && (
          <TypeSelection
            onSelect={handleTypeSelection}
            onShowLedgerGuide={() => setShowLedgerGuide(true)}
            transactionType={buyOrSell}
            onTransactionTypeChange={setBuyOrSell}
          />
        )}

        {/* Step 2a: Blockchain Hash Input */}
        {currentStep === 2 && transactionType === 'blockchain' && (
          <BlockchainHashInput
            onValidate={handleHashValidation}
            loading={loading}
            onShowLedgerGuide={() => setShowLedgerGuide(true)}
          />
        )}

        {/* Step 2b: Manual Input */}
        {currentStep === 2 && transactionType === 'manual' && (
          <ManualInput
            onSubmit={handleManualInput}
            initialData={formData}
            transactionType={buyOrSell}
          />
        )}

        {/* Step 3: Preview & Confirm - Multi transactions */}
        {currentStep === 3 && multiTxResults && multiTxResults.length > 0 && (
          renderMultiPreview()
        )}

        {/* Step 3: Preview & Confirm - Single transaction */}
        {currentStep === 3 && !multiTxResults && (
          <TransactionPreview
            data={formData}
            txDetails={txDetails}
            onConfirm={handleConfirm}
            onEdit={() => setCurrentStep(2)}
            onDataChange={handleDataChange}
            loading={loading}
            transactionType={buyOrSell}
          />
        )}
      </div>

      {/* Ledger Guide Modal */}
      {showLedgerGuide && (
        <LedgerGuide onClose={() => setShowLedgerGuide(false)} />
      )}
    </div>
  );
}
