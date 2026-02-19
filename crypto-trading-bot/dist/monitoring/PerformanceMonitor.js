"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class PerformanceMonitor {
    constructor(supabaseUrl, supabaseKey, options) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        this.alertWebhook = options?.alertWebhook;
        this.telegramBotToken = options?.telegramBotToken;
        this.telegramChatId = options?.telegramChatId;
    }
    async recordTrade(metrics) {
        const { error } = await this.supabase
            .from('trade_metrics')
            .insert(metrics);
        if (error) {
            console.error('Failed to record trade metrics:', error);
            return;
        }
        if (metrics.pnlPct > 10 || metrics.pnlPct < -5) {
            await this.sendTradeAlert(metrics);
        }
        await this.updateDailyStats(metrics);
    }
    async updateDailyStats(trade) {
        const date = trade.exitTime.toISOString().split('T')[0];
        const { data: existing } = await this.supabase
            .from('daily_performance')
            .select('*')
            .eq('date', date)
            .single();
        if (existing) {
            const updates = {
                total_trades: existing.total_trades + 1,
                winning_trades: existing.winning_trades + (trade.pnl > 0 ? 1 : 0),
                losing_trades: existing.losing_trades + (trade.pnl <= 0 ? 1 : 0),
                gross_profit: existing.gross_profit + (trade.pnl > 0 ? trade.pnl : 0),
                gross_loss: existing.gross_loss + (trade.pnl <= 0 ? Math.abs(trade.pnl) : 0),
                net_pnl: existing.net_pnl + trade.pnl,
                largest_win: Math.max(existing.largest_win, trade.pnl),
                largest_loss: Math.min(existing.largest_loss, trade.pnl),
                updated_at: new Date().toISOString()
            };
            await this.supabase
                .from('daily_performance')
                .update(updates)
                .eq('date', date);
        }
        else {
            await this.supabase
                .from('daily_performance')
                .insert({
                date,
                total_trades: 1,
                winning_trades: trade.pnl > 0 ? 1 : 0,
                losing_trades: trade.pnl <= 0 ? 1 : 0,
                gross_profit: trade.pnl > 0 ? trade.pnl : 0,
                gross_loss: trade.pnl <= 0 ? Math.abs(trade.pnl) : 0,
                net_pnl: trade.pnl,
                largest_win: trade.pnl,
                largest_loss: trade.pnl,
                portfolio_value: 0,
                drawdown: 0
            });
        }
    }
    async recordSystemHealth(health) {
        await this.supabase
            .from('system_health')
            .insert({
            timestamp: health.timestamp.toISOString(),
            data_source_health: health.dataSourceHealth,
            api_latency: health.apiLatency,
            last_signal_time: health.lastSignalTime?.toISOString(),
            open_positions: health.openPositions,
            daily_pnl: health.dailyPnl,
            circuit_breaker_active: health.circuitBreakerActive,
            errors: health.errors
        });
        if (health.circuitBreakerActive || health.errors.length > 0) {
            await this.sendHealthAlert(health);
        }
    }
    async generateDailyReport(date) {
        const reportDate = date || new Date().toISOString().split('T')[0];
        const { data: trades } = await this.supabase
            .from('trade_metrics')
            .select('*')
            .gte('exit_time', `${reportDate}T00:00:00`)
            .lte('exit_time', `${reportDate}T23:59:59`);
        if (!trades || trades.length === 0) {
            return {
                date: reportDate,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                grossProfit: 0,
                grossLoss: 0,
                netPnl: 0,
                avgTrade: 0,
                avgWin: 0,
                avgLoss: 0,
                profitFactor: 0,
                largestWin: 0,
                largestLoss: 0,
                portfolioValue: 0,
                drawdown: 0
            };
        }
        const winningTrades = trades.filter((t) => t.pnl > 0);
        const losingTrades = trades.filter((t) => t.pnl <= 0);
        const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
        const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
        const report = {
            date: reportDate,
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: winningTrades.length / trades.length,
            grossProfit,
            grossLoss,
            netPnl: grossProfit - grossLoss,
            avgTrade: trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length,
            avgWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
            avgLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0,
            profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
            largestWin: Math.max(...trades.map((t) => t.pnl)),
            largestLoss: Math.min(...trades.map((t) => t.pnl)),
            portfolioValue: 0,
            drawdown: 0
        };
        return report;
    }
    async getPerformanceSummary(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data } = await this.supabase
            .from('daily_performance')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });
        if (!data || data.length === 0) {
            return { message: 'No data available' };
        }
        const totalTrades = data.reduce((sum, d) => sum + d.total_trades, 0);
        const totalWinners = data.reduce((sum, d) => sum + d.winning_trades, 0);
        const totalPnl = data.reduce((sum, d) => sum + d.net_pnl, 0);
        const totalProfit = data.reduce((sum, d) => sum + d.gross_profit, 0);
        const totalLoss = data.reduce((sum, d) => sum + d.gross_loss, 0);
        return {
            period: `${days} days`,
            totalTrades,
            winRate: totalWinners / totalTrades,
            totalPnl,
            avgDailyPnl: totalPnl / data.length,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
            bestDay: Math.max(...data.map((d) => d.net_pnl)),
            worstDay: Math.min(...data.map((d) => d.net_pnl)),
            profitableDays: data.filter((d) => d.net_pnl > 0).length,
            unprofitableDays: data.filter((d) => d.net_pnl <= 0).length
        };
    }
    async sendTradeAlert(metrics) {
        const emoji = metrics.pnl > 0 ? '✅' : '❌';
        const message = `
${emoji} **Trade ${metrics.pnl > 0 ? 'Closed' : 'Stopped'}**

**Symbol:** ${metrics.symbol}
**P&L:** $${metrics.pnl.toFixed(2)} (${metrics.pnlPct > 0 ? '+' : ''}${metrics.pnlPct.toFixed(2)}%)
**Duration:** ${Math.floor(metrics.duration / 60)}h ${metrics.duration % 60}m
**Exit Reason:** ${metrics.exitReason}
**Max Drawdown:** ${metrics.maxDrawdown.toFixed(2)}%
**Max Profit:** ${metrics.maxProfit.toFixed(2)}%
        `;
        await this.sendTelegram(message);
    }
    async sendHealthAlert(health) {
        const message = `
🚨 **System Alert**

**Circuit Breaker:** ${health.circuitBreakerActive ? 'ACTIVE' : 'Inactive'}
**Open Positions:** ${health.openPositions}
**Daily P&L:** $${health.dailyPnl.toFixed(2)}
**Last Signal:** ${health.lastSignalTime?.toISOString() || 'N/A'}

**Errors:**
${health.errors.map(e => `- ${e}`).join('\n')}

**Data Sources:**
${Object.entries(health.dataSourceHealth)
            .map(([source, healthy]) => `${healthy ? '✅' : '❌'} ${source}`)
            .join('\n')}
        `;
        await this.sendTelegram(message);
    }
    async sendTelegram(message) {
        if (!this.telegramBotToken || !this.telegramChatId)
            return;
        try {
            await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.telegramChatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        }
        catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }
    async generateEquityCurve(days = 90) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data } = await this.supabase
            .from('daily_performance')
            .select('date, net_pnl, portfolio_value')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });
        if (!data || data.length === 0)
            return [];
        let equity = 100000;
        const curve = [];
        for (const day of data) {
            equity += day.net_pnl;
            curve.push({
                date: day.date,
                equity: equity
            });
        }
        return curve;
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
exports.default = PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.js.map