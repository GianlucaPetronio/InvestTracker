export default function LedgerGuide({ onClose }) {
  const steps = [
    {
      number: 1,
      title: 'Ouvrez Ledger Live',
      description: "Lancez l'application Ledger Live sur votre ordinateur ou smartphone.",
      tip: "Assurez-vous d'etre synchronise avec la blockchain pour voir vos dernieres transactions.",
    },
    {
      number: 2,
      title: 'Accedez a votre compte crypto',
      description: 'Cliquez sur le compte de la cryptomonnaie concernee (Bitcoin, Ethereum, etc.)',
    },
    {
      number: 3,
      title: 'Trouvez votre transaction',
      description: 'Dans l\'onglet "Operations" ou "Transactions", localisez la transaction que vous souhaitez ajouter a votre portfolio.',
      warning: 'Cherchez une transaction de type "Recu" (pas "Envoye") pour un achat.',
    },
    {
      number: 4,
      title: 'Cliquez sur la transaction',
      description: "Une fenetre de details s'ouvre avec toutes les informations de la transaction.",
    },
    {
      number: 5,
      title: 'Copiez le hash (Transaction ID)',
      description: 'Cherchez le champ "Transaction ID", "Hash" ou "TxID". Cliquez sur l\'icone de copie ou selectionnez et copiez manuellement.',
      showExample: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
         onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh]
                    overflow-y-auto p-8"
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Guide Ledger Live
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Comment trouver et copier le hash de transaction
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-full flex items-center
                            justify-center text-white font-bold text-xl">
                {step.number}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {step.description}
                </p>

                {step.tip && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Astuce :</strong> {step.tip}
                    </p>
                  </div>
                )}

                {step.warning && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
                                dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important :</strong> {step.warning}
                    </p>
                  </div>
                )}

                {step.showExample && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                      <span className="text-indigo-500 text-xs">Copier</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-200 break-all">
                      0x1a2b3c4d5e6f...a1b2c3d4e5f6
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Final Step */}
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center
                          justify-center text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Collez dans l'application
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Revenez sur cette page et collez le hash dans le champ prevu. Les donnees seront
                automatiquement recuperees !
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg
                     transition-colors"
          >
            J'ai compris !
          </button>
        </div>
      </div>
    </div>
  );
}
