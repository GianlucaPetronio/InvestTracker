import { useState, useEffect } from 'react';
import api, { getBlockchains } from '../../services/api';
import { formatQuantity } from '../../utils/calculations';

// Mapping symbole blockchain → symbole pour le logo CDN
const LOGO_SYMBOL_MAP = {
  BTC: 'btc',
  ETH: 'eth',
  BSC: 'bnb',
  MATIC: 'matic',
  SOL: 'sol',
  AVAX: 'avax',
  ARB: 'arb',
  OP: 'op',
  DOT: 'dot',
  ADA: 'ada',
  LINK: 'link',
};

function getLogoUrl(symbol) {
  const s = LOGO_SYMBOL_MAP[symbol] || symbol.toLowerCase();
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${s}.svg`;
}

// Blockchains par defaut (toujours affichees, meme sans connexion DB)
const DEFAULT_BLOCKCHAINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '\u20bf', needs_recipient_address: true, hash_pattern: '^[a-fA-F0-9]{64}$' },
  { symbol: 'ETH', name: 'Ethereum', icon: '\u27e0', needs_recipient_address: false, hash_pattern: '^0x[a-fA-F0-9]{64}$' },
  { symbol: 'BSC', name: 'BNB Smart Chain', icon: '\u25c7', needs_recipient_address: false, hash_pattern: '^0x[a-fA-F0-9]{64}$' },
  { symbol: 'MATIC', name: 'Polygon', icon: '\u2b21', needs_recipient_address: false, hash_pattern: '^0x[a-fA-F0-9]{64}$' },
  { symbol: 'SOL', name: 'Solana', icon: '\u25ce', needs_recipient_address: true, hash_pattern: '^[1-9A-HJ-NP-Za-km-z]{87,88}$' },
];

export default function BlockchainHashInput({ onValidate, loading, onShowLedgerGuide }) {
  const [availableBlockchains, setAvailableBlockchains] = useState(DEFAULT_BLOCKCHAINS);
  const [blockchain, setBlockchain] = useState('');
  const [txHash, setTxHash] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [suggestedAddresses, setSuggestedAddresses] = useState([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAllBlockchains, setShowAllBlockchains] = useState(false);

  const selectedBc = availableBlockchains.find(b => b.symbol === blockchain);
  const showAddressField = selectedBc?.needs_recipient_address || false;

  // Charger les blockchains depuis l'API (fusionne avec les defauts)
  useEffect(() => {
    (async () => {
      try {
        const response = await getBlockchains(false);
        const fromApi = response.data.blockchains;
        if (fromApi && fromApi.length > 0) {
          // Fusionner : prendre les blockchains API, puis ajouter les defauts manquants
          const apiSymbols = new Set(fromApi.map(b => b.symbol));
          const missing = DEFAULT_BLOCKCHAINS.filter(b => !apiSymbols.has(b.symbol));
          setAvailableBlockchains([...fromApi, ...missing]);
        }
      } catch {
        // Fallback silencieux : on garde les blockchains par defaut
      }
    })();
  }, []);

  // Auto-detection de la blockchain depuis le hash
  useEffect(() => {
    if (txHash.length > 20 && !blockchain) {
      detectBlockchain();
    }
  }, [txHash]);

  // Fetch des adresses de destination quand hash et blockchain sont remplis
  useEffect(() => {
    if (blockchain && txHash.length > 40 && showAddressField) {
      fetchOutputAddresses();
    } else {
      setSuggestedAddresses([]);
    }
  }, [blockchain, txHash]);

  const detectBlockchain = async () => {
    setAutoDetecting(true);
    try {
      const response = await api.get(`/blockchain/detect/${encodeURIComponent(txHash)}`);
      if (response.data.success) {
        setBlockchain(response.data.blockchain);
        setErrors(prev => ({ ...prev, hash: '' }));
      }
    } catch {
      // Silently fail, user can select manually
    } finally {
      setAutoDetecting(false);
    }
  };

  const fetchOutputAddresses = async () => {
    setFetchingAddresses(true);
    try {
      const response = await api.get(`/blockchain/outputs/${blockchain}/${encodeURIComponent(txHash)}`);
      if (response.data.success && response.data.addresses) {
        setSuggestedAddresses(response.data.addresses);
      }
    } catch {
      // Silently fail
    } finally {
      setFetchingAddresses(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!blockchain) {
      newErrors.blockchain = 'Veuillez selectionner une blockchain';
    }

    if (!txHash.trim()) {
      newErrors.hash = 'Veuillez entrer un hash de transaction';
    }

    if (showAddressField && !recipientAddress.trim()) {
      newErrors.address = 'Veuillez specifier votre adresse de reception';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onValidate(blockchain, txHash, recipientAddress || null);
  };

  const handlePaste = async (field) => {
    try {
      const text = await navigator.clipboard.readText();
      if (field === 'hash') {
        setTxHash(text.trim());
        setErrors(prev => ({ ...prev, hash: '' }));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Hash de Transaction
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Copiez le hash depuis Ledger Live et collez-le ci-dessous
        </p>
      </div>

      {/* Blockchain Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Blockchain {autoDetecting && <span className="text-indigo-500 ml-1">(detection auto...)</span>}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(showAllBlockchains ? availableBlockchains : availableBlockchains.slice(0, 6)).map((bc) => (
            <button
              key={bc.symbol}
              type="button"
              onClick={() => {
                if (blockchain === bc.symbol) {
                  setBlockchain('');
                } else {
                  setBlockchain(bc.symbol);
                  setErrors(prev => ({ ...prev, blockchain: '' }));
                }
                setSuggestedAddresses([]);
                setRecipientAddress('');
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left
                ${blockchain === bc.symbol
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={getLogoUrl(bc.symbol)}
                  alt={bc.symbol}
                  className="w-7 h-7"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = '';
                  }}
                />
                <span className="text-2xl" style={{ display: 'none' }}>{bc.icon}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {bc.symbol}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {bc.name}
              </div>
            </button>
          ))}
        </div>
        {availableBlockchains.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllBlockchains(!showAllBlockchains)}
            className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700
                     dark:hover:text-indigo-300 font-medium transition-colors"
          >
            {showAllBlockchains
              ? 'Voir moins'
              : `Voir plus (${availableBlockchains.length - 6} autres)`
            }
          </button>
        )}
        {errors.blockchain && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.blockchain}</p>
        )}
      </div>

      {/* Hash Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hash de Transaction
        </label>
        <div className="relative">
          <input
            type="text"
            value={txHash}
            onChange={(e) => {
              setTxHash(e.target.value);
              setErrors(prev => ({ ...prev, hash: '' }));
            }}
            placeholder={blockchain
              ? `Hash de transaction ${selectedBc?.name || blockchain}`
              : "Selectionnez d'abord une blockchain"
            }
            className={`w-full px-4 py-3 pr-20 rounded-lg border-2
                      ${errors.hash
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-200 dark:border-gray-700'
                      }
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400
                      font-mono text-sm`}
          />
          <button
            type="button"
            onClick={() => handlePaste('hash')}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5
                     text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50
                     dark:hover:bg-indigo-900/20 rounded transition-colors font-medium"
          >
            Coller
          </button>
        </div>
        {errors.hash && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hash}</p>
        )}
        {blockchain && !errors.hash && selectedBc?.hash_pattern && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
            Pattern : {selectedBc.hash_pattern}
          </p>
        )}
      </div>

      {/* Recipient Address (pour BTC et blockchains multi-output) */}
      {showAddressField && blockchain && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200
                      dark:border-amber-800/50 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Adresse de reception requise
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Une transaction {blockchain} peut avoir plusieurs destinations.
                Specifiez VOTRE adresse pour calculer le montant exact recu.
              </p>
            </div>
          </div>

          {/* Suggested Addresses */}
          {fetchingAddresses ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Recuperation des adresses...
              </span>
            </div>
          ) : suggestedAddresses.length > 1 ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-gray-900 dark:text-gray-100 truncate">
                          {addr.address}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                          {formatQuantity(addr.amount)} {blockchain}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {suggestedAddresses.length > 1
                ? 'Ou entrez votre adresse manuellement'
                : `Votre adresse ${blockchain}`
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
                placeholder={`Votre adresse ${blockchain}`}
                className={`w-full px-4 py-3 pr-20 rounded-lg border-2
                          ${errors.address
                            ? 'border-red-500 dark:border-red-400'
                            : 'border-gray-200 dark:border-gray-700'
                          }
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                          focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400
                          font-mono text-sm`}
              />
              <button
                type="button"
                onClick={() => handlePaste('address')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5
                         text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50
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
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <strong>Ou trouver mon adresse ?</strong> Dans Ledger Live, allez dans votre
              compte {blockchain}, cliquez sur "Recevoir" pour voir votre adresse de reception.
            </p>
          </div>
        </div>
      )}

      {/* Ledger Guide Link */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200
                    dark:border-gray-700">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Ou trouver le hash dans Ledger Live ?</strong>
            </p>
            <button
              type="button"
              onClick={onShowLedgerGuide}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voir le guide illustre &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !blockchain || !txHash}
        className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300
                 dark:disabled:bg-gray-700 text-white font-semibold rounded-lg
                 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Verification en cours...
          </>
        ) : (
          <>
            Recuperer les donnees
            <span className="text-xl">&rarr;</span>
          </>
        )}
      </button>
    </form>
  );
}
