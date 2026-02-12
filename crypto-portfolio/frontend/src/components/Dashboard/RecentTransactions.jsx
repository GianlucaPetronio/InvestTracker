import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentTransactions } from '../../services/api';
import { formatCurrency, formatQuantity } from '../../utils/calculations';
import EditTransactionModal from '../EditTransactionModal';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays}j`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

const SOURCE_BADGE = {
  blockchain: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Chain',
  },
  manual: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    label: 'Manuel',
  },
};

function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState(null);

  async function fetchData() {
    try {
      const response = await getRecentTransactions(5);
      setTransactions(response.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleEditSaved() {
    setEditingTx(null);
    fetchData();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Transactions recentes
        </h2>
        <Link
          to="/history"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          Voir tout &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">Chargement...</div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
          Aucune transaction
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => {
            const badge = SOURCE_BADGE[tx.source] || SOURCE_BADGE.manual;
            const fees = parseFloat(tx.transaction_fees || 0);
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                {/* Icone actif */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  tx.asset_type === 'crypto'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>
                  {tx.asset_symbol.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {tx.asset_symbol}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {formatQuantity(parseFloat(tx.quantity_purchased))} unites
                    {fees > 0 && (
                      <span className="text-gray-300 dark:text-gray-600"> | frais {formatCurrency(fees)}</span>
                    )}
                  </p>
                </div>

                {/* Montant et date */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {tx.amount_invested
                      ? formatCurrency(parseFloat(tx.amount_invested))
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(tx.transaction_date)}
                  </p>
                </div>

                {/* Bouton modifier */}
                <button
                  onClick={() => setEditingTx(tx)}
                  className="opacity-0 group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'edition */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}

export default RecentTransactions;
