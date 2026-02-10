import { useState } from 'react';
import { formatCurrency, formatPercent, formatQuantity } from '../../utils/calculations';

// Icones/emojis pour les cryptos courantes
const ASSET_ICONS = {
  BTC: '\u20BF',
  ETH: '\u039E',
  BNB: 'B',
  SOL: 'S',
  ADA: 'A',
  DOT: 'D',
  AVAX: 'A',
  MATIC: 'M',
  LINK: 'L',
  UNI: 'U',
};

function AssetsTable({ assets = [] }) {
  const [sortKey, setSortKey] = useState('weight');
  const [sortAsc, setSortAsc] = useState(false);
  const [hoveredFees, setHoveredFees] = useState(null);

  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-400 dark:text-gray-500">
        Aucun actif dans le portfolio
      </div>
    );
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...assets].sort((a, b) => {
    const valA = a[sortKey] ?? 0;
    const valB = b[sortKey] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const columns = [
    { key: 'symbol', label: 'Actif', align: 'left' },
    { key: 'quantity', label: 'Quantite', align: 'right' },
    { key: 'avgPrice', label: 'Prix Moyen', align: 'right', hideOnMobile: true },
    { key: 'invested', label: 'Investi', align: 'right' },
    { key: 'totalFees', label: 'Frais', align: 'right' },
    { key: 'currentValue', label: 'Valeur Actuelle', align: 'right', hideOnMobile: true },
    { key: 'profitLoss', label: 'P&L', align: 'right' },
    { key: 'weight', label: 'Poids', align: 'right', hideOnMobile: true },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Actifs du portfolio</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-700/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-indigo-500 dark:text-indigo-400">{sortAsc ? '\u2191' : '\u2193'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {sorted.map(asset => {
              const isPositive = asset.profitLoss >= 0;
              const pnlColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
              const icon = ASSET_ICONS[asset.symbol] || asset.symbol.charAt(0);
              const rawInvested = asset.invested - (asset.totalFees || 0);

              return (
                <tr key={asset.symbol} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  {/* Actif */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                        {icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{asset.symbol}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{asset.name || asset.type}</p>
                      </div>
                    </div>
                  </td>

                  {/* Quantite */}
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 dark:text-gray-300">
                    {formatQuantity(asset.quantity)}
                  </td>

                  {/* Prix Moyen */}
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                    {formatCurrency(asset.avgPrice)}
                  </td>

                  {/* Investi */}
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(rawInvested)}
                  </td>

                  {/* Frais */}
                  <td
                    className="px-4 py-3 text-right text-sm text-gray-400 dark:text-gray-500 relative"
                    onMouseEnter={() => setHoveredFees(asset.symbol)}
                    onMouseLeave={() => setHoveredFees(null)}
                  >
                    {formatCurrency(asset.totalFees || 0)}
                    {hoveredFees === asset.symbol && asset.txCount > 0 && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 dark:bg-gray-600 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg">
                        Frais cumules sur {asset.txCount} transaction{asset.txCount > 1 ? 's' : ''}
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-600" />
                      </div>
                    )}
                  </td>

                  {/* Valeur Actuelle */}
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100 hidden md:table-cell">
                    {asset.currentPrice
                      ? formatCurrency(asset.currentValue)
                      : <span className="text-gray-400 dark:text-gray-500">-</span>
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
                      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    )}
                  </td>

                  {/* Poids */}
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(asset.weight, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                        {asset.weight.toFixed(1)}%
                      </span>
                    </div>
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
