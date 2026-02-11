import { useState } from 'react';

export default function ManualInput({ onSubmit, initialData }) {
  const [assetSymbol, setAssetSymbol] = useState(initialData.assetSymbol || '');
  const [assetName, setAssetName] = useState(initialData.assetName || '');
  const [assetType, setAssetType] = useState('crypto');
  const [transactionDate, setTransactionDate] = useState(initialData.date || '');
  const [priceAtPurchase, setPriceAtPurchase] = useState(initialData.price || '');
  const [quantityPurchased, setQuantityPurchased] = useState(initialData.quantity || '');
  const [amountInvested, setAmountInvested] = useState(initialData.amount || '');
  const [transactionFees, setTransactionFees] = useState(initialData.fees || '0');
  const [errors, setErrors] = useState({});

  // Auto-calcul du montant total
  const handlePriceOrQuantityChange = (price, quantity) => {
    if (price && quantity) {
      const computed = (parseFloat(price) * parseFloat(quantity)).toFixed(2);
      setAmountInvested(computed);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!assetSymbol.trim()) newErrors.assetSymbol = 'Symbole requis';
    if (!transactionDate) newErrors.transactionDate = 'Date requise';
    if (!priceAtPurchase || parseFloat(priceAtPurchase) <= 0) newErrors.priceAtPurchase = 'Prix invalide';
    if (!quantityPurchased || parseFloat(quantityPurchased) <= 0) newErrors.quantityPurchased = 'Quantite invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      assetSymbol: assetSymbol.toUpperCase(),
      assetName: assetName || assetSymbol.toUpperCase(),
      assetType,
      date: transactionDate,
      price: parseFloat(priceAtPurchase),
      quantity: parseFloat(quantityPurchased),
      amount: parseFloat(amountInvested) || (parseFloat(priceAtPurchase) * parseFloat(quantityPurchased)),
      fees: parseFloat(transactionFees) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Saisie manuelle
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Entrez les details de votre transaction
        </p>
      </div>

      {/* Symbole + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Symbole *
          </label>
          <input
            type="text"
            value={assetSymbol}
            onChange={(e) => setAssetSymbol(e.target.value.toUpperCase())}
            placeholder="BTC, ETH, AAPL..."
            className={`w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      ${errors.assetSymbol ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.assetSymbol && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assetSymbol}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nom (optionnel)
          </label>
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Bitcoin, Apple..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Type + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type d'actif
          </label>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="crypto">Crypto</option>
            <option value="traditional">Traditionnel (action, indice)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date de transaction *
          </label>
          <input
            type="datetime-local"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      ${errors.transactionDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.transactionDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.transactionDate}</p>
          )}
        </div>
      </div>

      {/* Prix + Quantite */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prix unitaire (EUR) *
          </label>
          <input
            type="number"
            step="any"
            value={priceAtPurchase}
            onChange={(e) => {
              setPriceAtPurchase(e.target.value);
              handlePriceOrQuantityChange(e.target.value, quantityPurchased);
            }}
            placeholder="0.00"
            className={`w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      ${errors.priceAtPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.priceAtPurchase && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priceAtPurchase}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantite *
          </label>
          <input
            type="number"
            step="any"
            value={quantityPurchased}
            onChange={(e) => {
              setQuantityPurchased(e.target.value);
              handlePriceOrQuantityChange(priceAtPurchase, e.target.value);
            }}
            placeholder="0.00000000"
            className={`w-full border rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      ${errors.quantityPurchased ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.quantityPurchased && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantityPurchased}</p>
          )}
        </div>
      </div>

      {/* Montant + Frais */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Montant total investi (EUR)
          </label>
          <input
            type="number"
            step="any"
            value={amountInvested}
            onChange={(e) => setAmountInvested(e.target.value)}
            placeholder="Calcule automatiquement"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Calcule auto depuis prix x quantite
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frais de transaction
          </label>
          <input
            type="number"
            step="any"
            value={transactionFees}
            onChange={(e) => setTransactionFees(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white
                 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        Continuer vers la confirmation
        <span className="text-xl">&rarr;</span>
      </button>
    </form>
  );
}
