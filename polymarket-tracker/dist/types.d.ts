/** Core domain types for Polymarket Tracker */
export interface Wallet {
    address: string;
    name: string | null;
    pseudonym: string | null;
    total_pnl: number;
    total_volume: number;
    last_scanned: string | null;
    added_at: string;
    is_active: number;
}
export interface WalletInput {
    address: string;
    name?: string | null;
    pseudonym?: string | null;
    total_pnl?: number;
    total_volume?: number;
}
export interface Trade {
    id: number;
    wallet: string;
    condition_id: string;
    title: string;
    outcome: string;
    side: string;
    size: number;
    price: number;
    timestamp: number;
    detected_at: string;
}
export interface TradeInput {
    wallet: string;
    condition_id: string;
    title?: string;
    outcome?: string;
    side: string;
    size?: number;
    price?: number;
    timestamp: number;
}
export interface TradeWithWallet extends Trade {
    wp: number;
    wn: string | null;
    wps: string | null;
}
export interface Cluster {
    id: number;
    condition_id: string;
    title: string;
    outcome: string;
    side: string;
    wallet_count: number;
    total_volume: number;
    avg_pnl: number;
    conviction: number;
    detected_at: string;
    alerted: number;
    avg_timestamp?: number;
}
export interface ClusterInput {
    condition_id: string;
    title?: string;
    outcome?: string;
    side: string;
    wallet_count: number;
    total_volume: number;
    avg_pnl: number;
    conviction: number;
}
export interface ScanRun {
    id: number;
    started_at: string;
    completed_at: string | null;
    wallets_scanned: number;
    new_trades: number;
    clusters_found: number;
    status: string;
}
export interface ScanRunInput {
    wallets_scanned?: number;
    new_trades?: number;
    clusters_found?: number;
    status?: string;
}
export interface Stats {
    wallets: number;
    trades: number;
    clusters: number;
    scan_runs: number;
}
