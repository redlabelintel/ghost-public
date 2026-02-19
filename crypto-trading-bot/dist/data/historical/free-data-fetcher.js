"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeDataFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
class FreeDataFetcher {
    constructor() {
        this.baseUrl = 'https://api.coingecko.com/api/v3';
    }
    async getHistoricalData(symbol, startDate, endDate) {
        const symbolMap = {
            'RENDER-USDT': 'render-token',
            'FET-USDT': 'fetch-ai',
            'TAO-USDT': 'bittensor',
            'ARKM-USDT': 'arkham',
            'AAVE-USDT': 'aave',
            'UNI-USDT': 'uniswap',
            'NEAR-USDT': 'near',
            'LINK-USDT': 'chainlink',
        };
        const coinId = symbolMap[symbol];
        if (!coinId) {
            throw new Error(`No mapping for symbol: ${symbol}`);
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/coins/${coinId}/market_chart/range`, {
                params: {
                    vs_currency: 'usd',
                    from: Math.floor(new Date(startDate).getTime() / 1000),
                    to: Math.floor(new Date(endDate).getTime() / 1000)
                }
            });
            const { prices, total_volumes } = response.data;
            return prices.map((price, index) => ({
                timestamp: new Date(price[0]),
                open: price[1],
                high: price[1] * 1.002,
                low: price[1] * 0.998,
                close: price[1],
                volume: total_volumes[index] ? total_volumes[index][1] : 0
            }));
        }
        catch (error) {
            console.error(`Failed to fetch data for ${symbol}:`, error);
            throw error;
        }
    }
}
exports.FreeDataFetcher = FreeDataFetcher;
//# sourceMappingURL=free-data-fetcher.js.map