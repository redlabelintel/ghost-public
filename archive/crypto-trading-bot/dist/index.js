"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const TradingBot_1 = require("./trading/TradingBot");
const logger_1 = require("./utils/logger");
const config_1 = require("./config/config");
dotenv_1.default.config();
async function main() {
    try {
        logger_1.logger.info('🚀 Starting Crypto Trading Bot...');
        logger_1.logger.info(`Mode: ${config_1.CONFIG.TRADING_MODE}`);
        logger_1.logger.info(`Initial Capital: $${config_1.CONFIG.INITIAL_CAPITAL.toLocaleString()}`);
        logger_1.logger.info(`Max Positions: ${config_1.CONFIG.MAX_POSITIONS}`);
        const bot = new TradingBot_1.TradingBot();
        process.on('SIGINT', async () => {
            logger_1.logger.info('🛑 Graceful shutdown initiated...');
            await bot.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            logger_1.logger.info('🛑 Graceful shutdown initiated...');
            await bot.stop();
            process.exit(0);
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('❌ Uncaught exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        await bot.start();
        logger_1.logger.info('✅ Trading bot is running. Press Ctrl+C to stop.');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start trading bot:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map