import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';

function NavLink({ to, children, onClick }) {
  const { pathname } = useLocation();
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`transition-colors ${
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-semibold'
          : 'text-gray-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
      }`}
    >
      {children}
    </Link>
  );
}

function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [mobileOpen]);

  if (!user) return null;

  return (
    <nav
      ref={menuRef}
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Logo />

          {/* Desktop nav (>=md) */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/add">Ajouter</NavLink>
            <NavLink to="/history">Historique</NavLink>
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {user.name || user.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Deconnexion
            </button>
          </div>

          {/* Mobile (< md): theme toggle + burger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <NavLink to="/" onClick={() => setMobileOpen(false)}>
              <div className="py-2">Dashboard</div>
            </NavLink>
            <NavLink to="/add" onClick={() => setMobileOpen(false)}>
              <div className="py-2">Ajouter</div>
            </NavLink>
            <NavLink to="/history" onClick={() => setMobileOpen(false)}>
              <div className="py-2">Historique</div>
            </NavLink>
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {user.name || user.email}
              </span>
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
