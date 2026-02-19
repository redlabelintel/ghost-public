import { EventEmitter } from 'events';
interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface Signal {
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    stopLoss: number;
    takeProfits: {
        price: number;
        size: number;
    }[];
    strength: number;
    conviction: 'low' | 'medium' | 'high';
    timeframe: string;
    indicators: Record<string, number>;
    sentimentCoefficient: number;
    timestamp: number;
}
interface StrategyConfig {
    minScore: number;
    highConvictionScore: number;
    maxPositions: number;
    timeframes: {
        primary: string;
        entry: string;
        precision: string;
    };
    indicators: {
        emaFast: number;
        emaSlow: number;
        rsiPeriod: number;
        atrPeriod: number;
        adxPeriod: number;
        volumeLookback: number;
    };
}
export declare class MidCapMomentumStrategy extends EventEmitter {
    private config;
    private indicatorCalc;
    private sentimentAnalyzer;
    private riskManager;
    private positionSizer;
    constructor(config?: Partial<StrategyConfig>);
    analyze(symbol: string, candles4h: Candle[], candles1h: Candle[], candles15m: Candle[]): Promise<Signal | null>;
    private calculateIndicators;
    private scoreTechnicalSetup;
    private determineDirection;
    private calculateStopLoss;
    private calculateTakeProfits;
    private calculateVolumeRatio;
}
export default MidCapMomentumStrategy;
//# sourceMappingURL=MidCapMomentumStrategy.d.ts.map