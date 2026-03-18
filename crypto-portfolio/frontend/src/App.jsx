import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import AddTransactionWizard from './components/TransactionForm/AddTransactionWizard';
import TransactionHistory from './components/TransactionHistory';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/Auth/LoginPage';

function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">404</h1>
      <p className="text-gray-600 dark:text-slate-400 mb-6">Page non trouvee</p>
      <Link
        to="/"
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all inline-block"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}

function App() {
  const { pathname } = useLocation();

  // Login page renders without Layout
  if (pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <Layout><AddTransactionWizard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout><TransactionHistory /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </div>
  );
}

export default App;
