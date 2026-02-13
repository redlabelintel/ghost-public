"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSystemHealth = exports.logError = exports.logRiskEvent = exports.logSentiment = exports.logPosition = exports.logTrade = exports.riskLogger = exports.sentimentLogger = exports.tradingLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config/config");
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
        metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: config_1.CONFIG.LOG_LEVEL,
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat
        }),
        new winston_1.default.transports.File({
            filename: 'logs/app.log',
            format: fileFormat,
            maxsize: 50 * 1024 * 1024,
            maxFiles: 5
        }),
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 3
        }),
        new winston_1.default.transports.File({
            filename: 'logs/trading.log',
            format: fileFormat,
            maxsize: 100 * 1024 * 1024,
            maxFiles: 10
        })
    ]
});
exports.tradingLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.label({ label: 'TRADING' })),
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/trades.log',
            maxsize: 50 * 1024 * 1024,
            maxFiles: 10
        })
    ]
});
exports.sentimentLogger = winston_1.default.createLogger({
    level: 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.label({ label: 'SENTIMENT' })),
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/sentiment.log',
            maxsize: 25 * 1024 * 1024,
            maxFiles: 5
        })
    ]
});
exports.riskLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.label({ label: 'RISK' })),
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/risk.log',
            maxsize: 25 * 1024 * 1024,
            maxFiles: 5
        })
    ]
});
const fs_1 = require("fs");
const path_1 = require("path");
try {
    (0, fs_1.mkdirSync)((0, path_1.dirname)('logs/app.log'), { recursive: true });
}
catch (error) {
}
const logTrade = (trade) => {
    exports.tradingLogger.info('Trade executed', trade);
    exports.logger.info(`🔄 Trade: ${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price}`, { trade });
};
exports.logTrade = logTrade;
const logPosition = (position) => {
    exports.tradingLogger.info('Position updated', position);
    exports.logger.info(`📊 Position: ${position.symbol} ${position.side} P&L: ${position.unrealized_pnl}`, { position });
};
exports.logPosition = logPosition;
const logSentiment = (sentiment) => {
    exports.sentimentLogger.debug('Sentiment calculated', sentiment);
    exports.logger.debug(`💭 Sentiment: ${sentiment.symbol} coefficient: ${sentiment.coefficient}`, { sentiment });
};
exports.logSentiment = logSentiment;
const logRiskEvent = (event) => {
    exports.riskLogger.warn('Risk event triggered', event);
    exports.logger.warn(`⚠️  Risk: ${event.event_type} ${event.symbol} - ${event.action_taken}`, { event });
};
exports.logRiskEvent = logRiskEvent;
const logError = (error, context) => {
    exports.logger.error(`❌ ${context || 'Error'}:`, {
        message: error.message,
        stack: error.stack,
        context
    });
};
exports.logError = logError;
const logSystemHealth = (component, status, metadata) => {
    const level = status === 'HEALTHY' ? 'info' : status === 'DEGRADED' ? 'warn' : 'error';
    exports.logger.log(level, `🏥 Health: ${component} ${status}`, { component, status, ...metadata });
};
exports.logSystemHealth = logSystemHealth;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map