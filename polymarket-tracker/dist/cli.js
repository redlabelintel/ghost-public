#!/usr/bin/env node
import * as db from './db.js';
const cmd = process.argv[2];
if (cmd === 'stats') {
    const s = db.stats();
    console.log(`Wallets: ${s.wallets} | Trades: ${s.trades} | Clusters: ${s.clusters}`);
}
else if (cmd === 'wallets') {
    for (const w of db.activeWallets().slice(0, 20)) {
        console.log(`  ${(w.name || w.pseudonym || w.address.slice(0, 14)).padEnd(22)} PnL: +$${w.total_pnl.toFixed(0)}`);
    }
}
else {
    console.log('Usage: node src/cli.js <stats|wallets>');
}
//# sourceMappingURL=cli.js.map