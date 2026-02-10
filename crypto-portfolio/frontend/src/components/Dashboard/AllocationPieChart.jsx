import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getPortfolioAllocation } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

function AllocationPieChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getPortfolioAllocation();
        setData(response.data);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
        {item.fullName && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{item.fullName}</p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {formatCurrency(item.value)}
        </p>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {item.percent.toFixed(1)}%
        </p>
      </div>
    );
  }

  function renderLabel({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) {
    if (percent < 5) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x} y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {percent.toFixed(0)}%
      </text>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Repartition</h2>
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          Chargement...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Repartition</h2>
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          Aucune donnee
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Repartition</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={2}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AllocationPieChart;
