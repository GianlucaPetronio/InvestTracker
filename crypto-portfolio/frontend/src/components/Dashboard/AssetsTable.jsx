import { useState } from 'react';
import { formatCurrency, formatPercent, formatQuantity } from '../../utils/calculations';

function AssetsTable({ assets = [] }) {
  const [hoveredFees, setHoveredFees] = useState(null);

  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center text-gray-400 dark:text-slate-500">
        Aucun actif dans le portfolio
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Bitcoin</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actif</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Quantite</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Prix Moyen</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Investi</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Frais</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Valeur Actuelle</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {assets.map(asset => {
              const isPositive = asset.profitLoss >= 0;
              const pnlColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
              const rawInvested = asset.invested - (asset.totalFees || 0);

              return (
                <tr key={asset.symbol} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  {/* Actif */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex items-center justify-center text-sm font-bold overflow-hidden">
                        <img
                          src="https://assets.coincap.io/assets/icons/btc@2x.png"
                          alt="BTC"
                          className="w-8 h-8"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = '';
                          }}
                        />
                        <span style={{ display: 'none' }}>{'\u20BF'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{asset.symbol}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{asset.name || 'Bitcoin'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Quantite */}
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 dark:text-slate-300">
                    {formatQuantity(asset.quantity)}
                  </td>

                  {/* Prix Moyen */}
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-slate-300 hidden md:table-cell">
                    {formatCurrency(asset.avgPrice)}
                  </td>

                  {/* Investi */}
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-slate-300">
                    {formatCurrency(rawInvested)}
                  </td>

                  {/* Frais */}
                  <td
                    className="px-4 py-3 text-right text-sm text-gray-400 dark:text-slate-500 relative"
                    onMouseEnter={() => setHoveredFees(asset.symbol)}
                    onMouseLeave={() => setHoveredFees(null)}
                  >
                    {formatCurrency(asset.totalFees || 0)}
                    {hoveredFees === asset.symbol && asset.txCount > 0 && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 dark:bg-slate-600 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg">
                        Frais cumules sur {asset.txCount} transaction{asset.txCount > 1 ? 's' : ''}
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-slate-600" />
                      </div>
                    )}
                  </td>

                  {/* Valeur Actuelle */}
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-slate-100 hidden md:table-cell">
                    {asset.currentPrice
                      ? formatCurrency(asset.currentValue)
                      : <span className="text-gray-400 dark:text-slate-500">-</span>
                    }
                  </td>

                  {/* P&L */}
                  <td className="px-4 py-3 text-right">
                    {asset.currentPrice ? (
                      <div>
                        <p className={`text-sm font-semibold ${pnlColor}`}>
                          {isPositive ? '\u25B2' : '\u25BC'}{' '}
                          {formatCurrency(asset.profitLoss)}
                        </p>
                        <p className={`text-xs ${pnlColor}`}>
                          {formatPercent(asset.profitLossPercent)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssetsTable;
