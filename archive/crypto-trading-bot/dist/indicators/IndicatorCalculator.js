"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorCalculator = void 0;
class IndicatorCalculator {
    ema(data, period) {
        if (data.length < period)
            return data[data.length - 1];
        const multiplier = 2 / (period + 1);
        let ema = data[0];
        for (let i = 1; i < data.length; i++) {
            ema = (data[i] - ema) * multiplier + ema;
        }
        return ema;
    }
    sma(data, period) {
        if (data.length < period)
            return data[data.length - 1];
        const slice = data.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
    }
    rsi(data, period = 14) {
        if (data.length < period + 1)
            return 50;
        let gains = 0;
        let losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = data[i] - data[i - 1];
            if (change > 0)
                gains += change;
            else
                losses -= change;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        for (let i = period + 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        if (avgLoss === 0)
            return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    atr(highs, lows, closes, period = 14) {
        if (highs.length < period + 1)
            return highs[0] - lows[0];
        const trValues = [];
        for (let i = 1; i < highs.length; i++) {
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            trValues.push(Math.max(tr1, tr2, tr3));
        }
        return this.sma(trValues, period);
    }
    adx(highs, lows, closes, period = 14) {
        if (highs.length < period * 2)
            return 25;
        const plusDM = [];
        const minusDM = [];
        const trValues = [];
        for (let i = 1; i < highs.length; i++) {
            const upMove = highs[i] - highs[i - 1];
            const downMove = lows[i - 1] - lows[i];
            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            trValues.push(Math.max(tr1, tr2, tr3));
        }
        let smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
        let smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
        let smoothedTR = trValues.slice(0, period).reduce((a, b) => a + b, 0);
        for (let i = period; i < plusDM.length; i++) {
            smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
            smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
            smoothedTR = smoothedTR - (smoothedTR / period) + trValues[i];
        }
        const plusDI = 100 * (smoothedPlusDM / smoothedTR);
        const minusDI = 100 * (smoothedMinusDM / smoothedTR);
        const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI);
        return dx;
    }
    bollingerBands(data, period = 20, stdDev = 2) {
        const middle = this.sma(data, period);
        const slice = data.slice(-period);
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        return {
            upper: middle + (standardDeviation * stdDev),
            middle,
            lower: middle - (standardDeviation * stdDev)
        };
    }
    macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.calculateEMASeries(data, fastPeriod);
        const slowEMA = this.calculateEMASeries(data, slowPeriod);
        const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
        const signalLine = this.calculateEMASeries(macdLine, signalPeriod);
        const lastIndex = macdLine.length - 1;
        return {
            macd: macdLine[lastIndex],
            signal: signalLine[lastIndex],
            histogram: macdLine[lastIndex] - signalLine[lastIndex]
        };
    }
    calculateEMASeries(data, period) {
        const multiplier = 2 / (period + 1);
        const ema = [data[0]];
        for (let i = 1; i < data.length; i++) {
            ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
        }
        return ema;
    }
    fibonacciRetracement(high, low) {
        const diff = high - low;
        return {
            '0': high,
            '0.236': high - diff * 0.236,
            '0.382': high - diff * 0.382,
            '0.5': high - diff * 0.5,
            '0.618': high - diff * 0.618,
            '0.786': high - diff * 0.786,
            '1': low
        };
    }
    stochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
        const lowestLow = Math.min(...lows.slice(-kPeriod));
        const highestHigh = Math.max(...highs.slice(-kPeriod));
        const currentClose = closes[closes.length - 1];
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        return { k, d: k };
    }
}
exports.IndicatorCalculator = IndicatorCalculator;
exports.default = IndicatorCalculator;
//# sourceMappingURL=IndicatorCalculator.js.map