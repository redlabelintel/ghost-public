/**
 * Link Verification Utility
 * Self-healing link validation before sending to user
 */

const https = require('https');
const http = require('http');

/**
 * Verify a URL exists before sending it
 * @param {string} url - URL to verify
 * @returns {Promise<{valid: boolean, status?: number, error?: string}>}
 */
async function verifyLink(url) {
  // Skip non-HTTP URLs
  if (!url.startsWith('http')) {
    return { valid: true }; // Assume local paths are valid
  }

  // Skip already-verified URLs in this session (cache)
  if (verifyLink.cache.has(url)) {
    return verifyLink.cache.get(url);
  }

  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      const result = { 
        valid: res.statusCode < 400, 
        status: res.statusCode 
      };
      
      // Cache result
      verifyLink.cache.set(url, result);
      
      resolve(result);
    });

    req.on('error', (err) => {
      const result = { valid: false, error: err.message };
      verifyLink.cache.set(url, result);
      resolve(result);
    });

    req.on('timeout', () => {
      req.destroy();
      const result = { valid: false, error: 'Timeout' };
      verifyLink.cache.set(url, result);
      resolve(result);
    });

    req.end();
  });
}

// Initialize cache
verifyLink.cache = new Map();

/**
 * Verify multiple links and report failures
 * @param {string[]} urls - URLs to verify
 * @returns {Promise<{allValid: boolean, failures: Array<{url: string, status?: number, error?: string}>}>}
 */
async function verifyLinks(urls) {
  const results = await Promise.all(
    urls.map(async (url) => {
      const result = await verifyLink(url);
      return { url, ...result };
    })
  );

  const failures = results.filter(r => !r.valid);
  
  return {
    allValid: failures.length === 0,
    failures
  };
}

/**
 * Extract GitHub URLs from text
 * @param {string} text
 * @returns {string[]}
 */
function extractGitHubUrls(text) {
  const githubRegex = /https:\/\/github\.com\/[^\s\)\]\>]+/g;
  return text.match(githubRegex) || [];
}

module.exports = {
  verifyLink,
  verifyLinks,
  extractGitHubUrls
};

// CLI usage
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: node link-verifier.js <url>');
    process.exit(1);
  }
  
  verifyLink(url).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  });
}
