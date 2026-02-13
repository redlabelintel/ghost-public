import winston from 'winston';
export declare const logger: winston.Logger;
export declare const tradingLogger: winston.Logger;
export declare const sentimentLogger: winston.Logger;
export declare const riskLogger: winston.Logger;
export declare const logTrade: (trade: any) => void;
export declare const logPosition: (position: any) => void;
export declare const logSentiment: (sentiment: any) => void;
export declare const logRiskEvent: (event: any) => void;
export declare const logError: (error: Error, context?: string) => void;
export declare const logSystemHealth: (component: string, status: string, metadata?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map