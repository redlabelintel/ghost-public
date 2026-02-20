#!/usr/bin/env node
/**
 * Raindrop Bookmarks Sync for Ghost AI
 * Fetches bookmarks from Raindrop → Analyzes → Saves to /analysis/
 * Run: node scripts/raindrop-sync.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const RAINDROP_API = 'https://api.raindrop.io/rest/v1';
const RAINDROP_TOKEN = process.env.RAINDROP_TOKEN;
const COLLECTION_NAME = 'X Bookmarks AI';
const ANALYSIS_DIR = path.join(__dirname, '..', 'analysis');
const TRACKER_FILE = path.join(__dirname, '..', 'ops', 'bookmark-tracker.md');

// Load tracker to check for already-analyzed bookmarks
function loadTracker() {
  try {
    const content = fs.readFileSync(TRACKER_FILE, 'utf8');
    // Extract bookmark IDs from tracker (simplified)
    const analyzed = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      // Look for Raindrop IDs in the tracker
      const match = line.match(/_id:\s*(\d+)/);
      if (match) analyzed.push(match[1]);
    });
    return analyzed;
  } catch {
    return [];
  }
}

// Check if bookmark already tracked
function isTracked(raindropId) {
  const tracker = loadTracker();
  return tracker.includes(String(raindropId));
}

// Simple HTTP request wrapper
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${RAINDROP_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// Get all collections with bookmarks
async function getAllCollections() {
  const { items: collections } = await request(`${RAINDROP_API}/collections`);
  
  // Filter to collections that likely contain bookmarks (exclude system/default)
  const bookmarkCollections = collections.filter(c => 
    c.title.toLowerCase().includes('bookmark') ||
    c.title.toLowerCase().includes('ai') ||
    c.title.toLowerCase().includes('x') ||
    c.title.toLowerCase().includes('read') ||
    c.count > 0  // Any collection with items
  );
  
  if (bookmarkCollections.length === 0) {
    // Fall back to default collection
    console.log(`No bookmark collections found, using: ${COLLECTION_NAME}`);
    let defaultCol = collections.find(c => c.title === COLLECTION_NAME);
    if (!defaultCol) {
      defaultCol = await request(`${RAINDROP_API}/collection`, {
        method: 'POST',
        body: { title: COLLECTION_NAME, public: false }
      });
    }
    return [defaultCol];
  }
  
  console.log(`Found ${bookmarkCollections.length} collections with bookmarks:`);
  bookmarkCollections.forEach(c => console.log(`  - ${c.title} (${c.count} items)`));
  
  return bookmarkCollections;
}

// Fetch bookmarks from collection
async function fetchBookmarks(collectionId, page = 0) {
  const result = await request(
    `${RAINDROP_API}/raindrops/${collectionId}?page=${page}&perpage=50`
  );
  
  return result.items || [];
}

// Check if bookmark already analyzed
function isAnalyzed(url) {
  const analyses = fs.readdirSync(ANALYSIS_DIR)
    .filter(f => f.startsWith('x_bookmark_analysis_'))
    .map(f => fs.readFileSync(path.join(ANALYSIS_DIR, f), 'utf8'));
  
  return analyses.some(content => content.includes(url));
}

// Generate analysis filename
function generateFilename(bookmark) {
  const date = new Date(bookmark.created).toISOString().split('T')[0];
  const domain = new URL(bookmark.link).hostname.replace(/\./g, '_');
  return `x_bookmark_analysis_${date}_${domain}.md`;
}

// Create analysis template
function createAnalysis(bookmark) {
  const date = new Date(bookmark.created).toISOString().split('T')[0];
  
  return `# X Bookmark Analysis: ${bookmark.title || 'Untitled'}

**Source**: X (Twitter) via Raindrop  
**Bookmarked**: ${date}  
**URL**: ${bookmark.link}

---

## Summary

**Title**: ${bookmark.title || 'N/A'}

**Excerpt**: 
> ${bookmark.excerpt || 'No excerpt available'}

**Tags**: ${bookmark.tags?.join(', ') || 'None'}

---

## Key Insights

*[To be filled during analysis]*

---

## Strategic Relevance

*[How this applies to your operations]*

---

## Action Items

- [ ] Review in detail
- [ ] Extract key learnings
- [ ] Implement if applicable

---

*Analysis pending — imported via Raindrop sync*
`;
}

// Main sync function
async function sync(options = {}) {
  const dryRun = options.dryRun || false;
  
  console.log('🌧️  Raindrop Bookmarks Sync');
  console.log('============================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  if (!RAINDROP_TOKEN) {
    console.error('❌ RAINDROP_TOKEN not set');
    console.log('\nGet your token:');
    console.log('1. Go to https://app.raindrop.io/settings/integrations');
    console.log('2. Create new app → Copy Test Token');
    console.log('3. Export: export RAINDROP_TOKEN=your_token_here');
    process.exit(1);
  }
  
  try {
    // Get collection
    const collection = await getCollection();
    console.log(`Collection: ${collection?.title || 'X Bookmarks AI'} (ID: ${collection?._id || 67175824})`);
    
    // Fetch bookmarks
    const bookmarks = await fetchBookmarks(collection._id);
    console.log(`Found ${bookmarks.length} bookmarks`);
    console.log('');
    
    let newBookmarks = 0;
    let alreadyAnalyzed = 0;
    
    for (const bookmark of bookmarks) {
      const fileAnalyzed = isAnalyzed(bookmark.link);
      const trackerAnalyzed = isTracked(bookmark._id);
      
      if (fileAnalyzed || trackerAnalyzed) {
        alreadyAnalyzed++;
        console.log(`✓ Already analyzed: ${bookmark.title?.substring(0, 60) || 'Untitled'}...`);
        continue;
      }
      
      console.log(`🆕 New: ${bookmark.title?.substring(0, 60) || 'Untitled'}...`);
      newBookmarks++;
      
      if (!dryRun) {
        const filename = generateFilename(bookmark);
        const filepath = path.join(ANALYSIS_DIR, filename);
        const analysis = createAnalysis(bookmark);
        
        fs.writeFileSync(filepath, analysis);
        console.log(`   → Created: ${filename}`);
      }
    }
    
    console.log('');
    console.log('============================');
    console.log(`New bookmarks: ${newBookmarks}`);
    console.log(`Already analyzed: ${alreadyAnalyzed}`);
    console.log(`Total in collection: ${bookmarks.length}`);
    
    if (!dryRun && newBookmarks > 0) {
      console.log('\n📁 Analysis files created in /analysis/');
      console.log('📝 Review and fill in the "Key Insights" sections');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  sync({ dryRun });
}

module.exports = { sync };
