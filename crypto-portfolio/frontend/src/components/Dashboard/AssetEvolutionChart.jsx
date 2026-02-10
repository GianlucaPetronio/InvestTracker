import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getAssetsHistory } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';
import { useTheme } from '../../contexts/ThemeContext';

const PERIODS = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1A' },
  { key: 'ALL', label: 'Tout' },
];

const ASSET_COLORS = {
  BTC: '#f7931a',
  ETH: '#627eea',
  BNB: '#f3ba2f',
  SOL: '#14f195',
  ADA: '#0033ad',
  DOT: '#e6007a',
  MATIC: '#8247e5',
  AVAX: '#e84142',
  LINK: '#2a5ada',
  UNI: '#ff007a',
};

const FALLBACK_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

const ASSET_ICONS = {
  BTC: '\u20BF', ETH: '\u039E', BNB: 'B', SOL: 'S',
  ADA: 'A', DOT: 'D', AVAX: 'A', MATIC: 'M', LINK: 'L', UNI: 'U',
};

function getColor(symbol, index) {
  return ASSET_COLORS[symbol] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function AssetEvolutionChart({ assets = [] }) {
  const { dark } = useTheme();
  const [period, setPeriod] = useState('ALL');
  const [selected, setSelected] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [assetNames, setAssetNames] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialiser avec les 2 premiers actifs
  useEffect(() => {
    if (assets.length > 0 && selected.length === 0) {
      setSelected(assets.slice(0, 2).map(a => a.symbol));
    }
  }, [assets]);

  // Fetch quand la sélection ou la période change
  useEffect(() => {
    if (selected.length === 0) return;

    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await getAssetsHistory(period);
        const allHistory = res.data;

        // Collecter les noms
        const names = {};
        for (const [symbol, data] of Object.entries(allHistory)) {
          names[symbol] = data.name || symbol;
        }
        setAssetNames(names);

        // Fusionner toutes les dates en un seul tableau pour Recharts
        const dateMap = {};
        for (const symbol of selected) {
          const assetData = allHistory[symbol];
          if (!assetData) continue;
          for (const point of assetData.points) {
            if (!dateMap[point.date]) {
              dateMap[point.date] = { date: point.date };
            }
            dateMap[point.date][symbol] = point.value;
          }
        }

        const sorted = Object.values(dateMap).sort(
          (a, b) => a.date.localeCompare(b.date)
        );

        // Remplir les trous : reporter la dernière valeur connue
        for (const symbol of selected) {
          let lastVal = null;
          for (const row of sorted) {
            if (row[symbol] != null) {
              lastVal = row[symbol];
            } else if (lastVal != null) {
              row[symbol] = lastVal;
            }
          }
        }

        setChartData(sorted);
      } catch {
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [selected, period]);

  function toggleAsset(symbol) {
    setSelected(prev => {
      if (prev.includes(symbol)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== symbol);
      }
      return [...prev, symbol];
    });
  }

  function selectAll() {
    setSelected(assets.map(a => a.symbol));
  }

  // Recharts colors
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const tickColor = dark ? '#9ca3af' : '#9ca3af';
  const axisColor = dark ? '#4b5563' : '#e5e7eb';

  // Noms des actifs disponibles (depuis les données chargées ou depuis les props)
  const availableSymbols = assets.map(a => a.symbol);

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {new Date(label).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        {payload.map(entry => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{entry.dataKey}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Evolution par actif
        </h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset selector */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Actifs a comparer :
          </p>
          {availableSymbols.length > 2 && (
            <button
              onClick={selectAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Tout selectionner
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSymbols.map((symbol, index) => {
            const isActive = selected.includes(symbol);
            const color = getColor(symbol, index);
            const icon = ASSET_ICONS[symbol] || symbol.charAt(0);
            return (
              <button
                key={symbol}
                onClick={() => toggleAsset(symbol)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
                style={{
                  borderColor: color,
                  backgroundColor: isActive ? color + '18' : 'transparent',
                  color: isActive ? color : (dark ? '#9ca3af' : '#6b7280'),
                }}
              >
                <span className="text-base leading-none">{icon}</span>
                {symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-80 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-400 dark:text-gray-500">
          Pas assez de donnees pour afficher le graphique
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              tickFormatter={(date) =>
                new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              }
            />
            <YAxis
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val.toFixed(0);
              }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
              )}
            />
            {selected.map((symbol, index) => (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={getColor(symbol, index)}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: getColor(symbol, index),
                  strokeWidth: 2,
                  stroke: dark ? '#1f2937' : '#fff',
                }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Bottom legend cards */}
      {selected.length > 0 && chartData.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selected.map((symbol, index) => {
              const asset = assets.find(a => a.symbol === symbol);
              const lastDataPoint = [...chartData].reverse().find(d => d[symbol] != null);
              const currentVal = lastDataPoint?.[symbol] || 0;
              return (
                <div
                  key={symbol}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(symbol, index) }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {assetNames[symbol] || asset?.name || symbol}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(currentVal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetEvolutionChart;
