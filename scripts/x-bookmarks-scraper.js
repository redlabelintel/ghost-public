#!/usr/bin/env node
/**
 * X Bookmarks Scraper via Puppeteer
 * Logs into X, navigates to bookmarks, extracts all content
 * Run: node scripts/x-bookmarks-scraper.js [--headless] [--limit N]
 */

const puppeteer = require('puppeteer');
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
  
  console.log('🐦 X Bookmarks Scraper');
  console.log('=======================');
  console.log(`Mode: ${headless ? 'Headless' : 'Visible (for debugging)'}`);
  console.log('');
  
  if (!CONFIG.password) {
    console.error('❌ X_PASSWORD not set in environment');
    console.log('Set: export X_PASSWORD=your_x_password');
    process.exit(1);
  }
  
  let browser;
  
  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Go to login
    console.log('Navigating to login...');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });
    
    // Enter username
    console.log('Entering username...');
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
    await page.type('input[autocomplete="username"]', CONFIG.username);
    await page.keyboard.press('Enter');
    
    // Wait for password field
    await delay(2000);
    
    // Enter password
    console.log('Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', CONFIG.password);
    await page.keyboard.press('Enter');
    
    // Wait for login to complete
    console.log('Waiting for login...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if logged in
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('flow')) {
      console.error('❌ Login failed or 2FA required');
      console.log('URL:', currentUrl);
      
      if (!headless) {
        console.log('Browser kept open for manual intervention');
        console.log('Press Ctrl+C when done');
        await delay(60000);
      }
      
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Logged in successfully');
    
    // Navigate to bookmarks
    console.log('Navigating to bookmarks...');
    await page.goto(CONFIG.bookmarksUrl, { waitUntil: 'networkidle2' });
    
    // Wait for tweets to load
    console.log('Waiting for bookmarks to load...');
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });
    
    // Scroll to load all bookmarks
    console.log(`Scrolling to load bookmarks (max ${CONFIG.scrollAttempts} attempts)...`);
    
    let previousHeight = 0;
    let sameHeightCount = 0;
    let scrollCount = 0;
    const bookmarks = new Map(); // Use Map to deduplicate by URL
    
    while (scrollCount < CONFIG.scrollAttempts) {
      // Extract current bookmarks
      const newBookmarks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map(tweet => {
          const textEl = tweet.querySelector('[data-testid="tweetText"]');
          const authorEl = tweet.querySelector('[data-testid="User-Name"] a[role="link"]');
          const timeEl = tweet.querySelector('time');
          const linkEl = timeEl?.closest('a');
          
          return {
            text: textEl?.innerText || '',
            author: authorEl?.href?.split('/').pop() || '',
            authorName: authorEl?.querySelector('span')?.innerText || '',
            date: timeEl?.dateTime || '',
            url: linkEl?.href || '',
            tweetId: linkEl?.href?.split('/').pop() || ''
          };
        });
      });
      
      // Add to Map (deduplicates)
      newBookmarks.forEach(b => {
        if (b.url) bookmarks.set(b.url, b);
      });
      
      // Check if limit reached
      if (limit > 0 && bookmarks.size >= limit) {
        console.log(`Reached limit of ${limit} bookmarks`);
        break;
      }
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(CONFIG.scrollDelay);
      
      // Check if reached end
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 3) {
          console.log('Reached end of bookmarks');
          break;
        }
      } else {
        sameHeightCount = 0;
      }
      previousHeight = currentHeight;
      scrollCount++;
      
      if (scrollCount % 10 === 0) {
        console.log(`  Scroll ${scrollCount}: ${bookmarks.size} bookmarks found`);
      }
    }
    
    console.log('');
    console.log('=======================');
    console.log(`Total bookmarks extracted: ${bookmarks.size}`);
    
    // Save to file
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFile = path.join(CONFIG.outputDir, `x-bookmarks-${timestamp}.json`);
    
    const bookmarkArray = Array.from(bookmarks.values());
    fs.writeFileSync(outputFile, JSON.stringify(bookmarkArray, null, 2));
    
    console.log(`Saved to: ${outputFile}`);
    
    // Create summary
    const summary = {
      extractedAt: new Date().toISOString(),
      count: bookmarkArray.length,
      authors: [...new Set(bookmarkArray.map(b => b.author).filter(Boolean))],
      dateRange: {
        oldest: bookmarkArray.length > 0 ? bookmarkArray[bookmarkArray.length - 1].date : null,
        newest: bookmarkArray.length > 0 ? bookmarkArray[0].date : null
      }
    };
    
    console.log('');
    console.log('Summary:');
    console.log(`  Unique authors: ${summary.authors.length}`);
    console.log(`  Date range: ${summary.dateRange.oldest} to ${summary.dateRange.newest}`);
    
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
    .then(bookmarks => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { scrapeBookmarks };
