// =============================================================================
// Server Express - Point d'entrée du backend
// =============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
const assetsRouter = require('./routes/assets');
const portfolioRouter = require('./routes/portfolio');
const blockchainRouter = require('./routes/blockchain');
const blockchainsRouter = require('./routes/blockchains');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Middlewares de securite
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, veuillez reessayer plus tard' },
});
app.use('/api/', limiter);

// Rate limiting strict pour les ecritures
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, veuillez reessayer plus tard' },
});
app.use('/api/transactions', writeLimiter);
app.use('/api/blockchain/validate', writeLimiter);

app.use(express.json({ limit: '1mb' }));

// Logging des requetes (conditionnel)
if (!IS_PRODUCTION) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ---------------------------------------------------------------------------
// Rate limiting strict pour l'authentification
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, veuillez reessayer plus tard' },
});
app.use('/api/auth', authLimiter);

// ---------------------------------------------------------------------------
// Routes publiques (sans auth)
// ---------------------------------------------------------------------------
app.use('/api/auth', authRouter);

// ---------------------------------------------------------------------------
// Routes protegees (auth requise)
// ---------------------------------------------------------------------------
app.use('/api/transactions', authenticateToken, transactionsRouter);
app.use('/api/assets', authenticateToken, assetsRouter);
app.use('/api/portfolio', authenticateToken, portfolioRouter);
app.use('/api/blockchain', authenticateToken, blockchainRouter);
app.use('/api/blockchains', authenticateToken, blockchainsRouter);

// Route de sante
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Gestion des erreurs globale
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('Erreur serveur:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'Erreur interne du serveur' : err.message
  });
});

// ---------------------------------------------------------------------------
// Demarrage du serveur
// ---------------------------------------------------------------------------
app.listen(PORT, async () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
  await initDatabase();
});
