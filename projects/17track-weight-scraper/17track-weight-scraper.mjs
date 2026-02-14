// 17track-weight-scraper.mjs
// Extracts package weights from 17track.net tracking pages
// Handles 80,000+ orders with resume capability and error recovery

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION - Adjust these for your setup
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  // File paths
  inputFile: './input/orders.csv',           // Your input CSV
  outputFile: './output/orders_with_weights.csv',
  progressFile: './output/.progress.json',   // Tracks completed items
  
  // CSV column mapping - adjust to match your file
  trackingColumn: 'trackingNumber',          // Column name for tracking numbers
  
  // Timing (be respectful to 17track servers)
  delayMs: 5000,                             // 5 seconds between requests
  maxRetries: 3,                             // Retry failed requests
  pageLoadTimeout: 30000,                    // 30s page load timeout
  
  // Batch processing
  batchSize: 10,                             // Save progress every N records
  
  // Browser settings
  headless: true,                            // false = see browser window
  
  // Optional: Process only first N records (for testing)
  limit: null,                               // Set to 100 for testing
};

// ═══════════════════════════════════════════════════════════
// MAIN SCRAPER CLASS
// ═══════════════════════════════════════════════════════════
class WeightScraper {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
    this.progress = this.loadProgress();
    this.stats = {
      total: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  // Load progress from previous runs
  loadProgress() {
    try {
      if (fs.existsSync(this.config.progressFile)) {
        const data = JSON.parse(fs.readFileSync(this.config.progressFile, 'utf8'));
        console.log(chalk.blue(`📋 Resuming from previous run: ${data.completed.length} already processed`));
        return new Set(data.completed);
      }
    } catch (err) {
      console.warn(chalk.yellow('⚠️  Could not load progress file, starting fresh'));
    }
    return new Set();
  }

  // Save progress
  saveProgress() {
    try {
      fs.writeFileSync(
        this.config.progressFile,
        JSON.stringify({ completed: Array.from(this.progress), lastUpdate: new Date().toISOString() }, null, 2)
      );
    } catch (err) {
      console.error(chalk.red('❌ Failed to save progress:', err.message));
    }
  }

  // Initialize browser
  async init() {
    console.log(chalk.cyan('🚀 Initializing browser...'));
    
    this.browser = await chromium.launch({ 
      headless: this.config.headless,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      locale: 'en-US'
    });
    
    this.page = await context.newPage();
    
    // Block unnecessary resources to speed up loading
    await this.page.route('**/*.{png,jpg,jpeg,gif,svg,css,font,woff,woff2}', route => route.abort());
    
    console.log(chalk.green('✅ Browser ready\n'));
  }

  // Extract weight from a single tracking number
  async extractWeight(trackingNum) {
    const url = `https://www.17track.net/en/track?nums=${encodeURIComponent(trackingNum)}`;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(chalk.gray(`   Attempt ${attempt}/${this.config.maxRetries}...`));
        
        // Navigate to tracking page
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: this.config.pageLoadTimeout 
        });
        
        // Wait for content to load
        await this.page.waitForTimeout(2500);
        
        // Find and click "More info" button
        const moreInfoBtn = this.page.locator('button:has-text("More info"), [data-testid="more-info"], .more-info').first();
        
        if (!(await moreInfoBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
          console.log(chalk.yellow(`   ⚠️  "More info" button not found`));
          
          // Check if it's an invalid tracking number
          const errorText = await this.page.locator('text=/not found|invalid|error/i').first().textContent().catch(() => null);
          if (errorText) {
            return { success: false, error: 'TRACKING_NOT_FOUND', raw: errorText };
          }
          
          continue; // Retry
        }
        
        await moreInfoBtn.click();
        await this.page.waitForTimeout(1500); // Wait for popup
        
        // Extract Package Weight - multiple selector strategies
        let weight = null;
        
        // Strategy 1: Direct label lookup
        const weightSelectors = [
          'text=Package Weight >> xpath=../following-sibling::*[1]',
          '[data-testid="package-weight"]',
          '.package-weight',
          'td:has-text("Package Weight") + td',
          'div:has(> div:has-text("Package Weight")) > div:last-child'
        ];
        
        for (const selector of weightSelectors) {
          try {
            const element = this.page.locator(selector).first();
            const text = await element.textContent({ timeout: 2000 });
            if (text && text.match(/\d+\.?\d*\s*(kg|g|lb|oz)/i)) {
              weight = text.trim();
              break;
            }
          } catch {
            continue;
          }
        }
        
        // Strategy 2: Parse popup HTML
        if (!weight) {
          const popupHtml = await this.page.locator('.modal, .popup, [role="dialog"]').first().innerHTML().catch(() => '');
          const match = popupHtml.match(/Package Weight[\s\S]*?(\d+\.?\d*\s*(?:kg|g|lb|oz))/i);
          if (match) weight = match[1];
        }
        
        // Close popup
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        
        if (weight) {
          return { success: true, weight, raw: weight };
        } else {
          return { success: false, error: 'WEIGHT_NOT_FOUND', raw: null };
        }
        
      } catch (err) {
        console.log(chalk.red(`   ❌ Error: ${err.message}`));
        if (attempt < this.config.maxRetries) {
          console.log(chalk.yellow(`   ⏳ Waiting 10s before retry...`));
          await this.page.waitForTimeout(10000);
        }
      }
    }
    
    return { success: false, error: 'MAX_RETRIES_EXCEEDED', raw: null };
  }

  // Process all records
  async process() {
    // Read input CSV
    console.log(chalk.cyan(`📖 Reading ${this.config.inputFile}...`));
    
    if (!fs.existsSync(this.config.inputFile)) {
      console.error(chalk.red(`❌ Input file not found: ${this.config.inputFile}`));
      console.log(chalk.yellow('💡 Create an "input" folder and put your orders.csv there'));
      process.exit(1);
    }
    
    const csvData = fs.readFileSync(this.config.inputFile, 'utf8');
    const records = parse(csvData, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true 
    });
    
    this.stats.total = this.config.limit ? Math.min(records.length, this.config.limit) : records.length;
    
    console.log(chalk.green(`✅ Loaded ${records.length} records`));
    console.log(chalk.blue(`📊 ${this.progress.size} already processed, ${this.stats.total - this.progress.size} remaining\n`));
    
    // Create output directory
    const outputDir = path.dirname(this.config.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = [];
    let batchCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      // Respect limit
      if (this.config.limit && i >= this.config.limit) {
        console.log(chalk.yellow(`\n⏹️  Reached limit of ${this.config.limit} records`));
        break;
      }
      
      const record = records[i];
      const trackingNum = record[this.config.trackingColumn];
      
      // Skip if already processed
      if (!trackingNum || this.progress.has(trackingNum)) {
        this.stats.skipped++;
        continue;
      }
      
      console.log(chalk.cyan(`\n[${i + 1}/${this.stats.total}] Processing: ${trackingNum}`));
      
      // Extract weight
      const result = await this.extractWeight(trackingNum);
      
      // Build output record
      const outputRecord = {
        ...record,
        packageWeightKg: result.success ? result.weight : '',
        extractionStatus: result.success ? 'SUCCESS' : result.error,
        extractionNotes: result.raw || '',
        extractedAt: new Date().toISOString()
      };
      
      results.push(outputRecord);
      
      if (result.success) {
        console.log(chalk.green(`   ✅ Weight: ${result.weight}`));
        this.stats.processed++;
      } else {
        console.log(chalk.red(`   ❌ ${result.error}`));
        this.stats.failed++;
      }
      
      // Mark as completed
      this.progress.add(trackingNum);
      batchCount++;
      
      // Save batch
      if (batchCount >= this.config.batchSize) {
        this.saveBatch(results);
        this.saveProgress();
        results.length = 0;
        batchCount = 0;
        
        const elapsed = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const rate = this.stats.processed / (elapsed / 60 || 1);
        console.log(chalk.blue(`\n💾 Progress saved. Rate: ${rate.toFixed(1)} records/min`));
      }
      
      // Rate limiting
      if (i < records.length - 1) {
        await this.page.waitForTimeout(this.config.delayMs);
      }
    }
    
    // Save final batch
    this.saveBatch(results);
    this.saveProgress();
  }

  // Save batch to CSV
  saveBatch(records) {
    if (records.length === 0) return;
    
    const isFirstBatch = !fs.existsSync(this.config.outputFile);
    const csvString = stringify(records, { 
      header: isFirstBatch,
      columns: Object.keys(records[0])
    });
    
    fs.appendFileSync(this.config.outputFile, csvString);
    console.log(chalk.green(`   💾 Saved ${records.length} records to output`));
  }

  // Print final summary
  printSummary() {
    const elapsed = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    console.log(chalk.cyan('\n' + '═'.repeat(50)));
    console.log(chalk.cyan('📊 EXTRACTION SUMMARY'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.green(`✅ Successful:    ${this.stats.processed}`));
    console.log(chalk.red(`❌ Failed:        ${this.stats.failed}`));
    console.log(chalk.yellow(`⏭️  Skipped:       ${this.stats.skipped}`));
    console.log(chalk.blue(`📁 Total:         ${this.stats.total}`));
    console.log(chalk.gray(`⏱️  Time:          ${minutes}m ${seconds}s`));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.green(`\n📂 Output saved to: ${this.config.outputFile}`));
    console.log(chalk.gray('📝 Import this CSV into Google Sheets'));
  }

  // Cleanup
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.gray('\n🔒 Browser closed'));
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SCRIPT ENTRY POINT
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log(chalk.cyan.bold('\n📦 17track Weight Scraper v1.0'));
  console.log(chalk.gray('Extract package weights from 17track.net\n'));
  
  const scraper = new WeightScraper(CONFIG);
  
  try {
    await scraper.init();
    await scraper.process();
    scraper.printSummary();
  } catch (err) {
    console.error(chalk.red('\n💥 Fatal error:', err.message));
    console.error(err.stack);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⏹️  Interrupted by user'));
  console.log(chalk.blue('💾 Progress has been saved. Run again to resume.'));
  process.exit(0);
});

main();
