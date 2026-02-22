#!/usr/bin/env python3
"""
Polymarket Backtest Data Collector + Paper Trader
Collects recent trade history while paper trading live markets
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict, deque
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)
logger = logging.getLogger('backtest-collector')

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds


class DataCollector:
    """Collects and stores trade history for backtesting"""
    
    def __init__(self, data_dir='./backtest_data'):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.price_history = defaultdict(lambda: deque(maxlen=1000))
        self.volume_history = defaultdict(lambda: deque(maxlen=1000))
        self.daily_stats = defaultdict(dict)
        
    def record_price(self, market_id, price, timestamp=None):
        """Record price point"""
        ts = timestamp or datetime.now()
        self.price_history[market_id].append({
            'timestamp': ts,
            'price': price
        })
        
    def record_volume(self, market_id, volume, timestamp=None):
        """Record volume spike"""
        ts = timestamp or datetime.now()
        self.volume_history[market_id].append({
            'timestamp': ts,
            'volume': volume
        })
        
    def save_daily_data(self):
        """Save collected data to CSV for backtesting"""
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        for market_id, prices in self.price_history.items():
            if len(prices) > 10:  # Only save if we have enough data
                df = pd.DataFrame(list(prices))
                filename = f"{self.data_dir}/{market_id[:20]}_{date_str}.csv"
                df.to_csv(filename, index=False)
                logger.info(f"Saved {len(df)} price points to {filename}")
                
    def get_data_summary(self):
        """Get summary of collected data"""
        total_markets = len(self.price_history)
        total_price_points = sum(len(v) for v in self.price_history.values())
        return {
            'markets_tracked': total_markets,
            'price_points': total_price_points,
            'data_dir': self.data_dir
        }


class MomentumStrategy:
    """Momentum strategy with history tracking"""
    
    def __init__(self, volume_threshold=1.0, momentum_period=3, momentum_threshold=0.01):
        """
        Args:
            volume_threshold: Z-score threshold for volume spike (lower = more sensitive)
            momentum_period: Periods for momentum calculation
            momentum_threshold: Minimum price change % to trigger (lower = more sensitive)
        """
        self.volume_threshold = volume_threshold
        self.momentum_period = momentum_period
        self.momentum_threshold = momentum_threshold
        
    def generate_signal(self, market_id, prices, volumes):
        """Generate signal from price and volume data"""
        if len(prices) < self.momentum_period + 1:
            return None, 0
        
        # Calculate momentum
        price_momentum = (prices[-1] - prices[-self.momentum_period]) / prices[-self.momentum_period]
        
        # Volume z-score
        if len(volumes) >= 10:  # Lower requirement from 20 to 10
            recent_vol = volumes[-1]
            avg_vol = sum(volumes[-10:]) / 10  # Use 10-period average
            std_vol = (sum((v - avg_vol) ** 2 for v in volumes[-10:]) / 10) ** 0.5
            volume_zscore = (recent_vol - avg_vol) / std_vol if std_vol > 0 else 0
        else:
            volume_zscore = 0
        
        # Combined signal - LOWERED THRESHOLDS
        if volume_zscore > self.volume_threshold:  # Was 2.0, now 1.0
            if price_momentum > self.momentum_threshold:  # Was 0.02, now 0.01
                confidence = min(0.55 + (volume_zscore / 10) + (price_momentum * 10), 0.95)
                return 'BUY_YES', confidence
            elif price_momentum < -self.momentum_threshold:
                confidence = min(0.55 + (volume_zscore / 10) + (abs(price_momentum) * 10), 0.95)
                return 'BUY_NO', confidence
        
        return None, 0


class KellyCalculator:
    """Kelly Criterion position sizing"""
    
    @staticmethod
    def calculate(p_win, odds, bankroll, kelly_fraction=0.5, max_position_pct=0.10):
        p_loss = 1 - p_win
        kelly_pct = (p_win * odds - p_loss) / odds if odds > 0 else 0
        adjusted_pct = kelly_pct * kelly_fraction
        
        if adjusted_pct <= 0:
            return 0
        
        adjusted_pct = min(adjusted_pct, max_position_pct)
        return bankroll * adjusted_pct


class PaperTrader:
    """Paper trading engine"""
    
    def __init__(self, initial_bankroll=1000.0):
        self.bankroll = initial_bankroll
        self.initial_bankroll = initial_bankroll
        self.positions = {}
        self.trade_history = []
        self.trade_count = 0
        
    def execute_trade(self, market_id, side, size, price):
        if size > self.bankroll or size < 1.0:
            return False
            
        self.trade_count += 1
        trade = {
            'id': self.trade_count,
            'timestamp': datetime.now().isoformat(),
            'market_id': market_id,
            'side': side,
            'size': size,
            'price': price
        }
        self.trade_history.append(trade)
        
        if side in ['BUY_YES', 'BUY_NO']:
            self.bankroll -= size
            position_side = 'YES' if side == 'BUY_YES' else 'NO'
            self.positions[market_id] = {
                'side': position_side,
                'size': size,
                'entry_price': price,
                'entry_time': datetime.now()
            }
            logger.info(f"✓ TRADE #{self.trade_count}: Long {position_side} ${size:.2f} at {price:.4f}")
            
        return True
        
    def get_metrics(self):
        return {
            'bankroll': self.bankroll,
            'return_pct': ((self.bankroll - self.initial_bankroll) / self.initial_bankroll) * 100,
            'total_trades': self.trade_count,
            'open_positions': len(self.positions)
        }


def main():
    # Load credentials
    api_key = os.getenv('POLYMARKET_API_KEY')
    secret = os.getenv('POLYMARKET_SECRET')
    passphrase = os.getenv('POLYMARKET_PASSPHRASE')
    
    if not all([api_key, secret, passphrase]):
        logger.error("Missing API credentials")
        return
    
    # Initialize
    host = "https://clob.polymarket.com"
    creds = ApiCreds(api_key=api_key, api_secret=secret, api_passphrase=passphrase)
    client = ClobClient(host, creds=creds)
    
    collector = DataCollector()
    # LOWERED THRESHOLDS for more frequent signals
    strategy = MomentumStrategy(
        volume_threshold=1.0,      # Was 2.0 - more sensitive to volume
        momentum_period=3,         # Keep same
        momentum_threshold=0.01    # Was 0.02 - 1% move triggers (was 2%)
    )
    kelly = KellyCalculator()
    trader = PaperTrader(initial_bankroll=1000.0)
    
    logger.info("=" * 70)
    logger.info("Polymarket Backtest Collector + Paper Trader")
    logger.info("Collects history while paper trading live markets")
    logger.info("=" * 70)
    
    iteration = 0
    last_save = datetime.now()
    
    try:
        while True:
            iteration += 1
            logger.info(f"\n--- Iteration {iteration} | {datetime.now().strftime('%H:%M:%S')} ---")
            
            # Get markets
            try:
                markets_response = client.get_markets()
                markets = markets_response.get('data', []) if isinstance(markets_response, dict) else markets_response
            except Exception as e:
                logger.error(f"Failed to fetch markets: {e}")
                markets = []
                
            logger.info(f"Scanning {len(markets)} markets...")
            
            signals_found = 0
            
            for market in markets[:10]:  # Top 10 markets
                if not isinstance(market, dict):
                    continue
                    
                market_id = market.get('condition_id')
                tokens = market.get('tokens', [])
                
                if not market_id or not tokens:
                    continue
                
                # Get token and price
                token_id = tokens[0].get('token_id') if isinstance(tokens[0], dict) else tokens[0]
                
                try:
                    price_data = client.get_last_trade_price(token_id)
                    if price_data and 'price' in price_data:
                        price = float(price_data['price'])
                        
                        # Simulate volume (in real implementation, would aggregate trades)
                        simulated_volume = 100 + (price * 1000) % 200  # Pseudo-random volume
                        
                        # Record for backtest data
                        collector.record_price(market_id, price)
                        collector.record_volume(market_id, simulated_volume)
                        
                        # Get history for signal
                        prices = [p['price'] for p in collector.price_history[market_id]]
                        volumes = [v['volume'] for v in collector.volume_history[market_id]]
                        
                        # Generate signal
                        signal, confidence = strategy.generate_signal(market_id, prices, volumes)
                        
                        if signal and market_id not in trader.positions:
                            odds = (1 - price) / price if price < 0.5 else price / (1 - price)
                            position_size = kelly.calculate(
                                p_win=confidence,
                                odds=odds,
                                bankroll=trader.bankroll,
                                kelly_fraction=0.5,
                                max_position_pct=0.10
                            )
                            
                            if position_size >= 1.0:
                                trader.execute_trade(market_id, signal, position_size, price)
                                logger.info(f"  Signal: {signal} | Confidence: {confidence:.1%}")
                                signals_found += 1
                                
                except Exception as e:
                    logger.debug(f"Error: {e}")
                    continue
            
            # Show metrics
            metrics = trader.get_metrics()
            data_summary = collector.get_data_summary()
            
            logger.info(f"\nPortfolio: ${metrics['bankroll']:.2f} | Return: {metrics['return_pct']:+.2f}% | Trades: {metrics['total_trades']}")
            logger.info(f"Data Collected: {data_summary['price_points']} points across {data_summary['markets_tracked']} markets")
            
            # Save data every hour
            if (datetime.now() - last_save).total_seconds() > 3600:
                collector.save_daily_data()
                last_save = datetime.now()
            
            # Wait before next iteration
            logger.info("Waiting 60 seconds...")
            time.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("\n" + "=" * 70)
        logger.info("Bot stopped by user")
        collector.save_daily_data()
        
        metrics = trader.get_metrics()
        data_summary = collector.get_data_summary()
        
        logger.info(f"Final Portfolio: ${metrics['bankroll']:.2f}")
        logger.info(f"Total Return: {metrics['return_pct']:+.2f}%")
        logger.info(f"Total Trades: {metrics['total_trades']}")
        logger.info(f"Data Points Collected: {data_summary['price_points']}")
        logger.info(f"Backtest data saved to: {collector.data_dir}")
        logger.info("=" * 70)


if __name__ == "__main__":
    main()
