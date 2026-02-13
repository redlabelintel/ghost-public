/**
 * Backtest alert system to find historical alert conditions
 */
import { getDb, getAllClusters } from './db.js';
import { C } from './config.js';
function score({ wc, pnl, vol, age }) {
    const ws = Math.min(wc / 10, 1.5) * 30;
    const ps = Math.max(0, Math.min(pnl / 100, 3)) * 25;
    const vs = Math.max(0, Math.min(Math.log10(vol) - 1, 3)) * 20;
    const as = Math.max(0, 1 - age / 48) * 25;
    return Math.round(ws + ps + vs + as);
}
function formatNumber(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(0);
}
function getConvictionLabel(conviction) {
    if (conviction >= 80)
        return '🔥 EXTREME';
    if (conviction >= 70)
        return '⚡ HIGH';
    if (conviction >= 60)
        return '📈 MEDIUM';
    if (conviction >= 50)
        return '📊 LOW';
    return '💤 MINIMAL';
}
async function backtest() {
    console.log('🔄 Starting backtest analysis...\n');
    const db = getDb();
    const clusters = getAllClusters(db);
    console.log(`📊 Analyzing ${clusters.length} historical clusters\n`);
    // Test different alert thresholds
    const thresholds = [50, 55, 60, 65, 70, 75, 80];
    const alerts = [];
    for (const cluster of clusters) {
        const alert = {
            conviction: cluster.conviction,
            title: cluster.title,
            outcome: cluster.outcome,
            side: cluster.side,
            wallet_count: cluster.wallet_count,
            total_volume: cluster.total_volume,
            avg_pnl: cluster.avg_pnl,
            timestamp: cluster.avg_timestamp ?
                new Date(cluster.avg_timestamp * 1000).toISOString().slice(0, 19) :
                'unknown',
            would_alert: cluster.conviction >= C.minConviction
        };
        alerts.push(alert);
    }
    // Sort by conviction (highest first)
    alerts.sort((a, b) => b.conviction - a.conviction);
    // Show threshold analysis
    console.log('🎯 THRESHOLD ANALYSIS:\n');
    for (const threshold of thresholds) {
        const wouldAlert = alerts.filter(a => a.conviction >= threshold).length;
        const current = threshold === C.minConviction ? ' (CURRENT)' : '';
        console.log(`   ${threshold}+ conviction: ${wouldAlert} alerts${current}`);
    }
    console.log('\n🔥 TOP HISTORICAL CLUSTERS (All Time):\n');
    // Show top 10 clusters of all time
    const top10 = alerts.slice(0, 10);
    for (let i = 0; i < top10.length; i++) {
        const alert = top10[i];
        const alertFlag = alert.would_alert ? '🚨 WOULD ALERT' : '🔇 below threshold';
        console.log(`${i + 1}. ${getConvictionLabel(alert.conviction)} ${alert.conviction}/100`);
        console.log(`   📊 ${alert.title}`);
        console.log(`   🎯 ${alert.outcome} (${alert.side})`);
        console.log(`   👥 ${alert.wallet_count} wallets • $${formatNumber(alert.total_volume)} volume • +$${formatNumber(alert.avg_pnl)} avg PnL`);
        console.log(`   ⏰ ${alert.timestamp} • ${alertFlag}`);
        console.log('');
    }
    // Show what WOULD have alerted with current settings
    const currentAlerts = alerts.filter(a => a.would_alert);
    console.log(`📢 ALERTS THAT WOULD HAVE FIRED (${C.minConviction}+ conviction): ${currentAlerts.length}\n`);
    if (currentAlerts.length > 0) {
        const recent5 = currentAlerts.slice(0, 5);
        for (let i = 0; i < recent5.length; i++) {
            const alert = recent5[i];
            console.log(`🚨 ALERT ${i + 1}: ${alert.conviction}/100 conviction`);
            console.log(`   "${alert.title}" → ${alert.outcome}`);
            console.log(`   ${alert.wallet_count} wallets, $${formatNumber(alert.total_volume)} volume`);
            console.log(`   ${alert.timestamp}`);
            console.log('');
        }
    }
    // Performance analysis
    console.log('📈 PERFORMANCE INSIGHTS:\n');
    const highConviction = alerts.filter(a => a.conviction >= 70);
    const mediumConviction = alerts.filter(a => a.conviction >= 60 && a.conviction < 70);
    const lowConviction = alerts.filter(a => a.conviction < 60);
    console.log(`   🔥 High conviction (70+): ${highConviction.length} clusters`);
    console.log(`   📈 Medium conviction (60-69): ${mediumConviction.length} clusters`);
    console.log(`   📊 Low conviction (<60): ${lowConviction.length} clusters`);
    if (highConviction.length > 0) {
        const avgVolHigh = highConviction.reduce((sum, a) => sum + a.total_volume, 0) / highConviction.length;
        const avgPnlHigh = highConviction.reduce((sum, a) => sum + a.avg_pnl, 0) / highConviction.length;
        console.log(`   💰 High conviction avg: $${formatNumber(avgVolHigh)} volume, +$${formatNumber(avgPnlHigh)} PnL`);
    }
    console.log('\n✅ Backtest complete!');
    // Recommendation
    const recommendThreshold = alerts.length > 100 ?
        (alerts.length > 500 ? 70 : 65) : 60;
    if (recommendThreshold !== C.minConviction) {
        console.log(`\n💡 RECOMMENDATION: Consider adjusting threshold to ${recommendThreshold} based on historical data`);
    }
}
if (import.meta.main) {
    backtest().catch(console.error);
}
//# sourceMappingURL=backtest.js.map