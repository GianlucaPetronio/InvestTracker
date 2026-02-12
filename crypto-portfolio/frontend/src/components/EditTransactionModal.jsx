import { useState, useEffect } from 'react';
import { updateTransaction } from '../services/api';

export default function EditTransactionModal({ transaction, onClose, onSaved }) {
  const [form, setForm] = useState({
    asset_symbol: '',
    asset_name: '',
    asset_type: 'crypto',
    transaction_date: '',
    price_at_purchase: '',
    quantity_purchased: '',
    amount_invested: '',
    transaction_fees: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transaction) return;
    const d = new Date(transaction.transaction_date);
    // Format pour datetime-local input
    const dateStr = d.getFullYear()
      + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0')
      + 'T' + String(d.getHours()).padStart(2, '0')
      + ':' + String(d.getMinutes()).padStart(2, '0');

    setForm({
      asset_symbol: transaction.asset_symbol || '',
      asset_name: transaction.asset_name || '',
      asset_type: transaction.asset_type || 'crypto',
      transaction_date: dateStr,
      price_at_purchase: transaction.price_at_purchase ?? '',
      quantity_purchased: transaction.quantity_purchased ?? '',
      amount_invested: transaction.amount_invested ?? '',
      transaction_fees: transaction.transaction_fees ?? '0',
    });
  }, [transaction]);

  function handleChange(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calcul du montant si prix et quantite changent
      if (field === 'price_at_purchase' || field === 'quantity_purchased') {
        const price = parseFloat(field === 'price_at_purchase' ? value : next.price_at_purchase);
        const qty = parseFloat(field === 'quantity_purchased' ? value : next.quantity_purchased);
        if (price > 0 && qty > 0) {
          next.amount_invested = (price * qty).toFixed(2);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateTransaction(transaction.id, {
        asset_symbol: form.asset_symbol.toUpperCase(),
        asset_name: form.asset_name || form.asset_symbol.toUpperCase(),
        asset_type: form.asset_type,
        transaction_date: form.transaction_date,
        price_at_purchase: parseFloat(form.price_at_purchase) || 0,
        quantity_purchased: parseFloat(form.quantity_purchased) || 0,
        amount_invested: parseFloat(form.amount_invested) || 0,
        transaction_fees: parseFloat(form.transaction_fees) || 0,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  }

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Modifier la transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Symbole + Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbole</label>
              <input
                type="text"
                value={form.asset_symbol}
                onChange={e => handleChange('asset_symbol', e.target.value.toUpperCase())}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
              <input
                type="text"
                value={form.asset_name}
                onChange={e => handleChange('asset_name', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={form.asset_type}
                onChange={e => handleChange('asset_type', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="crypto">Crypto</option>
                <option value="traditional">Traditionnel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="datetime-local"
                value={form.transaction_date}
                onChange={e => handleChange('transaction_date', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Prix + Quantite */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix unitaire (EUR)</label>
              <input
                type="number"
                step="any"
                value={form.price_at_purchase}
                onChange={e => handleChange('price_at_purchase', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantite</label>
              <input
                type="number"
                step="any"
                value={form.quantity_purchased}
                onChange={e => handleChange('quantity_purchased', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Montant + Frais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant investi (EUR)</label>
              <input
                type="number"
                step="any"
                value={form.amount_invested}
                onChange={e => handleChange('amount_invested', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Auto-calcule depuis prix x quantite</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frais</label>
              <input
                type="number"
                step="any"
                value={form.transaction_fees}
                onChange={e => handleChange('transaction_fees', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
