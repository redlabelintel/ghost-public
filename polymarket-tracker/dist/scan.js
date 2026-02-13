#!/usr/bin/env node
import { C, sleep, api } from './config.js';
import * as db from './db.js';
function score({ wc, pnl, vol, age }) {
    return Math.round((Math.min(1, (wc - 3) / 12) * 0.4 +
        Math.min(1, Math.abs(pnl) / 50000) * 0.3 +
        Math.min(1, vol / 20000) * 0.2 +
        Math.max(0, 1 - age / 4) * 0.1) * 100);
}
function lbl(s) {
    return s >= 80 ? 'VERY HIGH' : s >= 60 ? 'HIGH' : s >= 40 ? 'MEDIUM' : s >= 20 ? 'LOW' : 'VERY LOW';
}
function fmt(n) {
    if (!n || isNaN(n))
        return '0';
    const a = Math.abs(n);
    return a >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : Math.round(n) + '';
}
async function scan() {
    const wallets = db.activeWallets();
    if (!wallets.length) {
        console.log('No wallets. Run: npm run seed');
        return;
    }
    console.log(`Scanning ${wallets.length} wallets...`);
    let newT = 0;
    for (const w of wallets) {
        try {
            const trades = await api(`${C.dataApi}/trades?user=${w.address}&limit=50`);
            if (!Array.isArray(trades))
                continue;
            for (const t of trades) {
                if (db.insertTrade({
                    wallet: w.address,
                    condition_id: t.conditionId,
                    title: t.title,
                    outcome: t.outcome,
                    side: t.side,
                    size: t.size,
                    price: t.price,
                    timestamp: t.timestamp,
                }))
                    newT++;
            }
            db.scanned(w.address);
        }
        catch (_e) { /* skip wallet */ }
        await sleep(C.rateMs);
    }
    console.log(`${newT} new trades.`);
    // Cluster detection
    const recent = db.recentBuys(C.clusterWindowHours);
    const groups = {};
    for (const t of recent) {
        const k = `${t.condition_id}::${t.outcome}`;
        if (!groups[k])
            groups[k] = { condition_id: t.condition_id, title: t.title, outcome: t.outcome, side: 'BUY', ws: {}, ts: [] };
        const g = groups[k];
        if (!g.ws[t.wallet])
            g.ws[t.wallet] = { addr: t.wallet, name: t.wn || t.wps || t.wallet.slice(0, 10), pnl: t.wp || 0, vol: 0 };
        g.ws[t.wallet].vol += ((t.size ?? 0) * (t.price ?? 0));
        g.ts.push(t);
    }
    const now = Math.floor(Date.now() / 1000);
    const clusters = [];
    for (const g of Object.values(groups)) {
        const wl = Object.values(g.ws);
        if (wl.length < C.minWallets)
            continue;
        const tv = wl.reduce((s, w) => s + w.vol, 0);
        const ap = wl.reduce((s, w) => s + w.pnl, 0) / wl.length;
        const at = g.ts.reduce((s, t) => s + t.timestamp, 0) / g.ts.length;
        const conv = score({ wc: wl.length, pnl: ap, vol: tv, age: (now - at) / 3600 });
        clusters.push({
            ...g,
            wallet_count: wl.length,
            total_volume: Math.round(tv * 100) / 100,
            avg_pnl: Math.round(ap * 100) / 100,
            conviction: conv,
            wallets: wl.sort((a, b) => b.pnl - a.pnl),
        });
    }
    clusters.sort((a, b) => b.conviction - a.conviction);
    console.log(`${clusters.length} clusters detected.`);
    for (const c of clusters)
        db.insertCluster(c);
    const alerts = db.unalerted(C.minConviction);
    if (!alerts.length) {
        console.log(`No alerts. ${JSON.stringify(db.stats())}`);
        return;
    }
    const total = db.walletCount();
    for (const a of alerts) {
        const m = clusters.find(c => c.condition_id === a.condition_id && c.outcome === a.outcome);
        const top = (m?.wallets || []).slice(0, 5).map(w => `  * ${w.name} (+$${fmt(w.pnl)} PnL) $${fmt(w.vol)}`).join('\n');
        console.log(`\u{1F6A8} POLYMARKET CLUSTER ALERT\n\n\u{1F4CA} CONVICTION: ${a.conviction}/100 (${lbl(a.conviction)})\n\n\u{1F4C8} Market: "${a.title}"\n\u{1F3AF} Direction: ${a.outcome} (${a.side})\n\n\u{1F465} Smart Wallets: ${a.wallet_count}/${total} tracked\n\u{1F4B0} Total Volume: $${fmt(a.total_volume)}\n\u{1F4CA} Avg Wallet PnL: +$${fmt(a.avg_pnl)}\n\nTOP WALLETS ENTERING:\n${top || '  (n/a)'}\n\n\u23F0 ${new Date().toISOString().slice(0, 19)} UTC\n---`);
        db.markAlerted(a.id);
    }
}
scan().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=scan.js.map