import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from './StepIndicator';
import TypeSelection from './TypeSelection';
import BlockchainHashInput from './BlockchainHashInput';
import ManualInput from './ManualInput';
import TransactionPreview from './TransactionPreview';
import LedgerGuide from './LedgerGuide';
import api, { createTransaction } from '../../services/api';

export default function AddTransactionWizard() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [transactionType, setTransactionType] = useState(null); // 'blockchain' ou 'manual'
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

  const steps = [
    { number: 1, title: 'Type' },
    { number: 2, title: transactionType === 'blockchain' ? 'Hash' : 'Details' },
    { number: 3, title: 'Confirmation' },
  ];

  // STEP 1: Selection du type
  const handleTypeSelection = (type) => {
    setTransactionType(type);
    setCurrentStep(2);
    setError(null);
  };

  // STEP 2a: Validation du hash blockchain (avec adresse de reception optionnelle)
  const handleHashValidation = async (blockchain, txHash, recipientAddress = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/blockchain/validate', {
        txHash: txHash.trim(),
        blockchain,
        recipientAddress: recipientAddress?.trim() || null,
      });

      if (response.data.success) {
        const d = response.data.data;
        setTxDetails(d);

        // Convertir les frais crypto en EUR (frais * prix unitaire)
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
        setCurrentStep(3);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation de la transaction');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2b: Saisie manuelle
  const handleManualInput = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  // STEP 3: Confirmation et sauvegarde
  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const isBlockchainSource = transactionType === 'blockchain';

      // Pour les transactions blockchain :
      // - amount_invested = montant reellement paye (source de verite)
      // - transaction_fees = 0 (les frais sont inclus dans le montant paye)
      // Pour les transactions manuelles :
      // - amount_invested = montant saisi par l'utilisateur
      // - transaction_fees = frais saisis separement
      const payload = {
        asset_symbol: formData.assetSymbol,
        asset_name: formData.assetName || formData.assetSymbol,
        asset_type: formData.assetType || 'crypto',
        transaction_hash: formData.txHash || null,
        blockchain: formData.blockchain || null,
        transaction_date: formData.date,
        amount_invested: isBlockchainSource
          ? (parseFloat(formData.amountPaid) || parseFloat(formData.amount) || 0)
          : (parseFloat(formData.amount) || (parseFloat(formData.price) * parseFloat(formData.quantity))),
        price_at_purchase: parseFloat(formData.price) || 0,
        quantity_purchased: parseFloat(formData.quantity),
        transaction_fees: isBlockchainSource ? 0 : parseFloat(formData.fees || 0),
        source: isBlockchainSource ? 'blockchain' : 'manual',
      };

      await createTransaction(payload);

      navigate('/', {
        state: { message: 'Transaction ajoutee avec succes !' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement de la transaction');
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
    }
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
            {error}
          </div>
        )}

        {/* Step 1: Type Selection */}
        {currentStep === 1 && (
          <TypeSelection
            onSelect={handleTypeSelection}
            onShowLedgerGuide={() => setShowLedgerGuide(true)}
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
          />
        )}

        {/* Step 3: Preview & Confirm */}
        {currentStep === 3 && (
          <TransactionPreview
            data={formData}
            txDetails={txDetails}
            onConfirm={handleConfirm}
            onEdit={() => setCurrentStep(2)}
            onDataChange={handleDataChange}
            loading={loading}
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
