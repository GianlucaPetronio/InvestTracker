export default function TypeSelection({ onSelect, onShowLedgerGuide, transactionType, onTransactionTypeChange }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Comment souhaitez-vous ajouter votre transaction ?
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Choisissez la methode la plus adaptee
        </p>
      </div>

      {/* Toggle Achat / Vente */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => onTransactionTypeChange('buy')}
          className={`flex-1 max-w-[200px] py-3 px-6 rounded-lg font-semibold text-sm transition-all border-2 ${
            transactionType === 'buy'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Achat
          </span>
        </button>
        <button
          onClick={() => onTransactionTypeChange('sell')}
          className={`flex-1 max-w-[200px] py-3 px-6 rounded-lg font-semibold text-sm transition-all border-2 ${
            transactionType === 'sell'
              ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
            Vente
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Via Hash Blockchain */}
        <button
          onClick={() => onSelect('blockchain')}
          className="group relative p-8 rounded-xl border-2 border-gray-200 dark:border-slate-700
                   hover:border-purple-500 dark:hover:border-purple-400 transition-all
                   bg-white dark:bg-slate-800/50 hover:shadow-lg
                   text-left"
        >
          <div className="text-4xl mb-4">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Via Hash de Transaction
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Collez le hash depuis Ledger Live. Les donnees seront recuperees automatiquement.
          </p>
          <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <span className="font-medium">Recommande pour Ledger</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>

          {/* Badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700
                           dark:text-purple-300 text-xs font-semibold rounded-full">
              Auto
            </span>
          </div>
        </button>

        {/* Option 2: Saisie Manuelle */}
        <button
          onClick={() => onSelect('manual')}
          className="group relative p-8 rounded-xl border-2 border-gray-200 dark:border-slate-700
                   hover:border-purple-500 dark:hover:border-purple-400 transition-all
                   bg-white dark:bg-slate-800/50 hover:shadow-lg
                   text-left"
        >
          <div className="text-4xl mb-4">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Saisie Manuelle
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Entrez manuellement les details de votre transaction (exchange, actions, etc.)
          </p>
          <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
            <span className="font-medium">Pour actifs traditionnels</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </button>

      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border
                    border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start gap-4">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Vous utilisez Ledger Live ?
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Vous pouvez facilement copier le hash de transaction depuis l'application
              Ledger Live pour remplir automatiquement tous les details.
            </p>
            <button
              onClick={onShowLedgerGuide}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Voir le guide Ledger Live &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
