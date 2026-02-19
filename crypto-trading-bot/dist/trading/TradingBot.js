"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingBot = void 0;
const events_1 = require("events");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const DatabaseManager_1 = require("../data/DatabaseManager");
const ExchangeManager_1 = require("../data/ExchangeManager");
const MidCapMomentumStrategy_1 = require("../strategies/MidCapMomentumStrategy");
const NarrativeIntelligence_1 = require("../narrative/NarrativeIntelligence");
const RiskManager_1 = require("../risk/RiskManager");
const PerformanceMonitor_1 = require("../monitoring/PerformanceMonitor");
const PositionManager_1 = require("./PositionManager");
const OrderExecutor_1 = require("../execution/OrderExecutor");
class TradingBot extends events_1.EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.updateInterval = null;
        this.lastHealthCheck = new Date();
        this.errorCount = 0;
        this.maxErrors = 10;
        (0, config_1.validateConfig)();
        this.database = new DatabaseManager_1.DatabaseManager(config_1.CONFIG);
        this.exchangeManager = new ExchangeManager_1.ExchangeManager(config_1.CONFIG);
        this.strategy = new MidCapMomentumStrategy_1.MidCapMomentumStrategy();
        this.narrativeIntelligence = new NarrativeIntelligence_1.NarrativeIntelligence(config_1.CONFIG);
        this.riskManager = new RiskManager_1.RiskManager(config_1.CONFIG, this.database);
        this.performanceMonitor = new PerformanceMonitor_1.PerformanceMonitor(this.database);
        this.positionManager = new PositionManager_1.PositionManager(this.database, this.riskManager);
        this.orderExecutor = new OrderExecutor_1.OrderExecutor(this.exchangeManager, this.database, config_1.CONFIG);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.riskManager.on('circuit_breaker', () => {
            logger_1.logger.warn('🚨 Circuit breaker activated - stopping trading');
            this.pauseTrading();
        });
        this.riskManager.on('position_limit', (data) => {
            logger_1.logger.warn('⚠️  Position limit reached', data);
            this.emit('risk_alert', { type: 'position_limit', data });
        });
        this.exchangeManager.on('connection_lost', (exchange) => {
            logger_1.logger.error(`❌ Lost connection to ${exchange}`);
            this.handleConnectionLoss(exchange);
        });
        this.exchangeManager.on('connection_restored', (exchange) => {
            logger_1.logger.info(`✅ Connection restored to ${exchange}`);
            this.handleConnectionRestored(exchange);
        });
        this.strategy.on('signal', (signal) => {
            logger_1.logger.debug('📡 Strategy signal received', signal);
            this.handleStrategySignal(signal);
        });
        this.narrativeIntelligence.on('sentiment_update', (update) => {
            logger_1.logger.debug('💭 Sentiment update', update);
            this.emit('sentiment_update', update);
        });
        this.narrativeIntelligence.on('high_impact_news', (news) => {
            logger_1.logger.warn('📰 High impact news detected', news);
            this.handleHighImpactNews(news);
        });
    }
    async start() {
        try {
            logger_1.logger.info('🚀 Starting trading bot initialization...');
            await this.database.connect();
            logger_1.logger.info('✅ Database connected');
            await this.exchangeManager.connect();
            logger_1.logger.info('✅ Exchange connections established');
            if (config_1.CONFIG.ENABLE_SENTIMENT) {
                await this.narrativeIntelligence.start();
                logger_1.logger.info('✅ Narrative intelligence started');
            }
            await this.positionManager.loadPositions();
            logger_1.logger.info(`✅ Loaded ${this.positionManager.getActivePositionCount()} active positions`);
            this.performanceMonitor.start();
            logger_1.logger.info('✅ Performance monitoring started');
            this.startMainLoop();
            this.isRunning = true;
            logger_1.logger.info('🎯 Trading bot is now active');
            await this.performHealthCheck();
        }
        catch (error) {
            (0, logger_1.logError)(error, 'TradingBot.start');
            throw error;
        }
    }
    async stop() {
        try {
            logger_1.logger.info('🛑 Stopping trading bot...');
            this.isRunning = false;
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            if (config_1.CONFIG.ENABLE_SENTIMENT) {
                await this.narrativeIntelligence.stop();
                logger_1.logger.info('✅ Narrative intelligence stopped');
            }
            this.performanceMonitor.stop();
            logger_1.logger.info('✅ Performance monitoring stopped');
            await this.exchangeManager.disconnect();
            logger_1.logger.info('✅ Exchange connections closed');
            await this.database.disconnect();
            logger_1.logger.info('✅ Database disconnected');
            logger_1.logger.info('✅ Trading bot stopped successfully');
        }
        catch (error) {
            (0, logger_1.logError)(error, 'TradingBot.stop');
        }
    }
    startMainLoop() {
        this.updateInterval = setInterval(() => this.runTradingCycle(), config_1.CONFIG.UPDATE_INTERVAL_MS);
        logger_1.logger.info(`🔄 Main trading loop started (${config_1.CONFIG.UPDATE_INTERVAL_MS}ms interval)`);
    }
    async runTradingCycle() {
        try {
            if (!this.isRunning)
                return;
            if (Date.now() - this.lastHealthCheck.getTime() > 5 * 60 * 1000) {
                await this.performHealthCheck();
            }
            await this.updateMarketData();
            await this.positionManager.updatePositions();
            await this.checkExitSignals();
            if (!this.riskManager.isCircuitBreakerActive()) {
                await this.checkEntrySignals();
            }
            this.performanceMonitor.updateMetrics();
            this.errorCount = 0;
        }
        catch (error) {
            this.errorCount++;
            (0, logger_1.logError)(error, 'TradingBot.runTradingCycle');
            if (this.errorCount >= this.maxErrors) {
                logger_1.logger.error('❌ Too many consecutive errors, stopping bot');
                await this.stop();
            }
        }
    }
    async updateMarketData() {
        try {
            const symbols = await this.database.getActiveSymbols();
            await this.exchangeManager.updatePrices(symbols);
        }
        catch (error) {
            (0, logger_1.logError)(error, 'TradingBot.updateMarketData');
        }
    }
    async checkExitSignals() {
        const positions = this.positionManager.getActivePositions();
        for (const position of positions) {
            try {
                const shouldExit = await this.strategy.shouldExit(position);
                if (shouldExit.exit) {
                    logger_1.logger.info(`🚪 Exit signal for ${position.symbol}: ${shouldExit.reason}`);
                    await this.orderExecutor.closePosition(position, shouldExit.reason || 'Strategy exit signal');
                }
            }
            catch (error) {
                (0, logger_1.logError)(error, `TradingBot.checkExitSignals.${position.symbol}`);
            }
        }
    }
    async checkEntrySignals() {
        try {
            const symbols = await this.database.getActiveSymbols();
            for (const symbol of symbols) {
                if (this.positionManager.hasPosition(symbol)) {
                    continue;
                }
                if (!this.riskManager.canTakeNewPosition(symbol)) {
                    continue;
                }
                const signal = await this.strategy.generateSignal(symbol);
                if (signal.action === 'BUY' && signal.confidence > 75) {
                    logger_1.logger.info(`📈 Entry signal for ${symbol}: confidence ${signal.confidence}%`);
                    const positionSize = this.riskManager.calculatePositionSize(symbol, signal.entry_price, signal.stop_loss, signal.sentiment_coefficient);
                    if (positionSize > 0) {
                        await this.orderExecutor.openPosition({
                            symbol,
                            side: 'LONG',
                            size: positionSize,
                            entry_price: signal.entry_price,
                            stop_loss: signal.stop_loss,
                            take_profit: signal.take_profit,
                            strategy_id: 'mcrm',
                            entry_reason: signal.reason,
                            sentiment_coefficient: signal.sentiment_coefficient,
                            technical_score: signal.confidence
                        });
                    }
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)(error, 'TradingBot.checkEntrySignals');
        }
    }
    async handleStrategySignal(signal) {
        logger_1.logger.debug('📊 Processing strategy signal', signal);
        this.emit('strategy_signal', signal);
    }
    async handleHighImpactNews(news) {
        logger_1.logger.warn('📰 Processing high impact news', news);
        if (news.symbol) {
            this.riskManager.addTemporaryRestriction(news.symbol, 30 * 60 * 1000);
        }
        this.emit('high_impact_news', news);
    }
    async handleConnectionLoss(exchange) {
        logger_1.logger.error(`❌ Connection lost to ${exchange}`);
        (0, logger_1.logSystemHealth)(exchange, 'DOWN');
        this.pauseTrading();
    }
    async handleConnectionRestored(exchange) {
        logger_1.logger.info(`✅ Connection restored to ${exchange}`);
        (0, logger_1.logSystemHealth)(exchange, 'HEALTHY');
        if (await this.isSystemHealthy()) {
            this.resumeTrading();
        }
    }
    pauseTrading() {
        logger_1.logger.warn('⏸️  Trading paused');
        this.isRunning = false;
        this.emit('trading_paused');
    }
    resumeTrading() {
        logger_1.logger.info('▶️  Trading resumed');
        this.isRunning = true;
        this.emit('trading_resumed');
    }
    async performHealthCheck() {
        try {
            this.lastHealthCheck = new Date();
            const dbHealthy = await this.database.isHealthy();
            (0, logger_1.logSystemHealth)('database', dbHealthy ? 'HEALTHY' : 'DOWN');
            const exchangeHealthy = await this.exchangeManager.isHealthy();
            (0, logger_1.logSystemHealth)('exchange', exchangeHealthy ? 'HEALTHY' : 'DOWN');
            if (config_1.CONFIG.ENABLE_SENTIMENT) {
                const narrativeHealthy = await this.narrativeIntelligence.isHealthy();
                (0, logger_1.logSystemHealth)('narrative', narrativeHealthy ? 'HEALTHY' : 'DOWN');
            }
            const overallHealth = await this.isSystemHealthy();
            if (!overallHealth && this.isRunning) {
                this.pauseTrading();
            }
            else if (overallHealth && !this.isRunning) {
                this.resumeTrading();
            }
        }
        catch (error) {
            (0, logger_1.logError)(error, 'TradingBot.performHealthCheck');
        }
    }
    async isSystemHealthy() {
        const dbHealthy = await this.database.isHealthy();
        const exchangeHealthy = await this.exchangeManager.isHealthy();
        const narrativeHealthy = config_1.CONFIG.ENABLE_SENTIMENT
            ? await this.narrativeIntelligence.isHealthy()
            : true;
        return dbHealthy && exchangeHealthy && narrativeHealthy;
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            activePositions: this.positionManager.getActivePositionCount(),
            totalPnL: this.positionManager.getTotalPnL(),
            dailyPnL: this.performanceMonitor.getDailyPnL(),
            lastUpdate: new Date(),
            systemHealth: this.isRunning ? 'HEALTHY' : 'DOWN'
        };
    }
    getActivePositions() {
        return this.positionManager.getActivePositions();
    }
    async getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }
    async emergencyStop() {
        logger_1.logger.error('🚨 EMERGENCY STOP ACTIVATED');
        const positions = this.positionManager.getActivePositions();
        for (const position of positions) {
            try {
                await this.orderExecutor.closePosition(position, 'Emergency stop');
            }
            catch (error) {
                (0, logger_1.logError)(error, `EmergencyStop.${position.symbol}`);
            }
        }
        await this.stop();
        this.emit('emergency_stop');
    }
}
exports.TradingBot = TradingBot;
//# sourceMappingURL=TradingBot.js.map