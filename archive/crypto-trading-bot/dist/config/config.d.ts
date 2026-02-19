export interface TradingConfig {
    TRADING_MODE: 'paper' | 'live';
    INITIAL_CAPITAL: number;
    MAX_POSITIONS: number;
    BASE_RISK_PER_TRADE: number;
    MAX_RISK_PER_TRADE: number;
    MAX_SECTOR_ALLOCATION: number;
    MAX_PORTFOLIO_EXPOSURE: number;
    ENABLE_SENTIMENT: boolean;
    SENTIMENT_WEIGHT: number;
    UPDATE_INTERVAL_MS: number;
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    BINANCE_API_KEY: string;
    BINANCE_SECRET_KEY: string;
    BINANCE_TESTNET: boolean;
    BYBIT_API_KEY: string;
    BYBIT_SECRET_KEY: string;
    BYBIT_TESTNET: boolean;
    TWITTER_API_KEY: string;
    TWITTER_API_SECRET: string;
    TWITTER_BEARER_TOKEN: string;
    MAX_DAILY_LOSS: number;
    CIRCUIT_BREAKER_THRESHOLD: number;
    LOG_LEVEL: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    NODE_ENV: string;
    DRY_RUN: boolean;
}
export declare const CONFIG: TradingConfig;
export declare function validateConfig(): void;
//# sourceMappingURL=config.d.ts.map