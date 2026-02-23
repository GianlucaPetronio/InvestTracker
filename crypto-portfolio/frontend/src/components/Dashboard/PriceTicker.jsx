import { useState, useEffect } from 'react';
import { getCurrentPrices } from '../../services/api';
import { formatCurrency, formatPercent } from '../../utils/calculations';

const LOGO_SYMBOL_MAP = {
  BTC: 'btc', ETH: 'eth', BNB: 'bnb', SOL: 'sol',
  ADA: 'ada', DOT: 'dot', AVAX: 'avax', MATIC: 'matic',
  LINK: 'link', UNI: 'uni', DOGE: 'doge', XRP: 'xrp',
  LTC: 'ltc', ATOM: 'atom', NEAR: 'near', APT: 'apt',
  ARB: 'arb', OP: 'op', FTM: 'ftm', ALGO: 'algo', TRX: 'trx',
};

function getLogoUrl(symbol) {
  const s = LOGO_SYMBOL_MAP[symbol] || symbol.toLowerCase();
  return `https://assets.coincap.io/assets/icons/${s}@2x.png`;
}

function PriceTicker() {
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      try {
        const res = await getCurrentPrices();
        if (!cancelled) setPrices(res.data);
      } catch {
        // silently ignore — ticker is non-critical
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!prices || Object.keys(prices).length === 0) return null;

  const items = Object.entries(prices).map(([symbol, data]) => (
    <div key={symbol} className="inline-flex items-center gap-2 px-4 shrink-0">
      <img
        src={getLogoUrl(symbol)}
        alt={symbol}
        className="w-5 h-5 rounded-full"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <span className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
        {symbol}
      </span>
      <span className="text-gray-600 dark:text-slate-300 text-sm">
        {formatCurrency(data.price)}
      </span>
      <span className={`text-sm font-medium ${
        data.change24h >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}>
        {formatPercent(data.change24h ?? 0)}
      </span>
    </div>
  ));

  return (
    <div className="relative overflow-hidden rounded-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-gray-200 dark:border-slate-700">
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track flex items-center py-2.5 whitespace-nowrap w-max cursor-default">
        {items}
        {items}
      </div>
    </div>
  );
}

export default PriceTicker;
