#!/usr/bin/env python3
"""
Polymarket Momentum Bot v1.0
Strategy: Volume + Price Momentum with Kelly Criterion Sizing
Mode: Paper Trading (no real funds)

Based on:
- Kelly Criterion sizing (mikita_crypto bookmark)
- 400M tick dataset backtesting (RohOnChain bookmark)
- Claude Code autonomous approach (ZenomTrader bookmark)
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import pandas as pd
import numpy as np
import requests
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
    unrealized_pnl: float = 0.0
    

@dataclass
class Signal:
    """Trading signal from strategy"""
    market_id: str
    side: str  # 'BUY_YES', 'BUY_NO', 'SELL'
    confidence: float  # 0.0 to 1.0
    expected_value: float  # Expected return


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
        """
        Calculate optimal position size using Kelly Criterion
        
        Args:
            p_win: Probability of winning (from model)
            odds: Decimal odds (payout ratio)
            bankroll: Current bankroll
            kelly_fraction: Kelly fraction (0.5 = Half-Kelly)
            max_position_pct: Maximum position size as % of bankroll
        
        Returns:
            Position size in dollars
        """
        p_loss = 1 - p_win
        
        # Kelly percentage
        kelly_pct = (p_win * odds - p_loss) / odds if odds > 0 else 0
        
        # Apply Kelly fraction
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
    
    Signals:
    1. Volume spike (>2 std dev)
    2. Price momentum (3-period moving average crossover)
    3. Order book imbalance
    """
    
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
        """
        Generate trading signal from price and volume data
        
        Returns Signal if conditions met, None otherwise
        """
        if len(price_history) < self.momentum_period + 1:
            return None
        
        # Calculate momentum (price change)
        recent_prices = price_history['price'].tail(self.momentum_period + 1)
        price_momentum = (recent_prices.iloc[-1] - recent_prices.iloc[0]) / recent_prices.iloc[0]
        
        # Calculate volume spike
        if len(volume_history) >= 20:
            recent_volume = volume_history['volume'].tail(1).values[0]
            volume_mean = volume_history['volume'].tail(20).mean()
            volume_std = volume_history['volume'].tail(20).std()
            volume_zscore = (recent_volume - volume_mean) / volume_std if volume_std > 0 else 0
        else:
            volume_zscore = 0
        
        # Combined signal
        if volume_zscore > self.volume_threshold:
            # Strong volume spike detected
            if price_momentum > 0.02:  # 2% upward momentum
                # Bullish momentum
                confidence = min(0.5 + (volume_zscore / 10) + (price_momentum * 10), 0.95)
                if confidence > self.confidence_threshold:
                    return Signal(
                        market_id=market_id,
                        side='BUY_YES',
                        confidence=confidence,
                        expected_value=price_momentum * confidence
                    )
            elif price_momentum < -0.02:  # 2% downward momentum
                # Bearish momentum
                confidence = min(0.5 + (volume_zscore / 10) + (abs(price_momentum) * 10), 0.95)
                if confidence > self.confidence_threshold:
                    return Signal(
                        market_id=market_id,
                        side='BUY_NO',
                        confidence=confidence,
                        expected_value=abs(price_momentum) * confidence
                    )
        
        return None


class PolymarketAPI:
    """Interface with Polymarket API"""
    
    def __init__(self):
        self.base_url = "https://clob.polymarket.com"
        self.session = requests.Session()
    
    def get_markets(self, limit: int = 50) -> List[Dict]:
        """Get active markets"""
        try:
            response = self.session.get(
                f"{self.base_url}/markets",
                params={"active": True, "limit": limit}
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            return []
    
    def get_order_book(self, market_id: str) -> Dict:
        """Get order book for market"""
        try:
            response = self.session.get(
                f"{self.base_url}/books/{market_id}"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch order book: {e}")
            return {}
    
    def get_trade_history(self, market_id: str, limit: int = 100) -> List[Dict]:
        """Get recent trades"""
        try:
            response = self.session.get(
                f"{self.base_url}/trades",
                params={"market": market_id, "limit": limit}
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to fetch trades: {e}")
            return []


class PaperTrader:
    """
    Paper trading engine
    Simulates trades without real money
    """
    
    def __init__(self, initial_bankroll: float = 1000.0):
        self.bankroll = initial_bankroll
        self.initial_bankroll = initial_bankroll
        self.positions: Dict[str, Position] = {}
        self.trade_history: List[Dict] = []
        self.equity_curve: List[Tuple[datetime, float]] = []
    
    def calculate_pnl(self, position: Position, current_price: float) -> float:
        """Calculate unrealized P&L"""
        if position.side == 'YES':
            return position.size * (current_price - position.entry_price)
        else:  # NO
            return position.size * (position.entry_price - current_price)
    
    def execute_paper_trade(
        self,
        market_id: str,
        side: str,
        size: float,
        price: float
    ) -> bool:
        """Execute paper trade"""
        if size > self.bankroll:
            logger.warning(f"Insufficient funds: {size} > {self.bankroll}")
            return False
        
        # Record trade
        trade = {
            'timestamp': datetime.now(),
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
            self.positions[market_id] = Position(
                market_id=market_id,
                side=position_side,
                size=size,
                entry_price=price,
                entry_time=datetime.now()
            )
            logger.info(f"PAPER TRADE: Long {position_side} ${size:.2f} at {price:.4f}")
        
        elif side == 'SELL':
            if market_id in self.positions:
                position = self.positions[market_id]
                pnl = self.calculate_pnl(position, price)
                self.bankroll += size + pnl
                del self.positions[market_id]
                logger.info(f"PAPER TRADE: Closed ${size:.2f} P&L: ${pnl:.2f}")
        
        # Update equity curve
        self.equity_curve.append((datetime.now(), self.bankroll + self.get_unrealized_pnl()))
        
        return True
    
    def get_unrealized_pnl(self) -> float:
        """Get total unrealized P&L"""
        return sum(pos.unrealized_pnl for pos in self.positions.values())
    
    def get_metrics(self) -> Dict:
        """Get trading metrics"""
        total_trades = len(self.trade_history)
        winning_trades = len([t for t in self.trade_history if t.get('pnl', 0) > 0])
        
        return {
            'bankroll': self.bankroll,
            'unrealized_pnl': self.get_unrealized_pnl(),
            'total_equity': self.bankroll + self.get_unrealized_pnl(),
            'total_trades': total_trades,
            'win_rate': winning_trades / total_trades if total_trades > 0 else 0,
            'return_pct': (self.bankroll - self.initial_bankroll) / self.initial_bankroll * 100
        }


class CircuitBreaker:
    """Risk management circuit breakers"""
    
    def __init__(
        self,
        max_daily_loss_pct: float = 0.05,
        max_drawdown_pct: float = 0.20
    ):
        self.max_daily_loss_pct = max_daily_loss_pct
        self.max_drawdown_pct = max_drawdown_pct
        self.daily_starting_bankroll: Optional[float] = None
        self.peak_bankroll: float = 0
        self.trading_enabled = True
    
    def check(self, current_bankroll: float) -> bool:
        """Check if trading should continue"""
        if not self.trading_enabled:
            return False
        
        # Initialize daily bankroll
        if self.daily_starting_bankroll is None:
            self.daily_starting_bankroll = current_bankroll
        
        # Update peak
        self.peak_bankroll = max(self.peak_bankroll, current_bankroll)
        
        # Check daily loss
        daily_loss = (self.daily_starting_bankroll - current_bankroll) / self.daily_starting_bankroll
        if daily_loss > self.max_daily_loss_pct:
            logger.error(f"CIRCUIT BREAKER: Daily loss {daily_loss:.2%} > {self.max_daily_loss_pct:.2%}")
            self.trading_enabled = False
            return False
        
        # Check drawdown
        if self.peak_bankroll > 0:
            drawdown = (self.peak_bankroll - current_bankroll) / self.peak_bankroll
            if drawdown > self.max_drawdown_pct:
                logger.error(f"CIRCUIT BREAKER: Drawdown {drawdown:.2%} > {self.max_drawdown_pct:.2%}")
                self.trading_enabled = False
                return False
        
        return True
    
    def reset_daily(self):
        """Reset daily metrics"""
        self.daily_starting_bankroll = None


class MomentumBot:
    """
    Main bot class that orchestrates everything
    """
    
    def __init__(
        self,
        initial_bankroll: float = 1000.0,
        paper_trading: bool = True,
        poll_interval: int = 60
    ):
        self.paper_trading = paper_trading
        self.poll_interval = poll_interval
        
        # Components
        self.api = PolymarketAPI()
        self.strategy = MomentumStrategy()
        self.kelly = KellyCalculator()
        self.trader = PaperTrader(initial_bankroll=initial_bankroll)
        self.circuit_breaker = CircuitBreaker()
        
        # State
        self.running = False
        self.price_history: Dict[str, pd.DataFrame] = {}
        self.volume_history: Dict[str, pd.DataFrame] = {}
    
    def update_market_data(self, market_id: str, trades: List[Dict]):
        """Update price and volume history"""
        if not trades:
            return
        
        df = pd.DataFrame(trades)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Update history (keep last 1000 records)
        self.price_history[market_id] = df[['timestamp', 'price']].tail(1000)
        self.volume_history[market_id] = df[['timestamp', 'volume']].tail(1000)
    
    def run_iteration(self):
        """Run one trading iteration"""
        # Check circuit breakers
        if not self.circuit_breaker.check(self.trader.bankroll):
            logger.warning("Trading halted by circuit breaker")
            return
        
        # Get active markets
        markets = self.api.get_markets(limit=20)
        if not markets:
            logger.warning("No markets available")
            return
        
        for market in markets:
            market_id = market.get('condition_id')
            if not market_id:
                continue
            
            # Get trade history
            trades = self.api.get_trade_history(market_id, limit=50)
            self.update_market_data(market_id, trades)
            
            # Generate signal
            if market_id in self.price_history:
                signal = self.strategy.generate_signal(
                    market_id=market_id,
                    price_history=self.price_history[market_id],
                    volume_history=self.volume_history.get(market_id, pd.DataFrame())
                )
                
                if signal:
                    self.process_signal(signal, market)
        
        # Log metrics
        metrics = self.trader.get_metrics()
        logger.info(f"Equity: ${metrics['total_equity']:.2f} | "
                   f"Return: {metrics['return_pct']:.2f}% | "
                   f"Trades: {metrics['total_trades']}")
    
    def process_signal(self, signal: Signal, market: Dict):
        """Process trading signal"""
        # Check if already in position
        if signal.market_id in self.trader.positions:
            return
        
        # Get current price from order book
        order_book = self.api.get_order_book(signal.market_id)
        if not order_book:
            return
        
        # Get best price
        if signal.side == 'BUY_YES':
            price = float(order_book.get('bids', [[0, 0]])[0][0]) if order_book.get('bids') else 0.5
        else:  # BUY_NO
            price = float(order_book.get('asks', [[0, 0]])[0][0]) if order_book.get('asks') else 0.5
        
        if price <= 0:
            return
        
        # Calculate position size using Kelly Criterion
        bankroll = self.trader.bankroll
        odds = (1 - price) / price if price < 0.5 else price / (1 - price)
        
        position_size = self.kelly.calculate(
            p_win=signal.confidence,
            odds=odds,
            bankroll=bankroll,
            kelly_fraction=0.5,  # Half-Kelly
            max_position_pct=0.10  # Max 10% per position
        )
        
        if position_size < 1:  # Minimum $1 trade
            return
        
        # Execute paper trade
        success = self.trader.execute_paper_trade(
            market_id=signal.market_id,
            side=signal.side,
            size=position_size,
            price=price
        )
        
        if success:
            logger.info(f"SIGNAL EXECUTED: {signal.side} {signal.market_id} "
                       f"Size: ${position_size:.2f} Confidence: {signal.confidence:.2%}")
    
    async def run(self):
        """Main loop"""
        self.running = True
        logger.info("=" * 50)
        logger.info("Polymarket Momentum Bot Starting")
        logger.info(f"Mode: {'Paper Trading' if self.paper_trading else 'LIVE'}")
        logger.info(f"Initial Bankroll: ${self.trader.initial_bankroll}")
        logger.info(f"Poll Interval: {self.poll_interval}s")
        logger.info("=" * 50)
        
        while self.running:
            try:
                self.run_iteration()
            except Exception as e:
                logger.error(f"Error in iteration: {e}", exc_info=True)
            
            await asyncio.sleep(self.poll_interval)
    
    def stop(self):
        """Stop the bot"""
        self.running = False
        logger.info("Bot stopped")


def main():
    """Entry point"""
    bot = MomentumBot(
        initial_bankroll=1000.0,
        paper_trading=True,
        poll_interval=60
    )
    
    try:
        asyncio.run(bot.run())
    except KeyboardInterrupt:
        bot.stop()
        logger.info("Bot shutdown gracefully")


if __name__ == "__main__":
    main()
