-- Migration : Activer la recuperation automatique pour XRP, TRX, ADA, DOT
-- Executez ce script sur la base de donnees existante :
-- psql -U postgres -d crypto_portfolio -f src/models/migration_add_xrp_trx_ada_dot.sql

-- XRP : XRPL JSON-RPC
UPDATE blockchains
SET api_type = 'xrp',
    api_url = 'https://s1.ripple.com:51234/',
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'XRP';

-- TRX : TronGrid REST
UPDATE blockchains
SET api_type = 'tron',
    api_url = 'https://api.trongrid.io',
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'TRX';

-- ADA : Koios REST (modele UTXO -> needs_recipient_address = true)
UPDATE blockchains
SET api_type = 'cardano',
    api_url = 'https://api.koios.rest/api/v1',
    needs_recipient_address = true,
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'ADA';

-- DOT : Subscan REST (cle API optionnelle via env SUBSCAN_API_KEY)
UPDATE blockchains
SET api_type = 'subscan',
    api_url = 'https://polkadot.api.subscan.io',
    api_key_env_var = 'SUBSCAN_API_KEY',
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'DOT';
