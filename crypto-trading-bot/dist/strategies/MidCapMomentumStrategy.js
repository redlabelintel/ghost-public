"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidCapMomentumStrategy = void 0;
const events_1 = require("events");
const IndicatorCalculator_1 = require("./indicators/IndicatorCalculator");
const SentimentAnalyzer_1 = require("../data/narrative/SentimentAnalyzer");
const RiskManager_1 = require("../risk/RiskManager");
const PositionSizer_1 = require("../risk/PositionSizer");
class MidCapMomentumStrategy extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = {
            minScore: 75,
            highConvictionScore: 90,
            maxPositions: 12,
            timeframes: {
                primary: '4h',
                entry: '1h',
                precision: '15m'
            },
            indicators: {
                emaFast: 20,
                emaSlow: 50,
                rsiPeriod: 14,
                atrPeriod: 14,
                adxPeriod: 14,
                volumeLookback: 7
            },
            ...config
        };
        this.indicatorCalc = new IndicatorCalculator_1.IndicatorCalculator();
        this.sentimentAnalyzer = new SentimentAnalyzer_1.SentimentAnalyzer();
        this.riskManager = new RiskManager_1.RiskManager();
        this.positionSizer = new PositionSizer_1.PositionSizer();
    }
    async analyze(symbol, candles4h, candles1h, candles15m) {
        const indicators = this.calculateIndicators(candles4h, candles1h);
        const technicalScore = this.scoreTechnicalSetup(indicators, candles4h);
        if (technicalScore < this.config.minScore) {
            return null;
        }
        const sentimentCoefficient = await this.sentimentAnalyzer.getCoefficient(symbol);
        const finalScore = technicalScore * sentimentCoefficient;
        if (finalScore < this.config.minScore) {
            this.emit('signalFiltered', {
                symbol,
                technicalScore,
                sentimentCoefficient,
                reason: 'Insufficient sentiment'
            });
            return null;
        }
        const side = this.determineDirection(indicators);
        const currentPrice = candles4h[candles4h.length - 1].close;
        const stopLoss = this.calculateStopLoss(side, currentPrice, indicators.atr, candles4h);
        const takeProfits = this.calculateTakeProfits(side, currentPrice, stopLoss);
        const conviction = finalScore >= this.config.highConvictionScore ? 'high' :
            finalScore >= 80 ? 'medium' : 'low';
        const signal = {
            symbol,
            side,
            entryPrice: currentPrice,
            stopLoss,
            takeProfits,
            strength: Math.round(finalScore),
            conviction,
            timeframe: this.config.timeframes.primary,
            indicators: {
                ema20: indicators.ema20,
                ema50: indicators.ema50,
                rsi: indicators.rsi,
                atr: indicators.atr,
                adx: indicators.adx,
                volumeRatio: indicators.volumeRatio
            },
            sentimentCoefficient,
            timestamp: Date.now()
        };
        this.emit('signalGenerated', signal);
        return signal;
    }
    calculateIndicators(candles4h, candles1h) {
        const closes4h = candles4h.map(c => c.close);
        const highs4h = candles4h.map(c => c.high);
        const lows4h = candles4h.map(c => c.low);
        const volumes4h = candles4h.map(c => c.volume);
        return {
            ema20: this.indicatorCalc.ema(closes4h, this.config.indicators.emaFast),
            ema50: this.indicatorCalc.ema(closes4h, this.config.indicators.emaSlow),
            rsi: this.indicatorCalc.rsi(closes4h, this.config.indicators.rsiPeriod),
            atr: this.indicatorCalc.atr(highs4h, lows4h, closes4h, this.config.indicators.atrPeriod),
            adx: this.indicatorCalc.adx(highs4h, lows4h, closes4h, this.config.indicators.adxPeriod),
            volumeRatio: this.calculateVolumeRatio(volumes4h)
        };
    }
    scoreTechnicalSetup(indicators, candles) {
        let score = 0;
        const currentPrice = candles[candles.length - 1].close;
        const prevPrice = candles[candles.length - 2].close;
        if (indicators.ema20 > indicators.ema50 && currentPrice > indicators.ema20) {
            score += 25;
        }
        else if (indicators.ema20 < indicators.ema50 && currentPrice < indicators.ema20) {
            score += 25;
        }
        else if (currentPrice > indicators.ema20) {
            score += 15;
        }
        if (indicators.rsi >= 40 && indicators.rsi <= 65) {
            score += 20;
        }
        else if (indicators.rsi > 30 && indicators.rsi < 40) {
            score += 15;
        }
        else if (indicators.rsi > 65 && indicators.rsi < 75) {
            score += 10;
        }
        if (indicators.volumeRatio >= 1.5 && indicators.volumeRatio <= 3.0) {
            score += 25;
        }
        else if (indicators.volumeRatio > 3.0) {
            score += 15;
        }
        else if (indicators.volumeRatio >= 1.2) {
            score += 10;
        }
        if (indicators.adx > 25) {
            score += 15;
        }
        else if (indicators.adx > 20) {
            score += 10;
        }
        const candle = candles[candles.length - 1];
        const body = Math.abs(candle.close - candle.open);
        const range = candle.high - candle.low;
        const bodyPct = body / range;
        if (bodyPct > 0.5) {
            score += 15;
        }
        else if (bodyPct > 0.3) {
            score += 10;
        }
        return score;
    }
    determineDirection(indicators) {
        return indicators.ema20 > indicators.ema50 ? 'long' : 'short';
    }
    calculateStopLoss(side, currentPrice, atr, candles) {
        const atrStop = side === 'long'
            ? currentPrice - (atr * 2)
            : currentPrice + (atr * 2);
        const lookback = Math.min(10, candles.length - 1);
        const swingPrices = candles.slice(-lookback - 1, -1);
        const swingStop = side === 'long'
            ? Math.min(...swingPrices.map(c => c.low))
            : Math.max(...swingPrices.map(c => c.high));
        const minStopDistance = currentPrice * 0.02;
        if (side === 'long') {
            const stop = Math.max(atrStop, swingStop, currentPrice - minStopDistance);
            return Math.min(stop, currentPrice * 0.98);
        }
        else {
            const stop = Math.min(atrStop, swingStop, currentPrice + minStopDistance);
            return Math.max(stop, currentPrice * 1.02);
        }
    }
    calculateTakeProfits(side, entryPrice, stopLoss) {
        const stopDistance = Math.abs(entryPrice - stopLoss);
        const direction = side === 'long' ? 1 : -1;
        return [
            { price: entryPrice + (stopDistance * 1.5 * direction), size: 0.25 },
            { price: entryPrice + (stopDistance * 3.0 * direction), size: 0.35 },
            { price: entryPrice + (stopDistance * 5.0 * direction), size: 0.25 }
        ];
    }
    calculateVolumeRatio(volumes) {
        if (volumes.length < 8)
            return 1.0;
        const current = volumes[volumes.length - 1];
        const avg = volumes.slice(-8, -1).reduce((a, b) => a + b, 0) / 7;
        return current / avg;
    }
}
exports.MidCapMomentumStrategy = MidCapMomentumStrategy;
exports.default = MidCapMomentumStrategy;
//# sourceMappingURL=MidCapMomentumStrategy.js.map