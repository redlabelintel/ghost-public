interface BacktestConfig {
    symbol: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
}
interface BacktestResult {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
}
export declare class SimpleBacktester {
    private dataFetcher;
    runBacktest(config: BacktestConfig): Promise<BacktestResult>;
}
export {};
//# sourceMappingURL=simple-runner.d.ts.map