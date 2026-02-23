import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';
import Button from '../ui/Button';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center flex flex-col items-center">
          <Logo className="mb-4" />
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {isRegister ? 'Creer un compte' : 'Connexion a votre compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-black/20 rounded-xl p-8 space-y-6 border border-gray-200/50 dark:border-slate-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                placeholder="Votre nom"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              placeholder="Minimum 6 caracteres"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            loading={submitting}
            size="lg"
            className="w-full"
          >
            {submitting
              ? 'Chargement...'
              : isRegister ? "S'inscrire" : 'Se connecter'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              {isRegister
                ? 'Deja un compte ? Se connecter'
                : "Pas de compte ? S'inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
