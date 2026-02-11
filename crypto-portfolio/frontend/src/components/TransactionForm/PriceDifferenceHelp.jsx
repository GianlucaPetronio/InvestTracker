import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'Pourquoi le montant differe de Ledger Live ?',
    answer:
      'Ledger Live et notre application utilisent des sources de prix differentes. ' +
      'Ledger utilise son propre fournisseur de donnees, tandis que nous utilisons CoinGecko. ' +
      'Les prix historiques peuvent varier de 1 a 5% selon la source, surtout pour les transactions anciennes.',
  },
  {
    question: 'Quelle source de prix est la plus fiable ?',
    answer:
      'Aucune source n\'est "parfaite" - chaque fournisseur agrege les prix differemment ' +
      '(moyenne des exchanges, ponderation par volume, etc.). CoinGecko est l\'une des references ' +
      'les plus utilisees dans l\'ecosysteme crypto. L\'ecart est generalement inferieur a 3%.',
  },
  {
    question: 'Comment est calcule le montant investi ?',
    answer:
      'Le montant investi = quantite recue x prix au moment de la transaction (source CoinGecko). ' +
      'Les frais de reseau (gas/mining fees) sont affiches separement. ' +
      'Le "cout total" inclut le montant investi + les frais convertis en EUR.',
  },
  {
    question: 'Puis-je utiliser le montant de Ledger Live a la place ?',
    answer:
      'Oui ! Vous pouvez cliquer sur "Modifier" pour revenir en arriere et ajuster manuellement ' +
      'le montant investi et le prix si vous preferez utiliser les valeurs de Ledger Live. ' +
      'Le mode debug vous aide a comprendre la difference avant de decider.',
  },
  {
    question: 'Pourquoi les frais ne sont pas dans le montant investi ?',
    answer:
      'Les frais de reseau (gas fees, mining fees) sont payes en crypto et separes du montant ' +
      'recu. C\'est une convention comptable : le montant investi represente la valeur de ce que ' +
      'vous avez recu, et les frais representent le cout de la transaction elle-meme.',
  },
];

export default function PriceDifferenceHelp({ onClose }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full
                    max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full
                            flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none"
                     viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Differences de prix - FAQ
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg
                                        overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  className="w-full flex items-center justify-between p-4 text-left
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100 pr-4">
                    {item.question}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform
                                 ${openIndex === index ? 'rotate-180' : ''}`}
                       fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50
                      dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-200 dark:bg-gray-700
                     text-gray-700 dark:text-gray-300 font-medium rounded-lg
                     hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
