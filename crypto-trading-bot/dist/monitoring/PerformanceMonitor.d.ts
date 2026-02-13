interface TradeMetrics {
    tradeId: string;
    symbol: string;
    entryPrice: number;
    exitPrice: number;
    positionSize: number;
    pnl: number;
    pnlPct: number;
    entryTime: Date;
    exitTime: Date;
    duration: number;
    exitReason: string;
    maxDrawdown: number;
    maxProfit: number;
}
interface DailyPerformance {
    date: string;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    grossProfit: number;
    grossLoss: number;
    netPnl: number;
    avgTrade: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    largestWin: number;
    largestLoss: number;
    portfolioValue: number;
    drawdown: number;
}
interface SystemHealth {
    timestamp: Date;
    dataSourceHealth: Record<string, boolean>;
    apiLatency: Record<string, number>;
    lastSignalTime: Date;
    openPositions: number;
    dailyPnl: number;
    circuitBreakerActive: boolean;
    errors: string[];
}
export declare class PerformanceMonitor {
    private supabase;
    private alertWebhook?;
    private telegramBotToken?;
    private telegramChatId?;
    constructor(supabaseUrl: string, supabaseKey: string, options?: {
        alertWebhook?: string;
        telegramBotToken?: string;
        telegramChatId?: string;
    });
    recordTrade(metrics: TradeMetrics): Promise<void>;
    updateDailyStats(trade: TradeMetrics): Promise<void>;
    recordSystemHealth(health: SystemHealth): Promise<void>;
    generateDailyReport(date?: string): Promise<DailyPerformance>;
    getPerformanceSummary(days?: number): Promise<any>;
    private sendTradeAlert;
    private sendHealthAlert;
    private sendTelegram;
    generateEquityCurve(days?: number): Promise<{
        date: string;
        equity: number;
    }[]>;
}
export default PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.d.ts.map