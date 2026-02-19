"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperTradingEngine = void 0;
const SimpleTradingBot_1 = require("./SimpleTradingBot");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class PaperTradingEngine {
    constructor() {
        this.config = config_1.CONFIG;
        this.bot = new SimpleTradingBot_1.SimpleTradingBot(this.config);
        this.portfolio = {
            balance: 10000,
            positions: [],
            totalPnL: 0,
            totalPnLPercent: 0,
            maxDrawdown: 0,
            winRate: 0,
            trades: 0,
            wins: 0
        };
    }
    async start() {
        logger_1.logger.info('🚀 Starting Paper Trading Engine...');
        logger_1.logger.info(`💰 Virtual Balance: $${this.portfolio.balance.toLocaleString()}`);
        const testAssets = ['OP', 'AAVE', 'NEAR', 'LINK'];
        logger_1.logger.info(`🎯 Testing Assets: ${testAssets.join(', ')}`);
        await this.tradingLoop(testAssets);
    }
    async tradingLoop(assets) {
        logger_1.logger.info('🔄 Starting paper trading monitoring...');
        while (true) {
            try {
                for (const symbol of assets) {
                    await this.processAsset(symbol);
                }
                this.updatePortfolioMetrics();
                this.logPortfolioStatus();
                await this.sleep(5 * 60 * 1000);
            }
            catch (error) {
                logger_1.logger.error('Paper trading loop error:', error);
                await this.sleep(30000);
            }
        }
    }
    async processAsset(symbol) {
        try {
            const currentPrice = await this.getCurrentPrice(symbol);
            const signal = await this.bot.generateSignal(symbol);
            if (signal && signal.action !== 'hold') {
                await this.executePaperTrade(symbol, signal.action, currentPrice, signal.confidence);
            }
            await this.updatePositions(symbol, currentPrice);
        }
        catch (error) {
            logger_1.logger.error(`Error processing ${symbol}:`, error);
        }
    }
    async getCurrentPrice(symbol) {
        const basePrice = this.getBasePrice(symbol);
        const volatility = 0.02;
        const randomMove = (Math.random() - 0.5) * 2 * volatility;
        return basePrice * (1 + randomMove);
    }
    getBasePrice(symbol) {
        const prices = {
            'OP': 2.85,
            'AAVE': 185,
            'NEAR': 5.20,
            'LINK': 18.50,
            'RENDER': 12.80
        };
        return prices[symbol] || 1.0;
    }
    async executePaperTrade(symbol, action, price, confidence) {
        if (action === 'hold')
            return;
        const riskAmount = this.portfolio.balance * 0.02;
        const positionSize = riskAmount / price;
        const adjustedSize = positionSize * (confidence / 100);
        const position = {
            symbol,
            side: action === 'buy' ? 'long' : 'short',
            size: adjustedSize,
            entryPrice: price,
            entryTime: new Date(),
            pnl: 0,
            pnlPercent: 0
        };
        this.portfolio.positions.push(position);
        this.portfolio.trades++;
        logger_1.logger.info(`📈 ${action.toUpperCase()} ${symbol}: Size=${adjustedSize.toFixed(4)} @ $${price.toFixed(4)} (${confidence}% confidence)`);
    }
    async updatePositions(symbol, currentPrice) {
        for (const position of this.portfolio.positions) {
            if (position.symbol === symbol) {
                const priceChange = currentPrice - position.entryPrice;
                const pnl = position.side === 'long' ?
                    priceChange * position.size :
                    -priceChange * position.size;
                position.pnl = pnl;
                position.pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;
                const shouldExit = position.pnlPercent > 5 || position.pnlPercent < -2;
                if (shouldExit) {
                    await this.closePosition(position, currentPrice);
                }
            }
        }
    }
    async closePosition(position, _exitPrice) {
        const finalPnL = position.pnl;
        this.portfolio.balance += finalPnL;
        this.portfolio.totalPnL += finalPnL;
        if (finalPnL > 0) {
            this.portfolio.wins++;
        }
        const index = this.portfolio.positions.indexOf(position);
        this.portfolio.positions.splice(index, 1);
        logger_1.logger.info(`✅ CLOSED ${position.symbol}: P&L=${finalPnL.toFixed(2)} (${position.pnlPercent.toFixed(2)}%)`);
    }
    updatePortfolioMetrics() {
        const unrealizedPnL = this.portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalValue = this.portfolio.balance + unrealizedPnL;
        this.portfolio.totalPnLPercent = ((totalValue - 10000) / 10000) * 100;
        this.portfolio.winRate = this.portfolio.trades > 0 ? (this.portfolio.wins / this.portfolio.trades) * 100 : 0;
        const currentDrawdown = Math.max(0, (10000 - totalValue) / 10000 * 100);
        this.portfolio.maxDrawdown = Math.max(this.portfolio.maxDrawdown, currentDrawdown);
    }
    logPortfolioStatus() {
        const unrealizedPnL = this.portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalValue = this.portfolio.balance + unrealizedPnL;
        logger_1.logger.info('📊 PORTFOLIO STATUS:');
        logger_1.logger.info(`💰 Total Value: $${totalValue.toFixed(2)} (${this.portfolio.totalPnLPercent.toFixed(2)}%)`);
        logger_1.logger.info(`📈 Realized P&L: $${this.portfolio.totalPnL.toFixed(2)}`);
        logger_1.logger.info(`🎯 Win Rate: ${this.portfolio.winRate.toFixed(1)}% (${this.portfolio.wins}/${this.portfolio.trades})`);
        logger_1.logger.info(`⬇️ Max Drawdown: ${this.portfolio.maxDrawdown.toFixed(2)}%`);
        logger_1.logger.info(`📋 Open Positions: ${this.portfolio.positions.length}`);
        if (this.portfolio.positions.length > 0) {
            logger_1.logger.info('🔸 Current Positions:');
            this.portfolio.positions.forEach(pos => {
                logger_1.logger.info(`  ${pos.symbol}: ${pos.side} $${pos.pnl.toFixed(2)} (${pos.pnlPercent.toFixed(2)}%)`);
            });
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.PaperTradingEngine = PaperTradingEngine;
if (require.main === module) {
    console.log('🚀 Crypto Trading Bot - Paper Trading Mode');
    console.log('📄 Virtual portfolio testing with real strategy');
    console.log('🎯 Focus: OP (profitable asset) + optimization candidates\n');
    const engine = new PaperTradingEngine();
    engine.start().catch(console.error);
}
//# sourceMappingURL=paper-trading.js.map