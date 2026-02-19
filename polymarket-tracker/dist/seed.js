#!/usr/bin/env node
import { C, sleep, api } from './config.js';
import * as db from './db.js';
async function seed() {
    console.log('=== Polymarket Wallet Seeder ===\n');
    const seen = new Map();
    console.log('[1/2] Discovering wallets from global trades...');
    for (let i = 0; i < 3; i++) {
        try {
            const trades = await api(`${C.dataApi}/trades?limit=500`);
            if (!Array.isArray(trades))
                continue;
            for (const t of trades) {
                const a = t.proxyWallet?.toLowerCase();
                if (!a)
                    continue;
                if (!seen.has(a))
                    seen.set(a, { address: a, name: t.name || '', pseudonym: t.pseudonym || '', n: 0, v: 0 });
                const entry = seen.get(a);
                entry.n++;
                entry.v += (t.size ?? 0) * (t.price ?? 0);
            }
            console.log(`  Page ${i + 1}: ${seen.size} wallets`);
        }
        catch (e) {
            console.log(`  Page ${i + 1}: ${e.message}`);
        }
        await sleep(1000);
    }
    const cands = [...seen.values()].filter(w => w.n >= 2).sort((a, b) => b.v - a.v).slice(0, 150);
    console.log(`\n[2/2] Checking PnL for ${cands.length} wallets...`);
    let added = 0;
    for (const w of cands) {
        try {
            const pos = await api(`${C.dataApi}/positions?user=${w.address}&sizeThreshold=1&limit=200&sortBy=CASHPNL&sortDirection=DESC`);
            if (!Array.isArray(pos) || !pos.length)
                continue;
            const pnl = pos.reduce((s, p) => s + (p.cashPnl || 0), 0);
            const vol = pos.reduce((s, p) => s + (p.initialValue || 0), 0);
            if (pnl > 50 || vol > 2000) {
                db.upsertWallet({ address: w.address, name: w.name, pseudonym: w.pseudonym, total_pnl: pnl, total_volume: vol });
                added++;
                if (added % 10 === 0)
                    console.log(`  ${added} wallets added...`);
            }
        }
        catch (_e) { /* skip wallet */ }
        await sleep(600);
    }
    console.log(`\nDone! ${added} wallets added. Total: ${db.walletCount()}`);
    const top = db.activeWallets().slice(0, 10);
    if (top.length) {
        console.log('\nTop by PnL:');
        for (const w of top) {
            console.log(`  ${(w.name || w.pseudonym || w.address.slice(0, 14)).padEnd(22)} +$${w.total_pnl.toFixed(0)}`);
        }
    }
}
seed().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map