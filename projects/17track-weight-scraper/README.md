# 17track Weight Scraper

Extract package weights from 17track.net tracking pages for bulk order processing.

## Features

- ✅ **Resume capability** - Stop and restart anytime without losing progress
- ✅ **Batch processing** - Saves results every 10 records
- ✅ **Error recovery** - 3 automatic retries with exponential backoff
- ✅ **Rate limiting** - Respects 17track servers (5s delays)
- ✅ **Progress tracking** - See completion rate and estimated time
- ✅ **Google Sheets ready** - Outputs clean CSV for import

## Installation

### 1. Install Node.js
Download from https://nodejs.org (LTS version recommended)

### 2. Install Browser
```bash
cd projects/17track-weight-scraper
npx playwright install chromium
```

### 3. Prepare Your CSV
Create `input/orders.csv` with your tracking numbers:

```csv
orderId,trackingNumber,customerName,orderDate
12345,YT2604301400120133,John Doe,2024-01-15
12346,YT2604301400120134,Jane Smith,2024-01-16
```

**Important**: The column name must match `trackingNumber` (or edit CONFIG in the script)

## Usage

### Quick Start
```bash
npm start
```

### Run with custom settings
```bash
# Process only first 100 records (for testing)
node 17track-weight-scraper.mjs --limit=100

# Run with visible browser (for debugging)
Edit CONFIG.headless = false in the script
```

## Output

Results save to `output/orders_with_weights.csv`:

```csv
orderId,trackingNumber,customerName,orderDate,packageWeightKg,extractionStatus,extractionNotes,extractedAt
12345,YT2604301400120133,John Doe,2024-01-15,0.128kg,SUCCESS,0.128kg,2024-02-14T17:00:00Z
12346,YT2604301400120134,Jane Smith,2024-01-16,,TRACKING_NOT_FOUND,,2024-02-14T17:00:05Z
```

## Import to Google Sheets

1. Open Google Sheets
2. File → Import
3. Upload → Select `orders_with_weights.csv`
4. Choose "Replace current sheet" or "Create new sheet"
5. Click "Import data"

## Time Estimate for 80,000 Orders

| Scenario | Time |
|----------|------|
| Sequential (5s delay) | ~111 hours (4.6 days) |
| Parallel (4 browsers) | ~28 hours (requires proxies) |
| Recommended: Batches of 10k | Run overnight in chunks |

## Troubleshooting

### "More info button not found"
- 17track may have changed their UI
- The script will retry automatically
- Check if tracking number is valid manually

### Getting blocked/rate limited
- Increase `delayMs` in CONFIG (try 8000 or 10000)
- Use proxies (advanced setup)
- Run during off-peak hours

### Resume from where you left off
- Just run the script again
- Progress is automatically tracked in `.progress.json`

## Configuration Options

Edit these values in `17track-weight-scraper.mjs`:

```javascript
const CONFIG = {
  trackingColumn: 'trackingNumber',  // Your CSV column name
  delayMs: 5000,                      // Seconds between requests
  maxRetries: 3,                      // Retry attempts
  batchSize: 10,                      // Save every N records
  headless: true,                     // false = see browser
  limit: null,                        // 100 = process only 100
};
```

## Advanced: Running on a Server

For 80,000 orders, consider running on a VPS:

```bash
# Install dependencies on Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libgbm-dev libnss3 libatk-bridge2.0-0 libxss1

# Run in background with nohup
nohup node 17track-weight-scraper.mjs > scraper.log 2>&1 &

# Monitor progress
tail -f scraper.log
```

## License

MIT - Use at your own risk. Respect 17track's Terms of Service.
