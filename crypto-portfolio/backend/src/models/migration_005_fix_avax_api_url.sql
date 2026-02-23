-- =============================================================================
-- Migration 005 : Mise a jour de l'URL API AVAX (SnowTrace -> SnowScan)
-- =============================================================================
-- SnowTrace a ete deprecie et remplace par SnowScan (equipe Etherscan).
-- L'ancienne URL https://api.snowtrace.io/api ne repond plus correctement.

UPDATE blockchains
SET api_url = 'https://api.snowscan.xyz/api',
    api_key_env_var = 'SNOWSCAN_API_KEY',
    updated_at = CURRENT_TIMESTAMP
WHERE symbol = 'AVAX';
