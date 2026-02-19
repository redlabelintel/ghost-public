export interface NewsData {
    symbol: string;
    sentiment: number;
    volume: number;
    sources: string[];
    keywords: string[];
    timestamp: Date;
}
export interface NarrativeSignal {
    symbol: string;
    coefficient: number;
    confidence: number;
    sources: {
        twitter: number;
        news: number;
        onchain: number;
        narrative: number;
    };
    explanation: string;
    lastUpdated: Date;
}
export declare class NewsCoefficient {
    private cache;
    private lastUpdate;
    constructor();
    getCoefficient(symbol: string): Promise<NarrativeSignal>;
    private updateAllCoefficients;
    private calculateNarrativeSignal;
    private getTwitterSentiment;
    private getNewsSentiment;
    private getOnchainSignal;
    private getNarrativeMomentum;
    private combineSignals;
    private calculateConfidence;
    private generateExplanation;
    private getTwitterTrendBias;
    private getRecentNewsEvents;
    private getWhaleActivityScore;
    private getExchangeFlowScore;
    private detectActiveNarratives;
    private needsUpdate;
    private initializeDefaults;
    private getDefaultSignal;
}
export default NewsCoefficient;
//# sourceMappingURL=NewsCoefficient.d.ts.map