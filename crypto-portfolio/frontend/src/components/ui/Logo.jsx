import { Link } from 'react-router-dom';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="32" x2="32" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <rect x="4" y="20" width="6" height="8" rx="1.5" fill="url(#logo-gradient)" opacity="0.6" />
        <rect x="13" y="12" width="6" height="16" rx="1.5" fill="url(#logo-gradient)" opacity="0.8" />
        <rect x="22" y="4" width="6" height="24" rx="1.5" fill="url(#logo-gradient)" />
      </svg>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        Crypto Portfolio
      </span>
    </Link>
  );
}
