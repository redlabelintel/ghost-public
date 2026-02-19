#!/usr/bin/env node

/**
 * Crypto Trading Bot - Paper Trading Snapshot
 * Emergency wrapper to run paper trading checks
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🤖 Crypto Trading Bot - Paper Trading Snapshot');
console.log('📅 ' + new Date().toISOString());

// Check for log files
const logPath = join(__dirname, 'logs', 'trading.log');
if (!existsSync(logPath)) {
  console.error('❌ ERROR: No trading.log found at', logPath);
  process.exit(1);
}

// Read recent log entries
try {
  const logContent = readFileSync(logPath, 'utf8');
  const logLines = logContent.trim().split('\n').slice(-50); // Last 50 lines
  
  console.log('\n📊 Recent Trading Activity:');
  console.log('================================');
  
  let hasErrors = false;
  let hasBuySignals = false;
  let hasSellSignals = false;
  let signalCount = 0;
  
  for (const line of logLines) {
    try {
      const entry = JSON.parse(line);
      
      // Check for errors
      if (entry.level === 'error') {
        console.log('❌ ERROR:', entry.message);
        hasErrors = true;
      }
      
      // Check for trading signals
      if (entry.message && typeof entry.message === 'string') {
        const msg = entry.message.toLowerCase();
        
        if (msg.includes('buy signal') || msg.includes('buying')) {
          console.log('🟢 BUY SIGNAL:', entry.message);
          hasBuySignals = true;
          signalCount++;
        } else if (msg.includes('sell signal') || msg.includes('selling')) {
          console.log('🔴 SELL SIGNAL:', entry.message);
          hasSellSignals = true;
          signalCount++;
        } else if (msg.includes('hold') && msg.includes('signal')) {
          console.log('⚪ HOLD:', entry.message);
          signalCount++;
        } else if (msg.includes('narrative intelligence') || msg.includes('coefficients')) {
          console.log('🧠 INTELLIGENCE:', entry.message);
        } else if (entry.level === 'info' && !msg.includes('starting') && !msg.includes('stopping')) {
          console.log('ℹ️ INFO:', entry.message);
        }
      }
    } catch (e) {
      // Skip malformed JSON lines
      continue;
    }
  }
  
  console.log('\n📈 Summary:');
  console.log('===========');
  console.log(`Signals processed: ${signalCount}`);
  console.log(`Errors detected: ${hasErrors ? 'YES' : 'NO'}`);
  console.log(`Buy signals: ${hasBuySignals ? 'YES' : 'NO'}`);
  console.log(`Sell signals: ${hasSellSignals ? 'YES' : 'NO'}`);
  
  // Alert conditions
  if (hasErrors) {
    console.log('\n🚨 ALERT: Errors detected in trading system!');
    process.exit(2);
  }
  
  if (hasBuySignals || hasSellSignals) {
    console.log('\n🚨 ALERT: Trading signals generated!');
    if (hasBuySignals) console.log('   → BUY signals detected');
    if (hasSellSignals) console.log('   → SELL signals detected');
    process.exit(3);
  }
  
  if (signalCount === 0) {
    console.log('\n⚠️  WARNING: No trading signals found in recent logs');
  } else {
    console.log('\n✅ All signals are HOLD - no action required');
  }
  
} catch (error) {
  console.error('❌ ERROR reading trading logs:', error.message);
  process.exit(1);
}