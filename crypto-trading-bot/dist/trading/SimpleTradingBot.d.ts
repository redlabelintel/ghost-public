export interface TradingSignal {
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    reason: string;
    sentimentCoeff: number;
    technicalScore: number;
}
export declare class SimpleTradingBot {
    private newsCoefficient;
    constructor(_config?: any);
    generateSignal(symbol: string): Promise<TradingSignal>;
    private generateTechnicalScore;
    private getAssetBias;
    private generateReason;
    healthCheck(): Promise<boolean>;
}
export default SimpleTradingBot;
//# sourceMappingURL=SimpleTradingBot.d.ts.map