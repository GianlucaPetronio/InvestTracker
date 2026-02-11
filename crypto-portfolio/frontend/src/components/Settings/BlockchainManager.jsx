import { useState, useEffect } from 'react';
import { getBlockchains, createBlockchain, updateBlockchain, deleteBlockchain, toggleBlockchain } from '../../services/api';

export default function BlockchainManager() {
  const [blockchains, setBlockchains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlockchain, setEditingBlockchain] = useState(null);

  useEffect(() => {
    fetchBlockchains();
  }, []);

  const fetchBlockchains = async () => {
    try {
      const response = await getBlockchains(true);
      setBlockchains(response.data.blockchains);
    } catch (error) {
      console.error('Error fetching blockchains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (symbol) => {
    if (!confirm(`Supprimer la blockchain ${symbol} ?`)) return;
    try {
      await deleteBlockchain(symbol);
      fetchBlockchains();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleToggle = async (symbol) => {
    try {
      await toggleBlockchain(symbol);
      fetchBlockchains();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des Blockchains
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {blockchains.filter(b => b.is_active).length} actives sur {blockchains.length} configurees
          </p>
        </div>
        <button
          onClick={() => { setEditingBlockchain(null); setShowModal(true); }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold
                   rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Ajouter
        </button>
      </div>

      {/* Blockchain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blockchains.map((bc) => (
          <div
            key={bc.symbol}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-5 transition-all
              ${bc.is_active
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-gray-200 dark:border-gray-700 opacity-50'
              }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{bc.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {bc.symbol}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{bc.name}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {bc.is_custom && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700
                               dark:text-purple-300 text-xs font-semibold rounded">
                    Custom
                  </span>
                )}
                {!bc.is_active && (
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500
                               dark:text-gray-400 text-xs font-semibold rounded">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">API:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{bc.api_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Actif natif:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{bc.asset_symbol}</span>
              </div>
              {bc.needs_recipient_address && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Necessite l'adresse de reception
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingBlockchain(bc); setShowModal(true); }}
                className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                         dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                         text-sm font-medium transition-colors"
              >
                Modifier
              </button>
              <button
                onClick={() => handleToggle(bc.symbol)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${bc.is_active
                    ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}
              >
                {bc.is_active ? 'Desactiver' : 'Activer'}
              </button>
              {bc.is_custom && (
                <button
                  onClick={() => handleDelete(bc.symbol)}
                  className="py-2 px-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100
                           dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg
                           text-sm font-medium transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <BlockchainFormModal
          blockchain={editingBlockchain}
          onClose={() => { setShowModal(false); setEditingBlockchain(null); }}
          onSave={() => { fetchBlockchains(); setShowModal(false); setEditingBlockchain(null); }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Modal Formulaire
// =============================================================================
function BlockchainFormModal({ blockchain, onClose, onSave }) {
  const isEdit = !!blockchain;

  const [formData, setFormData] = useState({
    symbol: blockchain?.symbol || '',
    name: blockchain?.name || '',
    icon: blockchain?.icon || '●',
    hash_pattern: blockchain?.hash_pattern || '',
    address_pattern: blockchain?.address_pattern || '',
    needs_recipient_address: blockchain?.needs_recipient_address || false,
    asset_symbol: blockchain?.asset_symbol || '',
    api_type: blockchain?.api_type || 'unsupported',
    api_url: blockchain?.api_url || '',
    api_key_env_var: blockchain?.api_key_env_var || '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        asset_symbol: formData.asset_symbol || formData.symbol,
      };

      if (isEdit) {
        await updateBlockchain(blockchain.symbol, payload);
      } else {
        await createBlockchain(payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
         onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full
                    max-h-[90vh] overflow-y-auto p-6"
           onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? `Modifier ${blockchain.symbol}` : 'Ajouter une blockchain'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                        dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identite */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                placeholder="BTC"
                required
                disabled={isEdit}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icone
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-2xl text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Actif natif
              </label>
              <input
                type="text"
                value={formData.asset_symbol}
                onChange={(e) => handleChange('asset_symbol', e.target.value.toUpperCase())}
                placeholder={formData.symbol || 'ETH'}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Bitcoin, Ethereum..."
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Validation patterns */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">
              Validation (Regex)
            </legend>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pattern du hash de transaction *
                </label>
                <input
                  type="text"
                  value={formData.hash_pattern}
                  onChange={(e) => handleChange('hash_pattern', e.target.value)}
                  placeholder="^0x[a-fA-F0-9]{64}$"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pattern de l'adresse
                </label>
                <input
                  type="text"
                  value={formData.address_pattern}
                  onChange={(e) => handleChange('address_pattern', e.target.value)}
                  placeholder="^0x[a-fA-F0-9]{40}$"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.needs_recipient_address}
                  onChange={(e) => handleChange('needs_recipient_address', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Necessite l'adresse de reception (multi-outputs)
              </label>
            </div>
          </fieldset>

          {/* API config */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">
              Configuration API
            </legend>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Type d'API *
                </label>
                <select
                  value={formData.api_type}
                  onChange={(e) => handleChange('api_type', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="unsupported">Non supporte (saisie manuelle)</option>
                  <option value="bitcoin">Bitcoin (Blockchain.info)</option>
                  <option value="etherscan">Etherscan-like (EVM chains)</option>
                </select>
              </div>

              {formData.api_type !== 'unsupported' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      URL de l'API
                    </label>
                    <input
                      type="url"
                      value={formData.api_url}
                      onChange={(e) => handleChange('api_url', e.target.value)}
                      placeholder="https://api.etherscan.io/api"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Variable d'env pour la cle API
                    </label>
                    <input
                      type="text"
                      value={formData.api_key_env_var}
                      onChange={(e) => handleChange('api_key_env_var', e.target.value)}
                      placeholder="ETHERSCAN_API_KEY"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </fieldset>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border-2 border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 font-semibold rounded-lg
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300
                       dark:disabled:bg-gray-700 text-white font-semibold rounded-lg
                       transition-colors disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : isEdit ? 'Mettre a jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
