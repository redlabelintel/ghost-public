export declare const C: {
    readonly dataApi: string;
    readonly dbPath: string;
    readonly clusterWindowHours: number;
    readonly minWallets: number;
    readonly minConviction: number;
    readonly rateMs: number;
    readonly telegramToken: string;
    readonly telegramChatId: string;
};
export declare const sleep: (ms: number) => Promise<void>;
export declare function api<T = unknown>(url: string): Promise<T>;
