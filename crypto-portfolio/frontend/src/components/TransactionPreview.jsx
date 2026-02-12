import { formatCurrency, formatQuantity } from '../utils/calculations';

/**
 * Affiche une prévisualisation des données récupérées depuis la blockchain
 * avant confirmation et enregistrement.
 */
function TransactionPreview({ data, amountPaid, onAmountPaidChange }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          Donnees de la blockchain
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Blockchain" value={data.blockchain} />
          <Detail label="Statut" value={data.confirmations} />
          <Detail label="Date" value={data.timestamp ? new Date(data.timestamp).toLocaleString('fr-FR') : 'N/A'} />
          <Detail label="Bloc" value={data.blockHeight || 'N/A'} />
          <Detail label="Quantite" value={formatQuantity(data.quantity)} />
          <Detail label="Frais reseau" value={`${formatQuantity(data.fees)} (informatif)`} />
          {data.from && <Detail label="De" value={truncateAddress(data.from)} />}
          {data.to && <Detail label="Vers" value={truncateAddress(data.to)} />}
          <Detail
            label="Prix spot au moment"
            value={data.priceAtTime ? formatCurrency(data.priceAtTime) : 'Non disponible'}
          />
          <Detail
            label="Valeur estimee on-chain"
            value={data.calculatedValue ? `${formatCurrency(data.calculatedValue)} (informatif)` : 'Non disponible'}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-600 font-mono break-all">
            Hash: {data.hash}
          </p>
        </div>
      </div>

      {/* Montant reellement paye - SOURCE DE VERITE */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <label className="block text-sm font-semibold text-green-800 mb-2">
          Montant reellement paye (EUR)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            value={amountPaid}
            onChange={(e) => onAmountPaidChange(e.target.value)}
            className="w-full px-3 py-2 text-xl font-bold border-2 border-green-400
                     rounded-lg bg-white text-green-700
                     focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">EUR</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Saisissez le montant exact que vous avez paye (virement, CB, etc.). C'est cette valeur qui sera utilisee pour vos calculs de performance.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

function truncateAddress(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default TransactionPreview;
