# Polymarket Arbitrage Bot

**Status:** Paper Trading Mode 📄  
**Strategy:** Market-neutral arbitrage on binary prediction markets

## Overview

This bot implements the $619K Polymarket arbitrage strategy:
- **YES Arb:** Buy YES on both outcomes when YES(A) + YES(B) < 98¢
- **NO Arb:** Buy NO on both outcomes when NO(A) + NO(B) < 98¢

One side always wins and pays $1. You pocket the gap minus Polymarket's 2% fee.

## Quick Start

```bash
# 1. Initialize paper trading account
node polymarket-arb.js init

# 2. Run a single scan
node polymarket-arb.js scan

# 3. Start continuous monitoring (paper trades every 30s)
node polymarket-arb.js watch
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize with $10,000 paper balance |
| `scan` | Single scan for arbitrage opportunities |
| `watch` | Continuous scanning (every 30 seconds) |
| `report` | Show performance summary |
| `positions` | List all open positions |

## Configuration

Edit these values in `polymarket-arb.js`:

```javascript
INITIAL_BALANCE: 10000,        // Starting paper balance (USDC)
MAX_POSITION_PER_SIDE: 7000,   // Max position per side ($7K)
ARB_THRESHOLD: 0.98,           // 98¢ threshold (2% fee buffer)
SCAN_INTERVAL_MS: 30000,       // 30 seconds between scans
MAX_CONCURRENT_POSITIONS: 10,  // Max open positions
```

## How Paper Trading Works

1. **Detection:** Scans Polymarket Gamma API for sports markets
2. **Analysis:** Checks for YES/NO arbitrage opportunities
3. **Simulation:** Records "paper" trades when arb is found
4. **Settlement:** Auto-settles positions 24h after market end
5. **P&L:** Tracks virtual profit/loss, win rate, returns

## State Files

All paper trading data stored in `state/`:
- `paper-trades.json` - Complete trade history
- `open-positions.json` - Current open positions
- `performance.json` - Performance metrics & daily stats

## Going Live (Future)

To transition to real trading, you'd need:

1. **Polymarket CLOB API access** - Requires API key
2. **Wallet integration** - EOA with USDC on Polygon
3. **Order execution** - Limit orders with fill-or-kill
4. **Settlement tracking** - Monitor oracle resolutions
5. **Risk controls** - Position sizing, slippage protection

**⚠️ Warning:** Real trading involves:
- Smart contract risk
- Oracle/resolution risk  
- Slippage on larger sizes
- Competition from other bots
- Capital lockup during settlement

## Performance Targets

Based on the $619K wallet analysis:
- ~21 trades per day
- ~$79 profit per trade (average)
- Requires consistent arb opportunities
- Capital efficient: positions settle to $1 winner

## Monitoring

Watch for these patterns during paper trading:
- Arb frequency (how often opportunities appear)
- Profit margins (typical spread size)
- Settlement times (how long capital is locked)
- Competition (do opportunities disappear quickly?)

## Files

```
polymarket-arb/
├── polymarket-arb.js    # Main bot
├── README.md            # This file
└── state/               # Generated during runtime
    ├── paper-trades.json
    ├── open-positions.json
    └── performance.json
```

## Notes

- Paper trading simulates random winners (50/50) for settlement
- Real trading requires checking actual market outcomes
- Arb opportunities may be rare in current market conditions
- Consider this an experiment, not investment advice
