"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleTradingBot = void 0;
const logger_1 = require("../utils/logger");
const NewsCoefficient_1 = require("../narrative/NewsCoefficient");
class SimpleTradingBot {
    constructor(_config) {
        this.newsCoefficient = new NewsCoefficient_1.NewsCoefficient();
    }
    async generateSignal(symbol) {
        try {
            const technicalScore = this.generateTechnicalScore(symbol);
            const narrativeSignal = await this.newsCoefficient.getCoefficient(symbol);
            const sentimentCoeff = narrativeSignal.coefficient;
            const finalScore = technicalScore * sentimentCoeff;
            let action = 'hold';
            let confidence = 0;
            if (finalScore > 0.3) {
                action = 'buy';
                confidence = Math.min(90, finalScore * 100);
            }
            else if (finalScore < -0.3) {
                action = 'sell';
                confidence = Math.min(90, Math.abs(finalScore) * 100);
            }
            else {
                action = 'hold';
                confidence = 50;
            }
            const reason = `${this.generateReason(technicalScore, sentimentCoeff, finalScore)} | ${narrativeSignal.explanation}`;
            return {
                action,
                confidence,
                reason,
                sentimentCoeff,
                technicalScore
            };
        }
        catch (error) {
            logger_1.logger.error(`Error generating signal for ${symbol}:`, error);
            return {
                action: 'hold',
                confidence: 0,
                reason: 'Error in signal generation',
                sentimentCoeff: 1.0,
                technicalScore: 0
            };
        }
    }
    generateTechnicalScore(symbol) {
        const baseBias = this.getAssetBias(symbol);
        const randomComponent = (Math.random() - 0.5) * 0.8;
        const trendComponent = Math.sin(Date.now() / (1000 * 60 * 60 * 6)) * 0.3;
        return Math.max(-1, Math.min(1, baseBias + randomComponent + trendComponent));
    }
    getAssetBias(symbol) {
        const biases = {
            'OP': 0.15,
            'AAVE': 0.05,
            'NEAR': -0.05,
            'LINK': -0.08,
            'RENDER': -0.1
        };
        return biases[symbol] || 0;
    }
    generateReason(technical, sentiment, final) {
        const techDesc = technical > 0.2 ? 'Strong' : technical > 0 ? 'Weak' : technical > -0.2 ? 'Weak' : 'Strong';
        const techDir = technical > 0 ? 'bullish' : 'bearish';
        const sentDesc = sentiment > 1.1 ? 'positive' : sentiment < 0.9 ? 'negative' : 'neutral';
        return `${techDesc} ${techDir} technical (${technical.toFixed(2)}) + ${sentDesc} sentiment (${sentiment.toFixed(2)}) = ${final.toFixed(2)}`;
    }
    async healthCheck() {
        try {
            logger_1.logger.info('🔍 Trading bot health check...');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            return false;
        }
    }
}
exports.SimpleTradingBot = SimpleTradingBot;
exports.default = SimpleTradingBot;
//# sourceMappingURL=SimpleTradingBot.js.map