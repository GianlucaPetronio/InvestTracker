// =============================================================================
// Server Express - Point d'entrée du backend
// =============================================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const transactionsRouter = require('./routes/transactions');
const assetsRouter = require('./routes/assets');
const portfolioRouter = require('./routes/portfolio');
const blockchainRouter = require('./routes/blockchain');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Middlewares
// ---------------------------------------------------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging simple des requêtes
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/transactions', transactionsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/blockchain', blockchainRouter);

// Route de santé
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Gestion des erreurs globale
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('Erreur serveur:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// ---------------------------------------------------------------------------
// Démarrage du serveur
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
});
