import { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction, deleteTransactionsBulk, exportTransactionsCsv } from '../services/api';
import { formatCurrency, formatQuantity } from '../utils/calculations';
import Button from './ui/Button';
import Card from './ui/Card';
import ConfirmDialog from './ui/ConfirmDialog';
import EditTransactionModal from './EditTransactionModal';

/**
 * Liste complete des transactions Bitcoin.
 */
function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'single'|'bulk', id?: number }
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Vider la selection quand les transactions changent
  useEffect(() => {
    setSelected(new Set());
  }, [transactions]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const response = await getTransactions({});
      setTransactions(response.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(id) {
    setConfirmDelete({ type: 'single', id });
  }

  function requestBulkDelete() {
    setConfirmDelete({ type: 'bulk' });
  }

  async function executeDelete() {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'single') {
      try {
        await deleteTransaction(confirmDelete.id);
        setTransactions(prev => prev.filter(tx => tx.id !== confirmDelete.id));
      } catch {
        setErrorMsg('Erreur lors de la suppression');
      }
    } else {
      setDeleting(true);
      try {
        const ids = [...selected];
        await deleteTransactionsBulk(ids);
        setTransactions(prev => prev.filter(tx => !selected.has(tx.id)));
      } catch {
        setErrorMsg('Erreur lors de la suppression');
      } finally {
        setDeleting(false);
      }
    }
    setConfirmDelete(null);
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map(tx => tx.id)));
    }
  }

  function handleEditSaved() {
    setEditingTx(null);
    fetchTransactions();
  }

  async function handleExportCsv() {
    try {
      const response = await exportTransactionsCsv();
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_btc_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Erreur lors de l\'export CSV');
    }
  }

  const allSelected = transactions.length > 0 && selected.size === transactions.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Historique des transactions</h1>
        {transactions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleExportCsv}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </Button>
        )}
      </div>

      {/* Barre d'actions de selection */}
      {someSelected && (
        <div className="flex items-center gap-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {selected.size} transaction(s) selectionnee(s)
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={requestBulkDelete}
            disabled={deleting}
            loading={deleting}
            className="ml-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Annuler
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">Chargement...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          Aucune transaction trouvee
        </div>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Quantite</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Prix</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Frais</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${
                      selected.has(tx.id) ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                      {new Date(tx.transaction_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        tx.transaction_type === 'sell'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {tx.transaction_type === 'sell' ? 'Vente' : 'Achat'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        tx.source === 'blockchain'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                      }`}>
                        {tx.source === 'blockchain' ? 'Blockchain' : 'Manuel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 dark:text-slate-300">
                      {formatQuantity(parseFloat(tx.quantity_purchased))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-slate-300">
                      {formatCurrency(parseFloat(tx.price_at_purchase))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-slate-100">
                      {tx.amount_invested ? formatCurrency(parseFloat(tx.amount_invested)) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400 dark:text-slate-500">
                      {formatCurrency(parseFloat(tx.transaction_fees || 0))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => requestDelete(tx.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal d'edition */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer"
        message={
          confirmDelete?.type === 'bulk'
            ? `Supprimer ${selected.size} transaction(s) selectionnee(s) ?`
            : 'Supprimer cette transaction ?'
        }
        confirmLabel="Supprimer"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toast d'erreur */}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <span className="text-sm font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
