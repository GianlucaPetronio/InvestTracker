# Backend - Crypto Portfolio API

API REST Express pour la gestion du portfolio d'investissement.

## Commandes

```bash
npm install     # Installer les dependances
npm run dev     # Lancer en mode developpement (nodemon)
npm start       # Lancer en production
npm run db:init # Initialiser la base PostgreSQL
```

## Variables d'environnement

Copier `.env.example` vers `.env` et configurer :

- `POSTGRES_*` : Connexion PostgreSQL
- `ETHERSCAN_API_KEY` : Cle API Etherscan (pour les transactions ETH)
- `BSCSCAN_API_KEY` : Cle API BscScan (pour les transactions BSC)
- `COINGECKO_API_KEY` : Cle API CoinGecko (optionnelle)
- `PORT` : Port du serveur (defaut: 5000)

## Architecture

- `src/server.js` : Point d'entree, configuration Express et middlewares
- `src/routes/` : Definition des endpoints REST
- `src/services/` : Logique metier (appels blockchain, prix, cache)
- `src/config/` : Configuration base de donnees et APIs externes
- `src/models/` : Schema SQL
- `src/utils/` : Fonctions de validation
