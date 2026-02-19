export declare class IndicatorCalculator {
    ema(data: number[], period: number): number;
    sma(data: number[], period: number): number;
    rsi(data: number[], period?: number): number;
    atr(highs: number[], lows: number[], closes: number[], period?: number): number;
    adx(highs: number[], lows: number[], closes: number[], period?: number): number;
    bollingerBands(data: number[], period?: number, stdDev?: number): {
        upper: number;
        middle: number;
        lower: number;
    };
    macd(data: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
        macd: number;
        signal: number;
        histogram: number;
    };
    private calculateEMASeries;
    fibonacciRetracement(high: number, low: number): Record<string, number>;
    stochastic(highs: number[], lows: number[], closes: number[], kPeriod?: number, dPeriod?: number): {
        k: number;
        d: number;
    };
}
export default IndicatorCalculator;
//# sourceMappingURL=IndicatorCalculator.d.ts.map