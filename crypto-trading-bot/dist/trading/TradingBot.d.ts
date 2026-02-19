import { EventEmitter } from 'events';
export interface TradingBotStatus {
    isRunning: boolean;
    activePositions: number;
    totalPnL: number;
    dailyPnL: number;
    lastUpdate: Date;
    systemHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}
export declare class TradingBot extends EventEmitter {
    private isRunning;
    private updateInterval;
    private database;
    private exchangeManager;
    private strategy;
    private narrativeIntelligence;
    private riskManager;
    private performanceMonitor;
    private positionManager;
    private orderExecutor;
    private lastHealthCheck;
    private errorCount;
    private readonly maxErrors;
    constructor();
    private setupEventHandlers;
    start(): Promise<void>;
    stop(): Promise<void>;
    private startMainLoop;
    private runTradingCycle;
    private updateMarketData;
    private checkExitSignals;
    private checkEntrySignals;
    private handleStrategySignal;
    private handleHighImpactNews;
    private handleConnectionLoss;
    private handleConnectionRestored;
    private pauseTrading;
    private resumeTrading;
    private performHealthCheck;
    private isSystemHealthy;
    getStatus(): TradingBotStatus;
    getActivePositions(): any;
    getPerformanceMetrics(): Promise<any>;
    emergencyStop(): Promise<void>;
}
//# sourceMappingURL=TradingBot.d.ts.map