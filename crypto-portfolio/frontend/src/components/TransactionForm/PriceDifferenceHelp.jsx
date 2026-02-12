import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'Pourquoi la valeur on-chain differe de ce que j\'ai paye ?',
    answer:
      'La valeur on-chain est calculee a partir du prix spot (marche) au moment de la transaction. ' +
      'Le montant que vous avez reellement paye inclut generalement le spread de l\'exchange, ' +
      'ses commissions et d\'eventuels frais de paiement. Un ecart de 1 a 5% est normal.',
  },
  {
    question: 'Quel montant est utilise pour mes calculs de performance ?',
    answer:
      'Le "montant reellement paye" que vous saisissez est la source de verite comptable. ' +
      'C\'est ce montant qui est utilise pour calculer votre prix moyen d\'achat, votre P&L ' +
      'et votre performance globale. La valeur on-chain est purement informative.',
  },
  {
    question: 'Comment remplir le montant reellement paye ?',
    answer:
      'Indiquez le montant exact debite de votre compte (virement bancaire, carte, etc.). ' +
      'Par exemple, si vous avez achete pour 500 EUR de Bitcoin sur Coinbase, saisissez 500. ' +
      'Ce montant inclut deja les commissions de l\'exchange et le spread.',
  },
  {
    question: 'A quoi sert la valeur estimee on-chain ?',
    answer:
      'La valeur on-chain (quantite x prix spot) et les frais reseau sont affiches a titre ' +
      'informatif pour vous aider a verifier la coherence des donnees. Ils ne sont pas utilises ' +
      'dans les calculs de performance de votre portfolio.',
  },
  {
    question: 'Puis-je modifier le prix spot de reference ?',
    answer:
      'Oui, le bouton "Modifier le prix" permet d\'ajuster le prix spot utilise comme reference. ' +
      'Cela met a jour la valeur estimee on-chain mais n\'affecte pas le montant reellement paye ' +
      'ni vos calculs de performance.',
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
