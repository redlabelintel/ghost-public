#!/usr/bin/env node
/**
 * X Bookmarks Scraper via Playwright
 * More reliable than Puppeteer, better anti-detection
 * Run: node scripts/x-bookmarks-playwright.js [--headless] [--limit N]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  loginUrl: 'https://x.com/i/flow/login',
  bookmarksUrl: 'https://x.com/i/bookmarks',
  username: process.env.X_USERNAME || 'redlabelintel',
  password: process.env.X_PASSWORD,
  outputDir: path.join(__dirname, '..', 'analysis', 'bookmarks-raw'),
  scrollAttempts: 50,
  scrollDelay: 2000
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeBookmarks(options = {}) {
  const headless = options.headless !== false;
  const limit = options.limit || 0;
  
  console.log('🎭 X Bookmarks Scraper (Playwright)');
  console.log('====================================');
  console.log(`Mode: ${headless ? 'Headless' : 'Visible'}`);
  console.log('');
  
  if (!CONFIG.password) {
    console.error('❌ X_PASSWORD not set');
    process.exit(1);
  }
  
  let browser;
  
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });
    
    // Inject script to hide automation
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });
    
    const page = await context.newPage();
    
    // Navigate to login
    console.log('Navigating to login...');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle' });
    
    // Handle login flow with retries
    console.log('Entering credentials...');
    
    try {
      // Try to find and fill username
      await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
      await page.fill('input[autocomplete="username"]', CONFIG.username);
      await page.press('input[autocomplete="username"]', 'Enter');
      
      await delay(3000);
      
      // Check if we got a challenge (phone/email verification)
      const currentUrl = page.url();
      if (currentUrl.includes('challenge') || currentUrl.includes('account')) {
        console.log('⚠️  Verification required (2FA/challenge)');
        console.log('Please complete manually in the browser window...');
        
        if (!headless) {
          console.log('Waiting 60 seconds for manual intervention...');
          await delay(60000);
        } else {
          throw new Error('Verification required but running headless');
        }
      }
      
      // Fill password
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      await page.fill('input[type="password"]', CONFIG.password);
      await page.press('input[type="password"]', 'Enter');
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await delay(5000);
      
    } catch (error) {
      console.error('Login flow error:', error.message);
      
      if (!headless) {
        console.log('Browser kept open for debugging');
        console.log('Press Ctrl+C when done');
        await delay(60000);
      }
      
      await browser.close();
      process.exit(1);
    }
    
    // Check if logged in
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('flow')) {
      console.error('❌ Login failed');
      console.log('Current URL:', currentUrl);
      
      if (!headless) {
        console.log('Browser kept open for debugging');
        await delay(60000);
      }
      
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Logged in');
    
    // Navigate to bookmarks
    console.log('Loading bookmarks...');
    await page.goto(CONFIG.bookmarksUrl, { waitUntil: 'networkidle' });
    await delay(5000);
    
    // Wait for tweets
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 20000 });
    console.log('Bookmarks loaded');
    
    // Scroll and collect
    console.log('Collecting bookmarks...');
    const bookmarks = new Map();
    let previousCount = 0;
    let sameCount = 0;
    
    for (let i = 0; i < CONFIG.scrollAttempts; i++) {
      // Extract current
      const newBookmarks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map(tweet => {
          const textEl = tweet.querySelector('[data-testid="tweetText"]');
          const authorEl = tweet.querySelector('a[href^="/"]');
          const timeEl = tweet.querySelector('time');
          
          return {
            text: textEl?.innerText || '',
            author: authorEl?.href?.split('/').pop() || '',
            date: timeEl?.dateTime || '',
            url: timeEl?.closest('a')?.href || ''
          };
        });
      });
      
      newBookmarks.forEach(b => {
        if (b.url) bookmarks.set(b.url, b);
      });
      
      if (limit > 0 && bookmarks.size >= limit) break;
      
      // Check progress
      if (bookmarks.size === previousCount) {
        sameCount++;
        if (sameCount >= 3) {
          console.log('Reached end of bookmarks');
          break;
        }
      } else {
        sameCount = 0;
      }
      previousCount = bookmarks.size;
      
      // Scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(CONFIG.scrollDelay);
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Scroll ${i + 1}: ${bookmarks.size} bookmarks`);
      }
    }
    
    console.log('');
    console.log('====================================');
    console.log(`Total: ${bookmarks.size} bookmarks`);
    
    // Save
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFile = path.join(CONFIG.outputDir, `x-bookmarks-${timestamp}.json`);
    const bookmarkArray = Array.from(bookmarks.values());
    
    fs.writeFileSync(outputFile, JSON.stringify(bookmarkArray, null, 2));
    console.log(`Saved: ${outputFile}`);
    
    await browser.close();
    return bookmarkArray;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const headless = !args.includes('--visible');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 0;
  
  scrapeBookmarks({ headless, limit })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { scrapeBookmarks };
