import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPortfolioStats, getPortfolioAssets } from '../../services/api';
import Button from '../ui/Button';
import StatsCards from './StatsCards';
import PortfolioChart from './PortfolioChart';
import AssetEvolutionChart from './AssetEvolutionChart';
import AssetsTable from './AssetsTable';
import AllocationPieChart from './AllocationPieChart';
import RecentTransactions from './RecentTransactions';
import PriceTicker from './PriceTicker';

function Dashboard() {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, assetsRes] = await Promise.all([
        getPortfolioStats(),
        getPortfolioAssets(),
      ]);
      setStats(statsRes.data);
      setAssets(assetsRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Afficher le message de succès après ajout d'une transaction
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Effacer le message après 5 secondes
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      // Nettoyer le state pour éviter de réafficher au refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 dark:border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-400">Chargement du portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Reessayer
        </button>
      </div>
    );
  }

  // Etat vide : pas d'actifs
  if (!stats || stats.totalInvested === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-2">
          Votre portfolio est vide
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Ajoutez votre premiere transaction pour commencer a suivre vos investissements crypto et traditionnels.
        </p>
        <Button as={Link} to="/add" size="lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ajouter une transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500
                      dark:border-green-400 text-green-800 dark:text-green-200
                      px-6 py-4 rounded-lg flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">&#x2705;</span>
          <p className="flex-1 font-semibold">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800
                     dark:hover:text-green-200 text-xl"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Dashboard</h1>
        <Button as={Link} to="/add" size="sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ajouter
        </Button>
      </div>

      {/* Bandeau defilant des prix */}
      <PriceTicker />

      {/* Cartes statistiques */}
      <StatsCards stats={stats} />

      {/* Graphique d'evolution globale */}
      <PortfolioChart />

      {/* Graphique d'evolution par actif */}
      <AssetEvolutionChart assets={assets} />

      {/* Section deux colonnes : Pie chart + Transactions recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart />
        <RecentTransactions />
      </div>

      {/* Tableau des actifs */}
      <AssetsTable assets={assets} />
    </div>
  );
}

export default Dashboard;
