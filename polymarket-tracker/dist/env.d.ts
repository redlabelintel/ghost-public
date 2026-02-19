export interface EnvConfig {
    dataApi: string;
    dbPath: string;
    clusterWindowHours: number;
    minWallets: number;
    minConviction: number;
    rateMs: number;
    telegramToken: string;
    telegramChatId: string;
}
export declare function validateConfig(config: EnvConfig): void;
