#!/usr/bin/env python3
"""
Polymarket Momentum Bot v1.2 - Full Strategy
Volume + Price Momentum with Kelly Criterion Sizing
Paper Trading Mode
"""

import os
import time
import json
import logging
from datetime import datetime, timedelta
from collections import deque
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)
logger = logging.getLogger('momentum-bot')

# Try importing py_clob_client
try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import ApiCreds
    HAS_CLIENT = True
except ImportError:
    HAS_CLIENT = False
    logger.error("py_clob_client not installed. Run: pip install py-clob-client")


class KellyCalculator:
    """Kelly Criterion position sizing"""
    
    @staticmethod
    def calculate(p_win, odds, bankroll, kelly_fraction=0.5, max_position_pct=0.10):
        """
        Calculate optimal position size using Kelly Criterion
        Returns position size in dollars
        """
        p_loss = 1 - p_win
        
        # Kelly percentage
        kelly_pct = (p_win * odds - p_loss) / odds if odds > 0 else 0
        
        # Apply Kelly fraction (Half-Kelly for safety)
        adjusted_pct = kelly_pct * kelly_fraction
        
        # Don't bet if negative expectancy
        if adjusted_pct <= 0:
            return 0
        
        # Cap at max position size
        adjusted_pct = min(adjusted_pct, max_position_pct)
        
        return bankroll * adjusted_pct


class MomentumStrategy:
    """
    Momentum strategy for prediction markets
    Signals: Volume spike + Price momentum
    """
    
    def __init__(self, volume_threshold=2.0, momentum_period=3):
        self.volume_threshold = volume_threshold
        self.momentum_period = momentum_period
        self.price_history = {}
        self.volume_history = {}
    
    def update_market_data(self, market_id, price, volume):
        """Track price and volume history"""
        if market_id not in self.price_history:
            self.price_history[market_id] = deque(maxlen=100)
            self.volume_history[market_id] = deque(maxlen=100)
        
        self.price_history[market_id].append(price)
        self.volume_history[market_id].append(volume)
    
    def generate_signal(self, market_id):
        """
        Generate trading signal from price and volume data
        Returns: 'BUY_YES', 'BUY_NO', or None
        """
        if market_id not in self.price_history:
            return None, 0
        
        prices = list(self.price_history[market_id])
        volumes = list(self.volume_history[market_id])
        
        if len(prices) < self.momentum_period + 1:
            return None, 0
        
        # Calculate momentum
        price_momentum = (prices[-1] - prices[-self.momentum_period]) / prices[-self.momentum_period]
        
        # Calculate volume z-score (need at least 20 samples)
        if len(volumes) >= 20:
            recent_volume = volumes[-1]
            avg_volume = sum(volumes[-20:]) / 20
            std_volume = (sum((v - avg_volume) ** 2 for v in volumes[-20:]) / 20) ** 0.5
            volume_zscore = (recent_volume - avg_volume) / std_volume if std_volume > 0 else 0
        else:
            volume_zscore = 0
        
        # Combined signal
        if volume_zscore > self.volume_threshold:
            if price_momentum > 0.02:  # 2% upward momentum
                confidence = min(0.55 + (volume_zscore / 10) + (price_momentum * 10), 0.95)
                return 'BUY_YES', confidence
            elif price_momentum < -0.02:  # 2% downward momentum
                confidence = min(0.55 + (volume_zscore / 10) + (abs(price_momentum) * 10), 0.95)
                return 'BUY_NO', confidence
        
        return None, 0


class PaperTrader:
    """Paper trading engine - simulates trades"""
    
    def __init__(self, initial_bankroll=1000.0):
        self.bankroll = initial_bankroll
        self.initial_bankroll = initial_bankroll
        self.positions = {}
        self.trade_history = []
        self.trade_count = 0
    
    def execute_trade(self, market_id, side, size, price):
        """Execute paper trade"""
        if size > self.bankroll:
            logger.warning(f"Insufficient funds: ${size:.2f} > ${self.bankroll:.2f}")
            return False
        
        self.trade_count += 1
        trade = {
            'id': self.trade_count,
            'timestamp': datetime.now().isoformat(),
            'market_id': market_id,
            'side': side,
            'size': size,
            'price': price,
            'type': 'PAPER'
        }
        self.trade_history.append(trade)
        
        # Update bankroll and positions
        if side in ['BUY_YES', 'BUY_NO']:
            self.bankroll -= size
            position_side = 'YES' if side == 'BUY_YES' else 'NO'
            self.positions[market_id] = {
                'side': position_side,
                'size': size,
                'entry_price': price,
                'entry_time': datetime.now()
            }
            logger.info(f"✓ PAPER TRADE #{self.trade_count}: Long {position_side} ${size:.2f} at {price:.4f}")
        
        return True
    
    def get_metrics(self):
        """Get trading metrics"""
        return {
            'bankroll': self.bankroll,
            'initial': self.initial_bankroll,
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
        logger.error("Missing API credentials. Check .env file.")
        return
    
    if not HAS_CLIENT:
        logger.error("py_clob_client not installed")
        return
    
    # Initialize
    host = "https://clob.polymarket.com"
    creds = ApiCreds(api_key=api_key, api_secret=secret, api_passphrase=passphrase)
    client = ClobClient(host, creds=creds)
    
    strategy = MomentumStrategy(volume_threshold=2.0, momentum_period=3)
    kelly = KellyCalculator()
    trader = PaperTrader(initial_bankroll=1000.0)
    
    logger.info("=" * 60)
    logger.info("Polymarket Momentum Bot - Full Strategy")
    logger.info("Mode: Paper Trading | Kelly Sizing: Half-Kelly")
    logger.info("=" * 60)
    
    # Main loop
    iteration = 0
    try:
        while True:
            iteration += 1
            logger.info(f"\n--- Iteration {iteration} ---")
            
            # Get markets
            try:
                markets_response = client.get_markets()
                markets = markets_response.get('data', []) if isinstance(markets_response, dict) else markets_response
            except Exception as e:
                logger.error(f"Failed to fetch markets: {e}")
                markets = []
            
            logger.info(f"Scanning {len(markets)} markets...")
            
            for market in markets[:5]:  # Check first 5 markets
                if not isinstance(market, dict):
                    continue
                
                market_id = market.get('condition_id')
                question = market.get('question', 'Unknown')
                
                if not market_id:
                    continue
                
                # Get current price (from last trade)
                try:
                    # Market has tokens - get YES token ID
                    tokens = market.get('tokens', [])
                    if not tokens:
                        continue
                    
                    # Get first token (YES side usually)
                    token_id = tokens[0].get('token_id') if isinstance(tokens[0], dict) else tokens[0]
                    if not token_id:
                        continue
                    
                    # Get last trade price
                    price_data = client.get_last_trade_price(token_id)
                    if price_data and 'price' in price_data:
                        last_price = float(price_data['price'])
                        
                        # Simulate volume (in real implementation, would get from trades)
                        simulated_volume = 100  # Placeholder
                        
                        # Update strategy with data
                        strategy.update_market_data(market_id, last_price, simulated_volume)
                        
                        # Generate signal
                        signal, confidence = strategy.generate_signal(market_id)
                        
                        if signal and market_id not in trader.positions:
                            # Calculate Kelly size
                            odds = (1 - last_price) / last_price if last_price < 0.5 else last_price / (1 - last_price)
                            position_size = kelly.calculate(
                                p_win=confidence,
                                odds=odds,
                                bankroll=trader.bankroll,
                                kelly_fraction=0.5,
                                max_position_pct=0.10
                            )
                            
                            if position_size >= 1.0:  # Minimum $1
                                trader.execute_trade(market_id, signal, position_size, last_price)
                                logger.info(f"  Signal: {signal} | Confidence: {confidence:.1%} | Size: ${position_size:.2f}")
                
                except Exception as e:
                    logger.debug(f"Error processing market {market_id}: {e}")
                    continue
            
            # Log metrics
            metrics = trader.get_metrics()
            logger.info(f"\nPortfolio: ${metrics['bankroll']:.2f} | Return: {metrics['return_pct']:+.2f}% | Trades: {metrics['total_trades']}")
            
            # Wait before next iteration
            logger.info("Waiting 60 seconds...")
            time.sleep(60)
    
    except KeyboardInterrupt:
        logger.info("\n" + "=" * 60)
        logger.info("Bot stopped by user")
        logger.info(f"Final Portfolio: ${trader.bankroll:.2f}")
        logger.info(f"Total Return: {((trader.bankroll - trader.initial_bankroll) / trader.initial_bankroll) * 100:+.2f}%")
        logger.info(f"Total Trades: {trader.trade_count}")
        logger.info("=" * 60)


if __name__ == "__main__":
    main()
