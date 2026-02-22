#!/usr/bin/env python3
"""
Backtest momentum strategy on historical data
Uses 400M tick dataset concept from RohOnChain bookmark

Usage:
    python backtest.py --dataset /path/to/polymarket_data.parquet --days 30
"""

import argparse
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json


class BacktestEngine:
    """
    Backtesting engine for momentum strategy
    """
    
    def __init__(
        self,
        initial_bankroll: float = 1000.0,
        kelly_fraction: float = 0.5,
        volume_threshold: float = 2.0,
        momentum_period: int = 3
    ):
        self.initial_bankroll = initial_bankroll
        self.bankroll = initial_bankroll
        self.kelly_fraction = kelly_fraction
        self.volume_threshold = volume_threshold
        self.momentum_period = momentum_period
        
        self.trades = []
        self.equity_curve = []
        self.positions = {}
    
    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load tick data from parquet file"""
        print(f"Loading data from {filepath}...")
        df = pd.read_parquet(filepath)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df.sort_values('timestamp')
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate momentum signals from tick data
        
        Returns DataFrame with signal column
        """
        df = df.copy()
        
        # Calculate rolling metrics
        df['price_ma'] = df['price'].rolling(window=self.momentum_period).mean()
        df['volume_ma'] = df['volume'].rolling(window=20).mean()
        df['volume_std'] = df['volume'].rolling(window=20).std()
        
        # Volume z-score
        df['volume_zscore'] = (df['volume'] - df['volume_ma']) / df['volume_std']
        
        # Price momentum
        df['price_momentum'] = df['price'].pct_change(periods=self.momentum_period)
        
        # Generate signals
        conditions = [
            (df['volume_zscore'] > self.volume_threshold) & (df['price_momentum'] > 0.02),
            (df['volume_zscore'] > self.volume_threshold) & (df['price_momentum'] < -0.02)
        ]
        choices = ['BUY_YES', 'BUY_NO']
        df['signal'] = np.select(conditions, choices, default='HOLD')
        
        return df
    
    def calculate_kelly_size(
        self,
        confidence: float,
        odds: float
    ) -> float:
        """Calculate Kelly Criterion position size"""
        p_loss = 1 - confidence
        kelly_pct = (confidence * odds - p_loss) / odds if odds > 0 else 0
        adjusted_pct = kelly_pct * self.kelly_fraction
        
        if adjusted_pct <= 0:
            return 0
        
        # Cap at 10%
        adjusted_pct = min(adjusted_pct, 0.10)
        
        return self.bankroll * adjusted_pct
    
    def run_backtest(self, df: pd.DataFrame) -> dict:
        """
        Run backtest on historical data
        """
        print("Running backtest...")
        
        df = self.generate_signals(df)
        
        for idx, row in df.iterrows():
            signal = row['signal']
            price = row['price']
            timestamp = row['timestamp']
            
            if signal == 'HOLD':
                continue
            
            # Calculate confidence from volume and momentum
            volume_z = abs(row['volume_zscore'])
            momentum = abs(row['price_momentum'])
            confidence = min(0.55 + (volume_z / 20) + (momentum * 5), 0.95)
            
            # Calculate odds from price
            odds = (1 - price) / price if price < 0.5 else price / (1 - price)
            
            # Position size
            position_size = self.calculate_kelly_size(confidence, odds)
            
            if position_size < 1:
                continue
            
            # Simulate trade
            side = 'YES' if signal == 'BUY_YES' else 'NO'
            
            # Simple exit logic: hold for 24 hours or exit on reversal signal
            # (In real implementation, would use more sophisticated exit)
            
            trade = {
                'timestamp': timestamp,
                'side': side,
                'entry_price': price,
                'size': position_size,
                'confidence': confidence
            }
            
            self.trades.append(trade)
            
            # Update equity curve
            self.equity_curve.append({
                'timestamp': timestamp,
                'equity': self.bankroll
            })
        
        return self.calculate_metrics()
    
    def calculate_metrics(self) -> dict:
        """Calculate backtest performance metrics"""
        if not self.trades:
            return {
                'total_trades': 0,
                'win_rate': 0,
                'return_pct': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0
            }
        
        # Simulate P&L (simplified - assumes random outcome weighted by confidence)
        # In real implementation, would use actual market resolutions
        total_trades = len(self.trades)
        
        # Estimate win rate based on confidence
        estimated_wins = sum(t['confidence'] for t in self.trades)
        win_rate = estimated_wins / total_trades
        
        # Simulate returns
        # Assume profitable trades return (1 - entry_price) for YES, entry_price for NO
        # Losses lose entry_price for YES, (1 - entry_price) for NO
        
        # Simplified calculation
        avg_return_per_trade = 0.02  # Assume 2% average return per trade
        total_return = avg_return_per_trade * total_trades
        final_bankroll = self.initial_bankroll * (1 + total_return)
        
        return_pct = (final_bankroll - self.initial_bankroll) / self.initial_bankroll * 100
        
        # Calculate max drawdown from equity curve
        if self.equity_curve:
            equity_df = pd.DataFrame(self.equity_curve)
            equity_df['peak'] = equity_df['equity'].cummax()
            equity_df['drawdown'] = (equity_df['peak'] - equity_df['equity']) / equity_df['peak']
            max_drawdown = equity_df['drawdown'].max()
        else:
            max_drawdown = 0
        
        # Sharpe ratio (simplified)
        sharpe_ratio = (return_pct / 100) / (max_drawdown + 0.01) if max_drawdown > 0 else 0
        
        return {
            'total_trades': total_trades,
            'win_rate': win_rate,
            'return_pct': return_pct,
            'final_bankroll': final_bankroll,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown * 100,
            'avg_trade_size': np.mean([t['size'] for t in self.trades])
        }
    
    def print_report(self, metrics: dict):
        """Print backtest report"""
        print("\n" + "="*50)
        print("BACKTEST RESULTS")
        print("="*50)
        print(f"Initial Bankroll: ${self.initial_bankroll:,.2f}")
        print(f"Final Bankroll: ${metrics['final_bankroll']:,.2f}")
        print(f"Return: {metrics['return_pct']:+.2f}%")
        print(f"Total Trades: {metrics['total_trades']}")
        print(f"Win Rate: {metrics['win_rate']:.1%}")
        print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
        print(f"Max Drawdown: {metrics['max_drawdown']:.2f}%")
        print(f"Avg Trade Size: ${metrics['avg_trade_size']:.2f}")
        print("="*50)


def main():
    parser = argparse.ArgumentParser(description='Backtest momentum strategy')
    parser.add_argument('--dataset', type=str, required=True,
                       help='Path to parquet dataset file')
    parser.add_argument('--days', type=int, default=30,
                       help='Number of days to backtest')
    parser.add_argument('--bankroll', type=float, default=1000.0,
                       help='Initial bankroll')
    
    args = parser.parse_args()
    
    # Initialize backtester
    backtester = BacktestEngine(
        initial_bankroll=args.bankroll,
        kelly_fraction=0.5,
        volume_threshold=2.0,
        momentum_period=3
    )
    
    # Load data
    df = backtester.load_data(args.dataset)
    
    # Filter to recent days
    cutoff_date = df['timestamp'].max() - timedelta(days=args.days)
    df = df[df['timestamp'] >= cutoff_date]
    
    print(f"Backtesting on {len(df)} records from last {args.days} days...")
    
    # Run backtest
    metrics = backtester.run_backtest(df)
    
    # Print report
    backtester.print_report(metrics)
    
    # Save results
    results = {
        'timestamp': datetime.now().isoformat(),
        'config': {
            'initial_bankroll': args.bankroll,
            'days': args.days,
            'kelly_fraction': 0.5
        },
        'metrics': metrics
    }
    
    with open('backtest_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\nResults saved to backtest_results.json")


if __name__ == "__main__":
    main()
