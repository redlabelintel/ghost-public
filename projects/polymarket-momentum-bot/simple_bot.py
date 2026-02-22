#!/usr/bin/env python3
"""
Polymarket Momentum Bot v1.1 - Simplified
Uses official py_clob_client for authentication
"""

import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment
load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger('bot')

# Try importing py_clob_client
try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import ApiCreds
    HAS_CLIENT = True
except ImportError:
    HAS_CLIENT = False
    logger.error("py_clob_client not installed. Run: pip install py-clob-client")


def main():
    api_key = os.getenv('POLYMARKET_API_KEY')
    secret = os.getenv('POLYMARKET_SECRET')
    passphrase = os.getenv('POLYMARKET_PASSPHRASE')
    
    if not all([api_key, secret, passphrase]):
        logger.error("Missing API credentials in .env file")
        return
    
    if not HAS_CLIENT:
        logger.error("Cannot run without py_clob_client")
        return
    
    # Initialize client
    host = "https://clob.polymarket.com"
    creds = ApiCreds(api_key=api_key, api_secret=secret, api_passphrase=passphrase)
    client = ClobClient(host, creds=creds)
    
    logger.info("=" * 50)
    logger.info("Polymarket Momentum Bot Starting")
    logger.info("Mode: Paper Trading")
    logger.info("=" * 50)
    
    try:
        # Test connection - get markets
        markets = client.get_markets()
        logger.info(f"Connected! Found {len(markets)} markets")
        
        # Show first few markets
        market_list = markets.get('data', []) if isinstance(markets, dict) else markets
        for i, market in enumerate(market_list[:3]):
            q = market.get('question', 'Unknown') if isinstance(market, dict) else str(market)
            logger.info(f"Market {i+1}: {q[:50]}...")
        
        # Paper trading simulation
        bankroll = 1000.0
        logger.info(f"Paper bankroll: ${bankroll}")
        
        # In a real implementation, would:
        # 1. Fetch market data
        # 2. Calculate momentum signals
        # 3. Size positions with Kelly Criterion
        # 4. Execute paper trades
        
        logger.info("Bot running (paper mode) - no real trades executed")
        
    except Exception as e:
        logger.error(f"Error: {e}")


if __name__ == "__main__":
    main()
