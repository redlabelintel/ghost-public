"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.validateConfig = validateConfig;
const fs_1 = require("fs");
const yaml_1 = require("yaml");
const path_1 = __importDefault(require("path"));
function loadYamlConfig() {
    try {
        const configPath = path_1.default.join(__dirname, '../../config/default.yaml');
        const configFile = (0, fs_1.readFileSync)(configPath, 'utf8');
        return (0, yaml_1.parse)(configFile);
    }
    catch (error) {
        console.warn('Could not load YAML config, using environment variables only');
        return {};
    }
}
function createConfig() {
    const yamlConfig = loadYamlConfig();
    return {
        TRADING_MODE: (process.env.TRADING_MODE || yamlConfig.trading?.mode || 'paper'),
        INITIAL_CAPITAL: Number(process.env.INITIAL_CAPITAL || yamlConfig.trading?.initial_capital || 10000),
        MAX_POSITIONS: Number(process.env.MAX_POSITIONS || yamlConfig.trading?.max_positions || 12),
        BASE_RISK_PER_TRADE: Number(process.env.BASE_RISK_PER_TRADE || yamlConfig.trading?.base_risk_per_trade || 0.01),
        MAX_RISK_PER_TRADE: Number(process.env.MAX_RISK_PER_TRADE || yamlConfig.trading?.max_risk_per_trade || 0.02),
        MAX_SECTOR_ALLOCATION: Number(process.env.MAX_SECTOR_ALLOCATION || yamlConfig.trading?.max_sector_allocation || 0.25),
        MAX_PORTFOLIO_EXPOSURE: Number(process.env.MAX_PORTFOLIO_EXPOSURE || yamlConfig.trading?.max_portfolio_exposure || 0.60),
        ENABLE_SENTIMENT: process.env.ENABLE_SENTIMENT !== 'false' && yamlConfig.narrative?.enabled !== false,
        SENTIMENT_WEIGHT: Number(process.env.SENTIMENT_WEIGHT || yamlConfig.narrative?.sentiment_weight || 0.4),
        UPDATE_INTERVAL_MS: Number(process.env.UPDATE_INTERVAL_MS || yamlConfig.trading?.update_interval || 60000),
        DATABASE_URL: process.env.DATABASE_URL || '',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_KEY: process.env.SUPABASE_KEY || '',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
        BINANCE_API_KEY: process.env.BINANCE_API_KEY || '',
        BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY || '',
        BINANCE_TESTNET: process.env.BINANCE_TESTNET !== 'false',
        BYBIT_API_KEY: process.env.BYBIT_API_KEY || '',
        BYBIT_SECRET_KEY: process.env.BYBIT_SECRET_KEY || '',
        BYBIT_TESTNET: process.env.BYBIT_TESTNET !== 'false',
        TWITTER_API_KEY: process.env.TWITTER_API_KEY || '',
        TWITTER_API_SECRET: process.env.TWITTER_API_SECRET || '',
        TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN || '',
        MAX_DAILY_LOSS: Number(process.env.MAX_DAILY_LOSS || yamlConfig.risk?.max_daily_loss || 0.05),
        CIRCUIT_BREAKER_THRESHOLD: Number(process.env.CIRCUIT_BREAKER_THRESHOLD || yamlConfig.risk?.circuit_breaker || 0.03),
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
        NODE_ENV: process.env.NODE_ENV || 'development',
        DRY_RUN: process.env.DRY_RUN !== 'false' && process.env.NODE_ENV !== 'production',
    };
}
exports.CONFIG = createConfig();
function validateConfig() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_KEY'
    ];
    const missing = required.filter(key => !exports.CONFIG[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    if (exports.CONFIG.TRADING_MODE === 'live' && exports.CONFIG.DRY_RUN) {
        console.warn('⚠️  WARNING: DRY_RUN is enabled in live trading mode');
    }
    if (!exports.CONFIG.BINANCE_API_KEY && !exports.CONFIG.BYBIT_API_KEY) {
        throw new Error('At least one exchange API key must be configured');
    }
}
//# sourceMappingURL=config.js.map