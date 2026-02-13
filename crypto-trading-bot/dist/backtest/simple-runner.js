"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBacktester = void 0;
const free_data_fetcher_1 = require("../data/historical/free-data-fetcher");
class SimpleBacktester {
    constructor() {
        this.dataFetcher = new free_data_fetcher_1.FreeDataFetcher();
    }
    async runBacktest(config) {
        console.log(`📊 Running backtest for ${config.symbol}...`);
        const data = await this.dataFetcher.getHistoricalData(config.symbol, config.startDate, config.endDate);
        console.log(`📈 Loaded ${data.length} data points`);
        let capital = config.initialCapital;
        let position = 0;
        let trades = 0;
        let wins = 0;
        let maxCapital = capital;
        let maxDrawdown = 0;
        let returns = [];
        for (let i = 20; i < data.length - 1; i++) {
            const current = data[i];
            const prev = data[i - 1];
            const sma20 = data.slice(i - 20, i).reduce((s, c) => s + c.close, 0) / 20;
            const signal = current.close > sma20 && current.close > prev.close;
            if (signal && position === 0) {
                position = capital / current.close;
                trades++;
                console.log(`📈 BUY at $${current.close.toFixed(4)} on ${current.timestamp.toISOString().split('T')[0]}`);
            }
            else if (!signal && position > 0) {
                const newCapital = position * current.close;
                const returnPct = (newCapital / capital - 1) * 100;
                if (returnPct > 0)
                    wins++;
                console.log(`📉 SELL at $${current.close.toFixed(4)} - Return: ${returnPct.toFixed(2)}%`);
                returns.push(returnPct);
                capital = newCapital;
                position = 0;
                if (capital > maxCapital)
                    maxCapital = capital;
                const drawdown = (maxCapital - capital) / maxCapital;
                if (drawdown > maxDrawdown)
                    maxDrawdown = drawdown;
            }
        }
        const totalReturn = (capital / config.initialCapital - 1) * 100;
        const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
        const returnStd = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)) : 0;
        const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0;
        return {
            totalReturn,
            sharpeRatio,
            maxDrawdown: maxDrawdown * 100,
            winRate: trades > 0 ? (wins / trades) * 100 : 0,
            totalTrades: trades
        };
    }
}
exports.SimpleBacktester = SimpleBacktester;
//# sourceMappingURL=simple-runner.js.map