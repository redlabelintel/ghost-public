import Database from 'better-sqlite3';
import { C } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY, name TEXT, pseudonym TEXT,
    total_pnl REAL DEFAULT 0, total_volume REAL DEFAULT 0,
    last_scanned TEXT, added_at TEXT DEFAULT (datetime('now')), is_active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet TEXT, condition_id TEXT, title TEXT, outcome TEXT, side TEXT,
    size REAL, price REAL, timestamp INTEGER,
    detected_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT, title TEXT, outcome TEXT, side TEXT,
    wallet_count INTEGER, total_volume REAL, avg_pnl REAL, conviction INTEGER,
    detected_at TEXT DEFAULT (datetime('now')), alerted INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS scan_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    wallets_scanned INTEGER DEFAULT 0,
    new_trades INTEGER DEFAULT 0,
    clusters_found INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running');
  CREATE INDEX IF NOT EXISTS idx_tw ON trades(wallet);
  CREATE INDEX IF NOT EXISTS idx_tc ON trades(condition_id);
  CREATE INDEX IF NOT EXISTS idx_tt ON trades(timestamp);
  CREATE INDEX IF NOT EXISTS idx_sr_status ON scan_runs(status);
`;
function initDb(dbPath) {
    const dir = path.dirname(dbPath);
    if (dir !== ':memory:' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const d = new Database(dbPath);
    d.pragma('journal_mode = WAL');
    d.exec(SCHEMA_SQL);
    return d;
}
let db = initDb(C.dbPath);
/** Get the raw better-sqlite3 Database instance (typed). */
export function getDb() {
    return db;
}
/**
 * Reset to an in-memory database. Useful for tests.
 * Returns the new Database instance.
 */
export function resetDb() {
    if (db.open)
        db.close();
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA_SQL);
    return db;
}
// ---- Wallet operations ----
export function upsertWallet(w) {
    return db.prepare(`INSERT INTO wallets (address,name,pseudonym,total_pnl,total_volume)
  VALUES(?,?,?,?,?) ON CONFLICT(address) DO UPDATE SET
  name=COALESCE(excluded.name,wallets.name), pseudonym=COALESCE(excluded.pseudonym,wallets.pseudonym),
  total_pnl=CASE WHEN excluded.total_pnl!=0 THEN excluded.total_pnl ELSE wallets.total_pnl END,
  total_volume=CASE WHEN excluded.total_volume!=0 THEN excluded.total_volume ELSE wallets.total_volume END
`).run(w.address.toLowerCase(), w.name || null, w.pseudonym || null, w.total_pnl || 0, w.total_volume || 0);
}
export function activeWallets() {
    return db.prepare('SELECT * FROM wallets WHERE is_active=1 ORDER BY total_pnl DESC').all();
}
export function walletCount() {
    return db.prepare('SELECT COUNT(*) as c FROM wallets WHERE is_active=1').get().c;
}
export function scanned(a) {
    return db.prepare("UPDATE wallets SET last_scanned=datetime('now') WHERE address=?").run(a.toLowerCase());
}
// ---- Trade operations ----
export function insertTrade(t) {
    if (db.prepare('SELECT 1 FROM trades WHERE wallet=? AND condition_id=? AND timestamp=? AND side=?')
        .get(t.wallet.toLowerCase(), t.condition_id, t.timestamp, t.side))
        return false;
    db.prepare('INSERT INTO trades(wallet,condition_id,title,outcome,side,size,price,timestamp) VALUES(?,?,?,?,?,?,?,?)')
        .run(t.wallet.toLowerCase(), t.condition_id, t.title || '', t.outcome || '', t.side, t.size || 0, t.price || 0, t.timestamp);
    return true;
}
export function recentBuys(h) {
    const cut = Math.floor(Date.now() / 1000) - h * 3600;
    return db.prepare(`SELECT t.*, w.total_pnl wp, w.name wn, w.pseudonym wps
    FROM trades t JOIN wallets w ON t.wallet=w.address WHERE t.timestamp>=? AND t.side='BUY' ORDER BY t.timestamp DESC`).all(cut);
}
// ---- Cluster operations ----
export function insertCluster(c) {
    if (db.prepare("SELECT 1 FROM clusters WHERE condition_id=? AND side=? AND outcome=? AND detected_at>=datetime('now','-2 hours')")
        .get(c.condition_id, c.side, c.outcome || ''))
        return null;
    return Number(db.prepare('INSERT INTO clusters(condition_id,title,outcome,side,wallet_count,total_volume,avg_pnl,conviction) VALUES(?,?,?,?,?,?,?,?)')
        .run(c.condition_id, c.title || '', c.outcome || '', c.side, c.wallet_count, c.total_volume, c.avg_pnl, c.conviction).lastInsertRowid);
}
export function unalerted(min) {
    return db.prepare('SELECT * FROM clusters WHERE alerted=0 AND conviction>=? ORDER BY conviction DESC').all(min);
}
export function markAlerted(id) {
    return db.prepare('UPDATE clusters SET alerted=1 WHERE id=?').run(id);
}
// ---- Scan Run operations ----
export function startScanRun() {
    const result = db.prepare('INSERT INTO scan_runs DEFAULT VALUES').run();
    return Number(result.lastInsertRowid);
}
export function completeScanRun(id, data) {
    return db.prepare(`UPDATE scan_runs SET
    completed_at=datetime('now'),
    wallets_scanned=?, new_trades=?, clusters_found=?, status=?
    WHERE id=?`).run(data.wallets_scanned ?? 0, data.new_trades ?? 0, data.clusters_found ?? 0, data.status ?? 'done', id);
}
export function failScanRun(id, status = 'error') {
    return db.prepare(`UPDATE scan_runs SET completed_at=datetime('now'), status=? WHERE id=?`).run(status, id);
}
export function getScanRun(id) {
    return db.prepare('SELECT * FROM scan_runs WHERE id=?').get(id);
}
export function recentScanRuns(limit = 10) {
    return db.prepare('SELECT * FROM scan_runs ORDER BY id DESC LIMIT ?').all(limit);
}
// ---- Stats ----
export function stats() {
    return {
        wallets: db.prepare('SELECT COUNT(*) as c FROM wallets WHERE is_active=1').get().c,
        trades: db.prepare('SELECT COUNT(*) as c FROM trades').get().c,
        clusters: db.prepare('SELECT COUNT(*) as c FROM clusters').get().c,
        scan_runs: db.prepare('SELECT COUNT(*) as c FROM scan_runs').get().c,
    };
}
// ---- Backtest helpers ----
export function getAllClusters(database) {
    const activeDb = database || db;
    return activeDb.prepare('SELECT * FROM clusters ORDER BY conviction DESC').all();
}
export function getAllTrades(database) {
    const activeDb = database || db;
    return activeDb.prepare(`
    SELECT t.*, w.name as wallet_name, w.pseudonym as wallet_pseudonym
    FROM trades t
    JOIN wallets w ON t.wallet_address = w.address
    ORDER BY t.timestamp DESC
  `).all();
}
//# sourceMappingURL=db.js.map