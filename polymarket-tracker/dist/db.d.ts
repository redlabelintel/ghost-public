import Database from 'better-sqlite3';
import type { Wallet, WalletInput, Trade, TradeInput, TradeWithWallet, Cluster, ClusterInput, ScanRun, ScanRunInput, Stats } from './types.js';
export type { Wallet, WalletInput, Trade, TradeInput, TradeWithWallet, Cluster, ClusterInput, ScanRun, ScanRunInput, Stats, };
export type WalletRow = Wallet;
export type TradeRow = TradeWithWallet;
export type ClusterRow = Cluster;
/** Get the raw better-sqlite3 Database instance (typed). */
export declare function getDb(): Database.Database;
/**
 * Reset to an in-memory database. Useful for tests.
 * Returns the new Database instance.
 */
export declare function resetDb(): Database.Database;
export declare function upsertWallet(w: WalletInput): Database.RunResult;
export declare function activeWallets(): Wallet[];
export declare function walletCount(): number;
export declare function scanned(a: string): Database.RunResult;
export declare function insertTrade(t: TradeInput): boolean;
export declare function recentBuys(h: number): TradeWithWallet[];
export declare function insertCluster(c: ClusterInput): number | null;
export declare function unalerted(min: number): Cluster[];
export declare function markAlerted(id: number): Database.RunResult;
export declare function startScanRun(): number;
export declare function completeScanRun(id: number, data: ScanRunInput): Database.RunResult;
export declare function failScanRun(id: number, status?: string): Database.RunResult;
export declare function getScanRun(id: number): ScanRun | undefined;
export declare function recentScanRuns(limit?: number): ScanRun[];
export declare function stats(): Stats;
export declare function getAllClusters(database?: Database.Database): Cluster[];
export declare function getAllTrades(database?: Database.Database): TradeWithWallet[];
