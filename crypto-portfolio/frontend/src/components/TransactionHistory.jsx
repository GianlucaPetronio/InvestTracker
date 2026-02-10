import { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../services/api';
import { formatCurrency, formatQuantity } from '../utils/calculations';

/**
 * Liste complète des transactions avec filtres et suppression.
 */
function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'crypto', 'traditional'

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.asset_type = filter;
      const response = await getTransactions(params);
      setTransactions(response.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Historique des transactions</h1>

        {/* Filtres */}
        <div className="flex space-x-2">
          {['all', 'crypto', 'traditional'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tout' : f === 'crypto' ? 'Crypto' : 'Traditionnel'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune transaction trouvee
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actif</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantite</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(tx.transaction_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{tx.asset_symbol}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        tx.asset_type === 'crypto'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {tx.asset_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        tx.source === 'blockchain'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.source === 'blockchain' ? 'Blockchain' : 'Manuel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatQuantity(parseFloat(tx.quantity_purchased))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(parseFloat(tx.price_at_purchase))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {tx.amount_invested ? formatCurrency(parseFloat(tx.amount_invested)) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-red-500 hover:text-red-700 text-sm transition-colors"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
