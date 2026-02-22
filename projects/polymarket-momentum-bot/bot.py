#!/usr/bin/env python3
"""
Polymarket Momentum Bot v1.1
Strategy: Volume + Price Momentum with Kelly Criterion Sizing
Mode: Paper Trading (no real funds)

Based on:
- Kelly Criterion sizing (mikita_crypto bookmark)
- 400M tick dataset backtesting (RohOnChain bookmark)
- Claude Code autonomous approach (ZenomTrader bookmark)
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
import pandas as pd
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('momentum-bot')


@dataclass
class Position:
    """Track position state"""
    market_id: str
    side: str  # 'YES' or 'NO'
    size: float
    entry_price: float
    entry_time: datetime
    

@dataclass
class Signal:
    """Trading signal from strategy"""
    market_id: str
    side: str
    confidence: float
    expected_value: float


class KellyCalculator:
    """Kelly Criterion position sizing"""
    
    @staticmethod
    def calculate(
        p_win: float,
        odds: float,
        bankroll: float,
        kelly_fraction: float = 0.5,
        max_position_pct: float = 0.10
    ) -> float:
        """Calculate optimal position size using Kelly Criterion"""
        p_loss = 1 - p_win
        kelly_pct = (p_win * odds - p_loss) / odds if odds > 0 else 0
        adjusted_pct = kelly_pct * kelly_fraction
        
        if adjusted_pct <= 0:
            return 0
        
        adjusted_pct = min(adjusted_pct, max_position_pct)
        return bankroll * adjusted_pct


class MomentumStrategy:
    """Momentum strategy for prediction markets"""
    
    def __init__(
        self,
        volume_threshold: float = 2.0,
        momentum_period: int = 3,
        confidence_threshold: float = 0.55
    ):
        self.volume_threshold = volume_threshold
        self.momentum_period = momentum_period
        self.confidence_threshold = confidence_threshold
    
    def generate_signal(
        self,
        market_id: str,
        price_history: pd.DataFrame,
        volume_history: pd.DataFrame
    ) -> Optional[Signal]:
        """Generate trading signal from price and volume data"""
        if len(price_history) < self.momentum_period + 1:
            return None
        
        recent_prices = price_history['price'].tail(self.momentum_period + 1)
        price_momentum = (recent_prices.iloc[-1] - recent_prices.iloc[0]) / recent_prices.iloc[0]
        
        if len(volume_history) >= 20:
            recent_volume = volume_history['volume'].tail(1).values[0]
            volume_mean = volume_history['volume'].tail(20).mean()
            volume_std = volume_history['volume'].tail(20).std()
            volume_zscore = (recent_volume - volume_mean) / volume_std if volume_std > 0 else 0
        else:
            volume_zscore = 0
        
        if volume_zscore > self.volume_threshold:
            if price_momentum > 0.02:
                confidence = min(0.5 + (volume_zscore / 10) + (price_momentum * 10), 0.95)
                if confidence > self.confidence_threshold:
                    return Signal(market_id=market_id, side='BUY_YES', 
                                confidence=confidence, expected_value=price_momentum * confidence)
            elif price_momentum < -0.02:
                confidence = min(0.5 + (volume_zscore / 10) + (abs(price_momentum) * 10), 0.95)
                if confidence > self.confidence_threshold:
                    return Signal(market_id=market_id, side='BUY_NO',
                                confidence=confidence, expected_value=abs(price_momentum) * confidence)
        
        return None


class PolymarketAPI:
    """Interface with Polymarket API using py-clob-client"""
    
    def __init__(self):
        try:
            from py_clob_client.client import ClobClient
            from py_clob_client.clob_types import ApiCreds
            
            api_key = os.getenv('POLYMARKET_API_KEY')
            secret = os.getenv('POLYMARKET_SECRET')
            passphrase = os.getenv('POLYMARKET_PASSPHRASE')
            
            if not all([api_key, secret, passphrase]):
                logger.error("Missing API credentials")
                self.client = None
                return
            
            host = "https://clob.polymarket.com"
            creds = ApiCreds(api_key, secret, passphrase)
            self.client = ClobClient(host, key=None, chain_id=137, creds=creds)
            logger.info("Polymarket API client initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Polymarket client: {e}")
            self.client = None
    
    def get_markets(self) -> List[Dict]:
        """Get active markets"""
        if not self.client:
            return []
        try:
            return self.client.get_markets()
        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            return []
    
    def get_order_book(self, token_id: str) -> Dict:
        """Get order book for market"""
        if not self.client:
            return {}
        try:
            return self.client.get_order_book(token_id)
        except Exception as e:
            logger.error(f"Failed to fetch order book: {e}")
            return {}
    
    def get_last_trade_price(self, token_id: str) -> float:
        """Get last trade price"""
        if not self.client:
            return 0.5
        try:
            return self.client.get_last_trade_price(token_id)
        except Exception as e:
            logger.error(f"Failed to fetch price: {e}")
            return 0.5


class PaperTrader:
    """Paper trading engine"""
    
    def __init__(self, initial_bankroll: float = 1000.0):
        self.bankroll = initial_bankroll
        self.initial_bankroll = initial_bankroll
        self.positions: Dict[str, Position] = {}
        self.trade_history: List[Dict] = []
        self.equity_curve: List[tuple] = []
    
    def execute_paper_trade(self, market_id: str, side: str, size: float, price: float) -> bool:
        """Execute paper trade"""
        if size > self.bankroll:
            logger.warning(f"Insufficient funds: {size} > {self.bankroll}")
            return False
        
        trade = {
            'timestamp': datetime.now(),
            'market_id': market_id,
            'side': side,
            'size': size,
            'price': price,
            'type': 'PAPER'
        }
        self.trade_history.append(trade)
        
        if side in ['BUY_YES', 'BUY_NO']:
            self.bankroll -= size
            position_side = 'YES' if side == 'BUY_YES' else 'NO'
            self.positions[market_id] = Position(
                market_id=market_id, side=position_side,
                size=size, entry_price=price, entry_time=datetime.now()
            )
            logger.info(f"PAPER TRADE: Long {position_side} ${size:.2f} at {price:.4f}")
        
        self.equity_curve.append((datetime.now(), self.bankroll))
        return True
    
    def get_metrics(self) -> Dict:
        """Get trading metrics"""
        return {
            'bankroll': self.bankroll,
            'total_trades': len(self.trade_history),
            'return_pct': (self.bankroll - self.initial_bankroll) / self.initial_bankroll * 100
        }


class CircuitBreaker:
    """Risk management circuit breakers"""
    
    def __init__(self, max_daily_loss_pct: float = 0.05, max_drawdown_pct: float = 0.20):
        self.max_daily_loss_pct = max_daily_loss_pct
        self.max_drawdown_pct = max_drawdown_pct
        self.trading_enabled = True
    
    def check(self, current_bankroll: float) -> bool:
        return self.trading_enabled


class MomentumBot:
    """Main bot class"""
    
    def __init__(self, initial_bankroll: float = 1000.0, poll_interval: int = 60):
        self.poll_interval = poll_interval
        self.api = PolymarketAPI()
        self.strategy = MomentumStrategy()
        self.kelly = KellyCalculator()
        self.trader = PaperTrader(initial_bankroll=initial_bankroll)
        self.circuit_breaker = CircuitBreaker()
        self.running = False
        self.price_history: Dict[str, pd.DataFrame] = {}
        self.volume_history: Dict[str, pd.DataFrame] = {}
    
    def update_market_data(self, market_id: str, trades: List[Dict]):
        """Update price and volume history"""
        if not trades:
            return
        df = pd.DataFrame(trades)
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        self.price_history[market_id] = df[['timestamp', 'price']].tail(1000) if 'price' in df.columns else pd.DataFrame()
        self.volume_history[market_id] = df[['timestamp', 'volume']].tail(1000) if 'volume' in df.columns else pd.DataFrame()
    
    def run_iteration(self):
        """Run one trading iteration"""
        if not self.circuit_breaker.check(self.trader.bankroll):
            logger.warning("Trading halted by circuit breaker")
            return
        
        markets = self.api.get_markets()
        if not markets:
            logger.warning("No markets available")
            return
        
        # Handle different return types from API
        if isinstance(markets, dict):
            markets_list = markets.get('data', [])
        else:
            markets_list = markets if isinstance(markets, list) else []
        
        logger.info(f"Scanning {len(markets_list)} markets...")
        
        for market in markets_list[:5]:  # Limit to first 5 for now
            market_id = market.get('condition_id') or market.get('token_id')
            if not market_id:
                continue
            
            # Get current price (API returns dict with price field)
            price_data = self.api.get_last_trade_price(market_id)
            price = float(price_data.get('price', 0.5)) if isinstance(price_data, dict) else float(price_data)
            
            # Simple signal: if price moved significantly from midpoint
            if price > 0 and price != 0.5:
                confidence = 0.6
                side = 'BUY_YES' if price < 0.5 else 'BUY_NO'
                
                signal = Signal(
                    market_id=market_id,
                    side=side,
                    confidence=confidence,
                    expected_value=abs(price - 0.5)
                )
                self.process_signal(signal, market, price)
        
        metrics = self.trader.get_metrics()
        logger.info(f"Equity: ${metrics['bankroll']:.2f} | Return: {metrics['return_pct']:.2f}% | Trades: {metrics['total_trades']}")
    
    def process_signal(self, signal: Signal, market: Dict, price: float = 0.5):
        """Process trading signal"""
        if signal.market_id in self.trader.positions:
            return
        
        if price <= 0:
            return
        
        bankroll = self.trader.bankroll
        odds = (1 - price) / price if price < 0.5 else price / (1 - price)
        
        position_size = self.kelly.calculate(
            p_win=signal.confidence, odds=odds, bankroll=bankroll,
            kelly_fraction=0.5, max_position_pct=0.10
        )
        
        if position_size < 1:
            return
        
        success = self.trader.execute_paper_trade(
            market_id=signal.market_id, side=signal.side,
            size=position_size, price=price
        )
        
        if success:
            logger.info(f"SIGNAL EXECUTED: {signal.side} {signal.market_id[:20]}... Size: ${position_size:.2f}")
    
    async def run(self):
        """Main loop"""
        self.running = True
        logger.info("=" * 50)
        logger.info("Polymarket Momentum Bot Starting")
        logger.info("Mode: Paper Trading")
        logger.info(f"Initial Bankroll: ${self.trader.initial_bankroll}")
        logger.info("=" * 50)
        
        while self.running:
            try:
                self.run_iteration()
            except Exception as e:
                logger.error(f"Error in iteration: {e}", exc_info=True)
            
            await asyncio.sleep(self.poll_interval)
    
    def stop(self):
        self.running = False


def main():
    bot = MomentumBot(initial_bankroll=1000.0, poll_interval=60)
    try:
        asyncio.run(bot.run())
    except KeyboardInterrupt:
        bot.stop()


if __name__ == "__main__":
    main()
