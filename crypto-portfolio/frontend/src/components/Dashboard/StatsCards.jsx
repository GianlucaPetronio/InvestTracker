import { formatCurrency, formatPercent } from '../../utils/calculations';

const ICONS = {
  invested: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  value: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pnl: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  performance: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
};

function StatsCards({ stats }) {
  if (!stats) return null;

  const { totalInvested, totalFees = 0, currentValue, profitLoss, profitLossPercent } = stats;
  const isPositive = profitLoss >= 0;

  const cards = [
    {
      label: 'Total Investi',
      value: formatCurrency(totalInvested),
      subText: totalFees > 0 ? `dont ${formatCurrency(totalFees)} de frais` : null,
      icon: ICONS.invested,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Valeur Actuelle',
      value: formatCurrency(currentValue),
      icon: ICONS.value,
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Profit / Perte',
      value: formatCurrency(profitLoss),
      subValue: formatPercent(profitLossPercent),
      icon: ICONS.pnl,
      iconBg: isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      iconColor: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      valueColor: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Performance',
      value: formatPercent(profitLossPercent),
      icon: ICONS.performance,
      iconBg: isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      iconColor: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      valueColor: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      arrow: isPositive ? 'up' : 'down',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold ${card.valueColor || 'text-gray-900 dark:text-gray-100'}`}>
              {card.value}
            </p>
            {card.arrow && (
              <span className={`text-sm font-medium ${card.valueColor}`}>
                {card.arrow === 'up' ? '\u2191' : '\u2193'}
              </span>
            )}
          </div>
          {card.subValue && (
            <p className={`text-sm mt-1 ${card.valueColor || 'text-gray-500 dark:text-gray-400'}`}>
              {card.subValue}
            </p>
          )}
          {card.subText && (
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              {card.subText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
