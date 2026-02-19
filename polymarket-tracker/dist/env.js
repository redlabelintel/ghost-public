// Environment validation utilities
export function validateConfig(config) {
    const errors = [];
    // Validate URLs
    try {
        new URL(config.dataApi);
    }
    catch {
        errors.push(`Invalid POLYMARKET_API_URL: ${config.dataApi}`);
    }
    // Validate numeric ranges
    if (config.clusterWindowHours < 1 || config.clusterWindowHours > 24) {
        errors.push(`CLUSTER_WINDOW_HOURS must be 1-24, got ${config.clusterWindowHours}`);
    }
    if (config.minWallets < 2) {
        errors.push(`MIN_WALLETS must be >= 2, got ${config.minWallets}`);
    }
    if (config.minConviction < 50 || config.minConviction > 100) {
        errors.push(`MIN_CONVICTION must be 50-100, got ${config.minConviction}`);
    }
    if (config.rateMs < 100) {
        errors.push(`RATE_LIMIT_MS must be >= 100ms, got ${config.rateMs}`);
    }
    // Validate Telegram config (if provided)
    if (config.telegramToken && !config.telegramToken.includes(':')) {
        errors.push('TELEGRAM_BOT_TOKEN format invalid (should be number:string)');
    }
    if (config.telegramChatId && !config.telegramChatId.match(/^-?\d+$/)) {
        errors.push('TELEGRAM_CHAT_ID must be numeric');
    }
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}
//# sourceMappingURL=env.js.map