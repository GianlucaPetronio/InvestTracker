export default function TypeSelection({ onSelect, onShowLedgerGuide }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Comment souhaitez-vous ajouter votre transaction ?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choisissez la methode la plus adaptee
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Via Hash Blockchain */}
        <button
          onClick={() => onSelect('blockchain')}
          className="group relative p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700
                   hover:border-indigo-500 dark:hover:border-indigo-400 transition-all
                   bg-white dark:bg-gray-800/50 hover:shadow-lg
                   text-left"
        >
          <div className="text-4xl mb-4">
            <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Via Hash de Transaction
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Collez le hash depuis Ledger Live. Les donnees seront recuperees automatiquement.
          </p>
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <span className="font-medium">Recommande pour Ledger</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>

          {/* Badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700
                           dark:text-indigo-300 text-xs font-semibold rounded-full">
              Auto
            </span>
          </div>
        </button>

        {/* Option 2: Saisie Manuelle */}
        <button
          onClick={() => onSelect('manual')}
          className="group relative p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700
                   hover:border-purple-500 dark:hover:border-purple-400 transition-all
                   bg-white dark:bg-gray-800/50 hover:shadow-lg
                   text-left"
        >
          <div className="text-4xl mb-4">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Saisie Manuelle
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Vous utilisez Ledger Live ?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Vous pouvez facilement copier le hash de transaction depuis l'application
              Ledger Live pour remplir automatiquement tous les details.
            </p>
            <button
              onClick={onShowLedgerGuide}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Voir le guide Ledger Live &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
