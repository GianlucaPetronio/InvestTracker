import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { getPortfolioHistory, getPortfolioStats } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';
import { useTheme } from '../../contexts/ThemeContext';

const PERIODS = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1A' },
  { key: 'ALL', label: 'Tout' },
];

function PortfolioChart() {
  const { dark } = useTheme();
  const [data, setData] = useState([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [period, setPeriod] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [historyRes, statsRes] = await Promise.all([
          getPortfolioHistory(period),
          getPortfolioStats(),
        ]);

        const formatted = historyRes.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          }),
          rawDate: item.date,
          value: item.value,
        }));

        setData(formatted);
        setTotalInvested(statsRes.data.totalInvested);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  // Couleurs adaptatives pour Recharts
  const gridColor = dark ? '#374151' : '#f3f4f6';
  const tickColor = dark ? '#9ca3af' : '#9ca3af';
  const axisColor = dark ? '#4b5563' : '#e5e7eb';
  const refColor = dark ? '#6b7280' : '#9ca3af';

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Evolution du portfolio
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

      {loading ? (
        <div className="h-72 flex items-center justify-center text-gray-400 dark:text-gray-500">
          Chargement...
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400 dark:text-gray-500">
          Pas assez de donnees pour afficher le graphique
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={dark ? 0.3 : 0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val.toString();
              }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {totalInvested > 0 && (
              <ReferenceLine
                y={totalInvested}
                stroke={refColor}
                strokeDasharray="6 4"
                label={{
                  value: 'Investi',
                  position: 'right',
                  fill: refColor,
                  fontSize: 12,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              fill="url(#colorValue)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: dark ? '#1f2937' : '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PortfolioChart;
