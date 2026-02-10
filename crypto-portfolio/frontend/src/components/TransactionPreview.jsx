import { formatCurrency, formatQuantity } from '../utils/calculations';

/**
 * Affiche une prévisualisation des données récupérées depuis la blockchain
 * avant confirmation et enregistrement.
 */
function TransactionPreview({ data }) {
  if (!data) return null;

  return (
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
        <Detail label="Frais" value={formatQuantity(data.fees)} />
        {data.from && <Detail label="De" value={truncateAddress(data.from)} />}
        {data.to && <Detail label="Vers" value={truncateAddress(data.to)} />}
        <Detail
          label="Prix au moment"
          value={data.priceAtTime ? formatCurrency(data.priceAtTime) : 'Non disponible'}
        />
        <Detail
          label="Valeur estimee"
          value={data.calculatedValue ? formatCurrency(data.calculatedValue) : 'Non disponible'}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-600 font-mono break-all">
          Hash: {data.hash}
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
