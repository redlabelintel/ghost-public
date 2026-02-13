declare class PaperTradingEngine {
    private portfolio;
    private bot;
    private config;
    constructor();
    start(): Promise<void>;
    private tradingLoop;
    private processAsset;
    private getCurrentPrice;
    private getBasePrice;
    private executePaperTrade;
    private updatePositions;
    private closePosition;
    private updatePortfolioMetrics;
    private logPortfolioStatus;
    private sleep;
}
export { PaperTradingEngine };
//# sourceMappingURL=paper-trading.d.ts.map