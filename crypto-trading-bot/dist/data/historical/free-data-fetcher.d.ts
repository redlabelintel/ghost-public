interface HistoricalCandle {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class FreeDataFetcher {
    private baseUrl;
    getHistoricalData(symbol: string, startDate: string, endDate: string): Promise<HistoricalCandle[]>;
}
export {};
//# sourceMappingURL=free-data-fetcher.d.ts.map