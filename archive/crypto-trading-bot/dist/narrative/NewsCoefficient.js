"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsCoefficient = void 0;
const logger_1 = require("../utils/logger");
class NewsCoefficient {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = new Date(0);
        this.initializeDefaults();
    }
    async getCoefficient(symbol) {
        if (this.needsUpdate()) {
            await this.updateAllCoefficients();
        }
        return this.cache.get(symbol) || this.getDefaultSignal(symbol);
    }
    async updateAllCoefficients() {
        try {
            logger_1.logger.info('🔍 Updating narrative intelligence...');
            const assets = ['OP', 'AAVE', 'NEAR', 'LINK', 'RENDER'];
            for (const symbol of assets) {
                const signal = await this.calculateNarrativeSignal(symbol);
                this.cache.set(symbol, signal);
            }
            this.lastUpdate = new Date();
            logger_1.logger.info(`✅ Updated coefficients for ${assets.length} assets`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update narrative coefficients:', error);
        }
    }
    async calculateNarrativeSignal(symbol) {
        const sources = {
            twitter: await this.getTwitterSentiment(symbol),
            news: await this.getNewsSentiment(symbol),
            onchain: await this.getOnchainSignal(symbol),
            narrative: await this.getNarrativeMomentum(symbol)
        };
        const coefficient = this.combineSignals(sources);
        const confidence = this.calculateConfidence(sources);
        const explanation = this.generateExplanation(symbol, sources, coefficient);
        return {
            symbol,
            coefficient,
            confidence,
            sources,
            explanation,
            lastUpdated: new Date()
        };
    }
    async getTwitterSentiment(symbol) {
        try {
            const baseNoise = (Math.random() - 0.5) * 0.3;
            const trendBias = this.getTwitterTrendBias(symbol);
            return Math.max(-1, Math.min(1, baseNoise + trendBias));
        }
        catch (error) {
            logger_1.logger.error(`Twitter sentiment error for ${symbol}:`, error);
            return 0;
        }
    }
    async getNewsSentiment(symbol) {
        try {
            const newsEvents = this.getRecentNewsEvents(symbol);
            const sentimentSum = newsEvents.reduce((sum, event) => sum + event.impact, 0);
            return Math.max(-1, Math.min(1, sentimentSum / Math.max(newsEvents.length, 1)));
        }
        catch (error) {
            logger_1.logger.error(`News sentiment error for ${symbol}:`, error);
            return 0;
        }
    }
    async getOnchainSignal(symbol) {
        try {
            const whaleActivity = this.getWhaleActivityScore(symbol);
            const exchangeFlows = this.getExchangeFlowScore(symbol);
            return (whaleActivity + exchangeFlows) / 2;
        }
        catch (error) {
            logger_1.logger.error(`On-chain signal error for ${symbol}:`, error);
            return 0;
        }
    }
    async getNarrativeMomentum(symbol) {
        try {
            const narratives = this.detectActiveNarratives(symbol);
            const momentum = narratives.reduce((sum, n) => sum + n.strength, 0);
            return Math.max(-1, Math.min(1, momentum / Math.max(narratives.length, 1)));
        }
        catch (error) {
            logger_1.logger.error(`Narrative momentum error for ${symbol}:`, error);
            return 0;
        }
    }
    combineSignals(sources) {
        const weights = {
            twitter: 0.35,
            news: 0.30,
            onchain: 0.20,
            narrative: 0.15
        };
        const weightedSum = sources.twitter * weights.twitter +
            sources.news * weights.news +
            sources.onchain * weights.onchain +
            sources.narrative * weights.narrative;
        return 1.0 + (weightedSum * 0.5);
    }
    calculateConfidence(sources) {
        const values = Object.values(sources);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const agreement = Math.max(0, 1 - variance);
        return Math.round(agreement * 100);
    }
    generateExplanation(_symbol, sources, coefficient) {
        const strength = coefficient > 1.2 ? 'Strong' : coefficient > 1.0 ? 'Mild' : coefficient < 0.8 ? 'Strong' : 'Mild';
        const direction = coefficient > 1.0 ? 'bullish' : 'bearish';
        const topSource = Object.entries(sources).reduce((a, b) => Math.abs(a[1]) > Math.abs(b[1]) ? a : b);
        return `${strength} ${direction} narrative (${coefficient.toFixed(2)}x) driven by ${topSource[0]} signal (${topSource[1].toFixed(2)})`;
    }
    getTwitterTrendBias(symbol) {
        const biases = {
            'OP': 0.15,
            'AAVE': 0.05,
            'NEAR': -0.05,
            'LINK': 0.02,
            'RENDER': 0.20
        };
        return biases[symbol] || 0;
    }
    getRecentNewsEvents(_symbol) {
        const eventCount = Math.floor(Math.random() * 5);
        return Array(eventCount).fill(0).map(() => ({
            impact: (Math.random() - 0.5) * 0.6,
            source: 'crypto_news'
        }));
    }
    getWhaleActivityScore(_symbol) {
        return (Math.random() - 0.5) * 0.4;
    }
    getExchangeFlowScore(_symbol) {
        return (Math.random() - 0.5) * 0.4;
    }
    detectActiveNarratives(symbol) {
        const narrativeMap = {
            'OP': ['layer2_scaling', 'ethereum_ecosystem'],
            'AAVE': ['defi_yield', 'lending_protocol'],
            'NEAR': ['blockchain_infrastructure', 'web3_development'],
            'LINK': ['oracle_network', 'web3_infrastructure'],
            'RENDER': ['ai_compute', 'gpu_rendering']
        };
        const narratives = narrativeMap[symbol] || [];
        return narratives.map(name => ({
            name,
            strength: (Math.random() - 0.3) * 0.6
        }));
    }
    needsUpdate() {
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() - this.lastUpdate.getTime() > fiveMinutes;
    }
    initializeDefaults() {
        const assets = ['OP', 'AAVE', 'NEAR', 'LINK', 'RENDER'];
        assets.forEach(symbol => {
            this.cache.set(symbol, this.getDefaultSignal(symbol));
        });
    }
    getDefaultSignal(symbol) {
        return {
            symbol,
            coefficient: 1.0,
            confidence: 50,
            sources: { twitter: 0, news: 0, onchain: 0, narrative: 0 },
            explanation: 'Default neutral sentiment (no data available)',
            lastUpdated: new Date()
        };
    }
}
exports.NewsCoefficient = NewsCoefficient;
exports.default = NewsCoefficient;
//# sourceMappingURL=NewsCoefficient.js.map