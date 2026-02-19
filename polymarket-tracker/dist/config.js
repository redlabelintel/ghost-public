import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Environment variable configuration with sensible defaults
function getEnv(key, defaultValue) {
    return process.env[key] ?? defaultValue;
}
function getEnvInt(key, defaultValue) {
    const val = process.env[key];
    if (!val)
        return defaultValue;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed))
        throw new Error(`Invalid ${key}: ${val} (must be integer)`);
    return parsed;
}
export const C = {
    // API configuration
    dataApi: getEnv('POLYMARKET_API_URL', 'https://data-api.polymarket.com'),
    // Database configuration  
    dbPath: getEnv('POLYMARKET_DB_PATH', path.join(__dirname, '..', 'data', 'tracker.db')),
    // Clustering parameters
    clusterWindowHours: getEnvInt('CLUSTER_WINDOW_HOURS', 4),
    minWallets: getEnvInt('MIN_WALLETS', 4),
    minConviction: getEnvInt('MIN_CONVICTION', 50),
    // Rate limiting
    rateMs: getEnvInt('RATE_LIMIT_MS', 500),
    // Optional Telegram configuration (for alerts)
    telegramToken: getEnv('TELEGRAM_BOT_TOKEN', ''),
    telegramChatId: getEnv('TELEGRAM_CHAT_ID', ''),
};
// Validate configuration on module load
import { validateConfig } from './env.js';
validateConfig(C);
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export async function api(url) {
    await sleep(C.rateMs);
    const r = await fetch(url);
    if (!r.ok)
        throw new Error(`${r.status} ${url}`);
    return r.json();
}
//# sourceMappingURL=config.js.map