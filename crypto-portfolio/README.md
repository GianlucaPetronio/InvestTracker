# Crypto Portfolio Tracker

Application de gestion de portfolio d'investissement crypto et actifs financiers avec recuperation automatique des donnees blockchain.

## Fonctionnalites

- **Ajout via blockchain** : Collez un hash de transaction (BTC, ETH, BSC) et les donnees sont recuperees automatiquement
- **Ajout manuel** : Saisissez manuellement vos achats d'actions, indices, ou cryptos
- **Dashboard** : Vue globale avec total investi, valeur actuelle, P&L
- **Graphiques** : Evolution du portfolio dans le temps (Recharts)
- **Historique** : Liste filtrable de toutes les transactions

## Stack technique

| Couche   | Technologies                          |
|----------|---------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios |
| Backend  | Node.js, Express, PostgreSQL          |
| APIs     | Blockchain.com, Etherscan, BscScan, CoinGecko |

## Installation

### Pre-requis

- Node.js >= 18
- PostgreSQL >= 14
- npm ou yarn

### 1. Cloner le projet

```bash
git clone <repo-url>
cd crypto-portfolio
```

### 2. Configurer la base de donnees

```bash
# Creer la base et les tables
psql -U postgres -f backend/src/models/schema.sql
```

### 3. Configurer le backend

```bash
cd backend
npm install

# Copier et editer les variables d'environnement
cp .env.example .env
# Editer .env avec vos parametres PostgreSQL et cles API
```

### 4. Configurer le frontend

```bash
cd frontend
npm install
```

### 5. Lancer le projet

Dans deux terminaux separes :

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Le frontend est accessible sur `http://localhost:5173` et le backend sur `http://localhost:5000`.

## APIs blockchain utilisees

| Blockchain | API              | Cle requise |
|------------|------------------|-------------|
| Bitcoin    | Blockchain.com   | Non         |
| Ethereum   | Etherscan.io     | Oui (gratuite) |
| BSC        | BscScan.com      | Oui (gratuite) |
| Prix       | CoinGecko        | Optionnelle |

### Obtenir les cles API

- **Etherscan** : Creer un compte sur [etherscan.io](https://etherscan.io/apis) et generer une cle API gratuite
- **BscScan** : Creer un compte sur [bscscan.com](https://bscscan.com/apis) et generer une cle API gratuite
- **CoinGecko** : L'API publique fonctionne sans cle (limite de taux applicable)

## Flux d'ajout d'une transaction blockchain

1. L'utilisateur selectionne la blockchain (BTC, ETH, BSC)
2. Il colle le hash de transaction
3. Clic sur "Verifier" → appel `POST /api/blockchain/verify`
4. Le backend interroge l'API de la blockchain correspondante
5. Les donnees sont affichees en previsualisation (quantite, frais, date, prix historique)
6. L'utilisateur confirme → la transaction est enregistree en base

## Endpoints API

### Transactions
- `GET /api/transactions` - Liste des transactions (filtres: asset_symbol, asset_type)
- `GET /api/transactions/:id` - Detail d'une transaction
- `POST /api/transactions` - Creer une transaction
- `PUT /api/transactions/:id` - Modifier une transaction
- `DELETE /api/transactions/:id` - Supprimer une transaction

### Assets
- `GET /api/assets` - Liste des actifs avec totaux agreges
- `GET /api/assets/:symbol` - Detail d'un actif avec prix actuel
- `GET /api/assets/prices/current` - Prix actuels de tous les cryptos

### Portfolio
- `GET /api/portfolio/summary` - Resume global (total investi, valeur, P&L)
- `GET /api/portfolio/allocation` - Repartition par actif
- `GET /api/portfolio/history` - Historique d'evolution

### Blockchain
- `POST /api/blockchain/verify` - Verifier un hash et recuperer les details

## Structure du projet

```
crypto-portfolio/
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── services/        # Appels API (Axios)
│   │   └── utils/           # Fonctions de calcul
│   └── ...config files
│
├── backend/
│   ├── src/
│   │   ├── routes/          # Routes Express
│   │   ├── services/        # Logique metier (blockchain, prix, cache)
│   │   ├── config/          # Configuration DB et APIs
│   │   ├── models/          # Schema SQL
│   │   └── utils/           # Validation
│   └── ...config files
│
└── README.md
```
