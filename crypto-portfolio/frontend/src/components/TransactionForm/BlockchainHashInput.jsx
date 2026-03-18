import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatQuantity } from '../../utils/calculations';

export default function BlockchainHashInput({ onValidate, loading, onShowLedgerGuide }) {
  const [txHashes, setTxHashes] = useState(['']);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [suggestedAddresses, setSuggestedAddresses] = useState([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [errors, setErrors] = useState({});

  // Premier hash non-vide (pour fetch adresses)
  const firstHash = txHashes.find(h => h.trim().length > 0) || '';

  // Fetch des adresses de destination quand le hash est rempli
  useEffect(() => {
    if (firstHash.length > 40) {
      fetchOutputAddresses();
    } else {
      setSuggestedAddresses([]);
    }
  }, [firstHash]);

  const fetchOutputAddresses = async () => {
    setFetchingAddresses(true);
    try {
      const response = await api.get(`/blockchain/outputs/BTC/${encodeURIComponent(firstHash)}`);
      if (response.data.success && response.data.addresses) {
        setSuggestedAddresses(response.data.addresses);
      }
    } catch {
      // Silently fail
    } finally {
      setFetchingAddresses(false);
    }
  };

  const updateHash = (index, value) => {
    setTxHashes(prev => prev.map((h, i) => i === index ? value : h));
    setErrors(prev => ({ ...prev, [`hash_${index}`]: '' }));
  };

  const addHashField = () => {
    setTxHashes(prev => [...prev, '']);
  };

  const removeHashField = (index) => {
    if (txHashes.length <= 1) return;
    setTxHashes(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const next = {};
      for (const [key, val] of Object.entries(prev)) {
        if (!key.startsWith('hash_')) {
          next[key] = val;
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    const nonEmptyHashes = txHashes.map((h, i) => ({ hash: h.trim(), index: i })).filter(x => x.hash);

    if (nonEmptyHashes.length === 0) {
      newErrors.hash_0 = 'Veuillez entrer au moins un hash de transaction';
    }

    nonEmptyHashes.forEach(({ hash, index }) => {
      if (!hash) {
        newErrors[`hash_${index}`] = 'Hash vide';
      }
    });

    if (!recipientAddress.trim()) {
      newErrors.address = 'Veuillez specifier votre adresse de reception';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const hashes = nonEmptyHashes.map(x => x.hash);
    onValidate('BTC', hashes, recipientAddress || null);
  };

  const handlePaste = async (field, index = 0) => {
    try {
      const text = await navigator.clipboard.readText();
      if (field === 'hash') {
        updateHash(index, text.trim());
      } else if (field === 'address') {
        setRecipientAddress(text.trim());
        setErrors(prev => ({ ...prev, address: '' }));
      }
    } catch {
      // Clipboard access denied
    }
  };

  const selectSuggestedAddress = (address) => {
    setRecipientAddress(address);
    setErrors(prev => ({ ...prev, address: '' }));
  };

  const hashCount = txHashes.filter(h => h.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Hash de Transaction Bitcoin
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Copiez le hash depuis Ledger Live et collez-le ci-dessous
        </p>
      </div>

      {/* Hash Inputs (multiple) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Hash de Transaction {txHashes.length > 1 && (
              <span className="text-purple-600 dark:text-purple-400 ml-1">
                ({hashCount} hash{hashCount > 1 ? 'es' : ''})
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={addHashField}
            className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400
                     hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un hash
          </button>
        </div>

        <div className="space-y-3">
          {txHashes.map((hash, index) => (
            <div key={index} className="flex items-center gap-2">
              {txHashes.length > 1 && (
                <span className="text-xs text-gray-400 dark:text-slate-500 font-mono w-5 text-right flex-shrink-0">
                  {index + 1}
                </span>
              )}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => updateHash(index, e.target.value)}
                  placeholder="Hash de transaction Bitcoin"
                  className={`w-full px-4 py-3 pr-20 rounded-lg border-2
                            ${errors[`hash_${index}`]
                              ? 'border-red-500 dark:border-red-400'
                              : 'border-gray-200 dark:border-slate-700'
                            }
                            bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100
                            focus:outline-none focus:border-purple-500 dark:focus:border-indigo-400
                            font-mono text-sm`}
                />
                <button
                  type="button"
                  onClick={() => handlePaste('hash', index)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5
                           text-sm text-purple-600 dark:text-purple-400 hover:bg-indigo-50
                           dark:hover:bg-indigo-900/20 rounded transition-colors font-medium"
                >
                  Coller
                </button>
              </div>
              {txHashes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHashField(index)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400
                           transition-colors flex-shrink-0"
                  title="Supprimer ce hash"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {errors.hash_0 && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hash_0}</p>
        )}
      </div>

      {/* Recipient Address (toujours requis pour BTC) */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200
                    dark:border-amber-800/50 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
              Adresse de reception requise
            </h4>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              Une transaction Bitcoin peut avoir plusieurs destinations.
              Specifiez VOTRE adresse pour calculer le montant exact recu.
              {txHashes.filter(h => h.trim()).length > 1 && (
                <span className="font-medium"> Cette adresse sera utilisee pour tous les hashes.</span>
              )}
            </p>
          </div>
        </div>

        {/* Suggested Addresses */}
        {fetchingAddresses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500" />
            <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">
              Recuperation des adresses...
            </span>
          </div>
        ) : suggestedAddresses.length > 1 ? (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {suggestedAddresses.length} adresses trouvees dans cette transaction :
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestedAddresses.map((addr, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestedAddress(addr.address)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all
                    ${recipientAddress === addr.address
                      ? 'border-purple-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-gray-900 dark:text-slate-100 truncate">
                        {addr.address}
                      </p>
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                        {formatQuantity(addr.amount)} BTC
                      </p>
                    </div>
                    {recipientAddress === addr.address && (
                      <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Manual Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {suggestedAddresses.length > 1
              ? 'Ou entrez votre adresse manuellement'
              : 'Votre adresse Bitcoin'
            }
          </label>
          <div className="relative">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setErrors(prev => ({ ...prev, address: '' }));
              }}
              placeholder="Votre adresse Bitcoin"
              className={`w-full px-4 py-3 pr-20 rounded-lg border-2
                        ${errors.address
                          ? 'border-red-500 dark:border-red-400'
                          : 'border-gray-200 dark:border-slate-700'
                        }
                        bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100
                        focus:outline-none focus:border-purple-500 dark:focus:border-indigo-400
                        font-mono text-sm`}
            />
            <button
              type="button"
              onClick={() => handlePaste('address')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5
                       text-sm text-purple-600 dark:text-purple-400 hover:bg-indigo-50
                       dark:hover:bg-indigo-900/20 rounded transition-colors font-medium"
            >
              Coller
            </button>
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
          )}
        </div>

        {/* Help */}
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p className="text-xs text-gray-700 dark:text-slate-300">
            <strong>Ou trouver mon adresse ?</strong> Dans Ledger Live, allez dans votre
            compte Bitcoin, cliquez sur "Recevoir" pour voir votre adresse de reception.
          </p>
        </div>
      </div>

      {/* Ledger Guide Link */}
      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200
                    dark:border-slate-700">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-gray-500 dark:text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
              <strong>Ou trouver le hash dans Ledger Live ?</strong>
            </p>
            <button
              type="button"
              onClick={onShowLedgerGuide}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Voir le guide illustre &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || hashCount === 0}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-300
                 dark:disabled:bg-slate-700 text-white font-semibold rounded-lg
                 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Verification en cours...
          </>
        ) : (
          <>
            {hashCount > 1
              ? `Recuperer les donnees (${hashCount} transactions)`
              : 'Recuperer les donnees'
            }
            <span className="text-xl">&rarr;</span>
          </>
        )}
      </button>
    </form>
  );
}
