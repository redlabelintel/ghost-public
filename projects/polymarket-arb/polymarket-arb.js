#!/usr/bin/env node
/**
 * Polymarket Arbitrage Bot
 * Paper Trading Edition - No real money at risk
 * 
 * Strategy: Market-neutral arbitrage on binary prediction markets
 * - YES arb: Buy YES on both sides when YES(A) + YES(B) < threshold
 * - NO arb: Buy NO on both sides when NO(A) + NO(B) < threshold
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Paper trading settings
  INITIAL_BALANCE: 10000,        // Starting paper balance (USDC)
  MAX_POSITION_PER_SIDE: 7000,   // Max paper position per side ($7K)
  ARB_THRESHOLD: 0.98,           // 98¢ threshold (accounts for 2% fee)
  MIN_PROFIT_MARGIN: 0.01,       // Minimum 1% profit after fees
  
  // Scanning settings
  SCAN_INTERVAL_MS: 30000,       // 30 seconds between scans
  MARKETS_PER_SCAN: 50,          // Max markets to analyze per scan
  
  // Risk management
  MAX_CONCURRENT_POSITIONS: 10,  // Max open positions
  SLIPPAGE_TOLERANCE: 0.005,     // 0.5% slippage tolerance
  
  // State files
  STATE_DIR: path.join(__dirname, 'state'),
  TRADES_FILE: path.join(__dirname, 'state', 'paper-trades.json'),
  POSITIONS_FILE: path.join(__dirname, 'state', 'open-positions.json'),
  PERFORMANCE_FILE: path.join(__dirname, 'state', 'performance.json'),
};

// Ensure state directory exists
if (!fs.existsSync(CONFIG.STATE_DIR)) {
  fs.mkdirSync(CONFIG.STATE_DIR, { recursive: true });
}

// State management
function loadState(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error loading ${filePath}:`, e.message);
  }
  return defaultValue;
}

function saveState(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Initialize performance tracking
function initPerformance() {
  const performance = loadState(CONFIG.PERFORMANCE_FILE, {
    startDate: new Date().toISOString(),
    initialBalance: CONFIG.INITIAL_BALANCE,
    currentBalance: CONFIG.INITIAL_BALANCE,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    dailyStats: {}
  });
  saveState(CONFIG.PERFORMANCE_FILE, performance);
  return performance;
}

// Fetch sports markets from Polymarket
async function fetchSportsMarkets() {
  try {
    // Polymarket Gamma API for active markets
    const response = await fetch('https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100&offset=0');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object response formats
    const markets = Array.isArray(data) ? data : (data.markets || []);
    
    // Parse and normalize all markets first
    const normalizedMarkets = markets.map(market => {
      // Parse outcomes from JSON strings if needed
      let outcomes = market.outcomes;
      if (typeof outcomes === 'string') {
        try {
          const names = JSON.parse(outcomes);
          const prices = JSON.parse(market.outcomePrices || '[]');
          outcomes = names.map((name, i) => ({ 
            name, 
            price: parseFloat(prices[i] || 0) 
          }));
        } catch (e) {
          outcomes = null;
        }
      }
      return { ...market, outcomes };
    });
    
    // Filter for binary markets with arbitrage potential
    // Note: Arbitrage works on ANY binary market, not just sports
    const eligibleMarkets = normalizedMarkets.filter(market => {
      const outcomes = market.outcomes;
      
      // Binary markets have exactly 2 outcomes
      const isBinary = outcomes && Array.isArray(outcomes) && outcomes.length === 2;
      
      // Must have valid prices
      const hasPrices = isBinary && outcomes.every(o => {
        const price = parseFloat(o.price);
        return !isNaN(price) && price > 0 && price < 1;
      });
      
      // Include all binary markets for arb scanning
      return isBinary && hasPrices;
    });
    
    return eligibleMarkets.slice(0, CONFIG.MARKETS_PER_SCAN);
  } catch (error) {
    console.error('Error fetching markets:', error.message);
    return [];
  }
}

// Calculate arbitrage opportunity
function checkArbitrage(market) {
  const [outcomeA, outcomeB] = market.outcomes;
  
  const yesA = parseFloat(outcomeA.price);
  const yesB = parseFloat(outcomeB.price);
  const noA = 1 - yesA;
  const noB = 1 - yesB;
  
  const results = {
    marketId: market.conditionId,
    marketTitle: market.question,
    endDate: market.endDate,
    outcomeA: outcomeA.name,
    outcomeB: outcomeB.name,
    yesA,
    yesB,
    noA,
    noB,
    opportunities: []
  };
  
  // Check YES arbitrage
  const yesSum = yesA + yesB;
  if (yesSum < CONFIG.ARB_THRESHOLD) {
    const profit = (1 - yesSum) * 100; // Profit per $1 invested
    results.opportunities.push({
      type: 'YES_ARB',
      sideA: { outcome: outcomeA.name, price: yesA },
      sideB: { outcome: outcomeB.name, price: yesB },
      sum: yesSum,
      profitPercent: profit.toFixed(2),
      expectedProfit: (CONFIG.MAX_POSITION_PER_SIDE * profit / 100).toFixed(2)
    });
  }
  
  // Check NO arbitrage
  const noSum = noA + noB;
  if (noSum < CONFIG.ARB_THRESHOLD) {
    const profit = (1 - noSum) * 100;
    results.opportunities.push({
      type: 'NO_ARB',
      sideA: { outcome: outcomeA.name, price: noA },
      sideB: { outcome: outcomeB.name, price: noB },
      sum: noSum,
      profitPercent: profit.toFixed(2),
      expectedProfit: (CONFIG.MAX_POSITION_PER_SIDE * profit / 100).toFixed(2)
    });
  }
  
  return results.opportunities.length > 0 ? results : null;
}

// Execute paper trade
function executePaperTrade(market, opportunity) {
  const positions = loadState(CONFIG.POSITIONS_FILE, { open: [], settled: [] });
  const performance = loadState(CONFIG.PERFORMANCE_FILE);
  
  // Check if we already have a position on this market
  const existingPosition = positions.open.find(p => p.marketId === market.marketId);
  if (existingPosition) {
    console.log(`  ⚠️  Already have position on ${market.marketTitle}, skipping`);
    return null;
  }
  
  // Check position limit
  if (positions.open.length >= CONFIG.MAX_CONCURRENT_POSITIONS) {
    console.log(`  ⚠️  Max positions reached (${CONFIG.MAX_CONCURRENT_POSITIONS}), skipping`);
    return null;
  }
  
  // Calculate position size
  const positionSize = Math.min(
    CONFIG.MAX_POSITION_PER_SIDE,
    performance.currentBalance / 2  // Don't use more than half balance per trade
  );
  
  const sharesA = positionSize / opportunity.sideA.price;
  const sharesB = positionSize / opportunity.sideB.price;
  const totalCost = positionSize * 2;
  const expectedPayout = Math.max(sharesA, sharesB); // Winner pays $1 per share
  const expectedProfit = expectedPayout - totalCost;
  const profitAfterFee = expectedProfit * 0.98; // 2% Polymarket fee
  
  const trade = {
    id: `paper-${Date.now()}`,
    marketId: market.marketId,
    marketTitle: market.marketTitle,
    endDate: market.endDate,
    type: opportunity.type,
    executedAt: new Date().toISOString(),
    sideA: {
      outcome: opportunity.sideA.outcome,
      price: opportunity.sideA.price,
      shares: sharesA.toFixed(4),
      cost: positionSize.toFixed(2)
    },
    sideB: {
      outcome: opportunity.sideB.outcome,
      price: opportunity.sideB.price,
      shares: sharesB.toFixed(4),
      cost: positionSize.toFixed(2)
    },
    totalCost: totalCost.toFixed(2),
    expectedPayout: expectedPayout.toFixed(2),
    expectedProfit: expectedProfit.toFixed(2),
    profitAfterFee: profitAfterFee.toFixed(2),
    status: 'OPEN'
  };
  
  // Record position
  positions.open.push(trade);
  saveState(CONFIG.POSITIONS_FILE, positions);
  
  // Update performance
  performance.currentBalance -= totalCost;
  performance.totalTrades++;
  saveState(CONFIG.PERFORMANCE_FILE, performance);
  
  // Record trade
  const trades = loadState(CONFIG.TRADES_FILE, []);
  trades.push(trade);
  saveState(CONFIG.TRADES_FILE, trades);
  
  return trade;
}

// Check for settled markets and calculate P&L
function settlePositions() {
  const positions = loadState(CONFIG.POSITIONS_FILE, { open: [], settled: [] });
  const performance = loadState(CONFIG.PERFORMANCE_FILE);
  
  if (positions.open.length === 0) return [];
  
  const now = new Date();
  const settledToday = [];
  
  positions.open = positions.open.filter(position => {
    const endDate = new Date(position.endDate);
    
    // For paper trading, settle if end date has passed + 24 hours (for result resolution)
    if (now > new Date(endDate.getTime() + 24 * 60 * 60 * 1000)) {
      // Simulate random winner for paper trading
      // In real trading, we'd check actual results
      const winnerA = Math.random() > 0.5;
      
      const winningShares = winnerA ? parseFloat(position.sideA.shares) : parseFloat(position.sideB.shares);
      const payout = winningShares * 0.98; // 2% fee
      const profit = payout - parseFloat(position.totalCost);
      
      const settled = {
        ...position,
        settledAt: now.toISOString(),
        winner: winnerA ? position.sideA.outcome : position.sideB.outcome,
        payout: payout.toFixed(2),
        actualProfit: profit.toFixed(2)
      };
      
      positions.settled.push(settled);
      settledToday.push(settled);
      
      // Update performance
      performance.currentBalance += payout;
      if (profit > 0) {
        performance.winningTrades++;
        performance.totalProfit += profit;
      } else {
        performance.losingTrades++;
        performance.totalLoss += Math.abs(profit);
      }
      
      return false; // Remove from open
    }
    
    return true; // Keep in open
  });
  
  saveState(CONFIG.POSITIONS_FILE, positions);
  saveState(CONFIG.PERFORMANCE_FILE, performance);
  
  return settledToday;
}

// Generate performance report
function generateReport() {
  const performance = loadState(CONFIG.PERFORMANCE_FILE);
  const positions = loadState(CONFIG.POSITIONS_FILE, { open: [], settled: [] });
  
  const totalReturn = performance.currentBalance - performance.initialBalance;
  const returnPercent = (totalReturn / performance.initialBalance * 100).toFixed(2);
  const winRate = performance.totalTrades > 0 
    ? (performance.winningTrades / performance.totalTrades * 100).toFixed(1) 
    : 0;
  
  const report = {
    timestamp: new Date().toISOString(),
    balance: {
      initial: performance.initialBalance.toFixed(2),
      current: performance.currentBalance.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      returnPercent: `${returnPercent}%`
    },
    trades: {
      total: performance.totalTrades,
      winning: performance.winningTrades,
      losing: performance.losingTrades,
      winRate: `${winRate}%`,
      totalProfit: performance.totalProfit.toFixed(2),
      totalLoss: performance.totalLoss.toFixed(2),
      netProfit: (performance.totalProfit - performance.totalLoss).toFixed(2)
    },
    positions: {
      open: positions.open.length,
      settled: positions.settled.length
    }
  };
  
  return report;
}

// Main scan loop
async function scan() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Polymarket Arbitrage Bot - Paper Trading`);
  console.log(`🕐 ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // First, settle any completed positions
  const settled = settlePositions();
  if (settled.length > 0) {
    console.log(`💰 Settled ${settled.length} position(s):`);
    settled.forEach(s => {
      const emoji = parseFloat(s.actualProfit) > 0 ? '✅' : '❌';
      console.log(`   ${emoji} ${s.marketTitle}`);
      console.log(`      Winner: ${s.winner} | P&L: $${s.actualProfit}`);
    });
    console.log();
  }
  
  // Fetch markets
  console.log('🔍 Scanning for arbitrage opportunities...');
  const markets = await fetchSportsMarkets();
  console.log(`   Found ${markets.length} sports markets\n`);
  
  // Check each market for arb opportunities
  let opportunitiesFound = 0;
  let tradesExecuted = 0;
  
  for (const market of markets) {
    const arb = checkArbitrage(market);
    if (arb) {
      opportunitiesFound++;
      console.log(`💎 Opportunity #${opportunitiesFound}: ${market.question}`);
      
      arb.opportunities.forEach(opp => {
        console.log(`   Type: ${opp.type}`);
        console.log(`   ${opp.sideA.outcome}: ${(opp.sideA.price * 100).toFixed(1)}¢`);
        console.log(`   ${opp.sideB.outcome}: ${(opp.sideB.price * 100).toFixed(1)}¢`);
        console.log(`   Sum: ${(opp.sum * 100).toFixed(1)}¢ (threshold: ${(CONFIG.ARB_THRESHOLD * 100).toFixed(0)}¢)`);
        console.log(`   Expected profit: ${opp.profitPercent}% (~$${opp.expectedProfit})`);
        
        // Execute paper trade
        const trade = executePaperTrade(arb, opp);
        if (trade) {
          tradesExecuted++;
          console.log(`   📝 PAPER TRADE EXECUTED: ${trade.id}`);
          console.log(`      Cost: $${trade.totalCost} | Expected: $${trade.profitAfterFee}`);
        }
      });
      console.log();
    }
  }
  
  // Print report
  const report = generateReport();
  console.log(`${'─'.repeat(60)}`);
  console.log('📈 PERFORMANCE SUMMARY');
  console.log(`${'─'.repeat(60)}`);
  console.log(`Balance: $${report.balance.current} (from $${report.balance.initial})`);
  console.log(`Return: $${report.balance.totalReturn} (${report.balance.returnPercent})`);
  console.log(`Trades: ${report.trades.total} total (${report.trades.winning} wins, ${report.trades.losing} losses)`);
  console.log(`Win Rate: ${report.trades.winRate}`);
  console.log(`Net P&L: $${report.trades.netProfit}`);
  console.log(`Open Positions: ${report.positions.open}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Save daily stats
  const today = new Date().toISOString().split('T')[0];
  const performance = loadState(CONFIG.PERFORMANCE_FILE);
  performance.dailyStats[today] = report;
  saveState(CONFIG.PERFORMANCE_FILE, performance);
}

// CLI commands
const command = process.argv[2];

switch (command) {
  case 'init':
    initPerformance();
    console.log('✅ Paper trading initialized');
    console.log(`   Starting balance: $${CONFIG.INITIAL_BALANCE}`);
    break;
    
  case 'scan':
    scan().then(() => process.exit(0));
    break;
    
  case 'report':
    const report = generateReport();
    console.log(JSON.stringify(report, null, 2));
    break;
    
  case 'positions':
    const pos = loadState(CONFIG.POSITIONS_FILE, { open: [], settled: [] });
    console.log('OPEN POSITIONS:');
    console.log(JSON.stringify(pos.open, null, 2));
    break;
    
  case 'watch':
    console.log('👁️  Starting watch mode (scanning every 30s, press Ctrl+C to stop)...\n');
    scan();
    setInterval(scan, CONFIG.SCAN_INTERVAL_MS);
    break;
    
  default:
    console.log('Polymarket Arbitrage Bot - Paper Trading');
    console.log('');
    console.log('Commands:');
    console.log('  init     - Initialize paper trading account');
    console.log('  scan     - Run single scan for opportunities');
    console.log('  watch    - Continuous scanning mode');
    console.log('  report   - Show performance report');
    console.log('  positions- Show open positions');
    console.log('');
    console.log('Example:');
    console.log('  node polymarket-arb.js init');
    console.log('  node polymarket-arb.js watch');
}
