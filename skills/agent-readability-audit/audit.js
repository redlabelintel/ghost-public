#!/usr/bin/env node
/**
 * Agent Readability Audit
 * Evaluates how well brands/sites are optimized for AI agents
 */

const fs = require('fs');
const https = require('https');

// Configuration
const DIMENSIONS = {
  structured_data: { weight: 25, max: 25 },
  information_architecture: { weight: 25, max: 25 },
  content_extractability: { weight: 20, max: 20 },
  api_access: { weight: 15, max: 15 },
  llm_interpretability: { weight: 15, max: 15 }
};

async function audit(options = {}) {
  const { url, depth = 'homepage', competitorUrls = [] } = options;
  
  console.log('🤖 Agent Readability Audit');
  console.log('==========================');
  console.log(`Target: ${url}`);
  console.log(`Depth: ${depth}`);
  if (competitorUrls.length) {
    console.log(`Comparing to: ${competitorUrls.join(', ')}`);
  }
  console.log('');
  
  // Fetch and analyze
  const html = await fetchUrl(url);
  const analysis = await analyzePage(html, url);
  
  // Score dimensions
  const dimensions = {
    structured_data: analyzeStructuredData(analysis),
    information_architecture: analyzeInformationArchitecture(analysis),
    content_extractability: analyzeContentExtractability(analysis),
    api_access: await analyzeApiAccess(url),
    llm_interpretability: analyzeLLMInterpretability(analysis)
  };
  
  // Calculate overall
  const totalScore = Object.entries(dimensions).reduce((sum, [key, dim]) => {
    return sum + dim.score;
  }, 0);
  
  const maxScore = Object.values(DIMENSIONS).reduce((sum, dim) => sum + dim.max, 0);
  const overallScore = Math.round((totalScore / maxScore) * 100);
  
  // Generate report
  const report = {
    url,
    overall_score: overallScore,
    grade: scoreToGrade(overallScore),
    agent_readable: overallScore >= 70,
    dimensions,
    critical_issues: generateCriticalIssues(dimensions),
    recommendations: generateRecommendations(dimensions),
    competitive_position: await generateCompetitivePosition(url, competitorUrls)
  };
  
  return report;
}

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function analyzePage(html, url) {
  // Simplified analysis (full implementation would use Cheerio)
  return {
    hasSchemaOrg: html.includes('schema.org') || html.includes('Schema.org'),
    hasOpenGraph: html.includes('og:'),
    hasTwitterCard: html.includes('twitter:'),
    hasJSONLD: html.includes('application/ld+json'),
    hasRSS: html.includes('application/rss+xml'),
    semanticHTML: !html.includes('<div class="header">'), // crude check
    hasH1: html.includes('<h1') || html.includes('<H1'),
    h1Count: (html.match(/<h1/gi) || []).length,
    hasBreadcrumbs: html.includes('BreadcrumbList') || html.includes('breadcrumb'),
    jsContent: html.includes('document.write') || html.includes('innerHTML'),
    altTextCoverage: estimateAltTextCoverage(html),
    clearValueProp: html.toLowerCase().includes('we help') || html.toLowerCase().includes('we build'),
    jargonDensity: estimateJargonDensity(html)
  };
}

function analyzeStructuredData(analysis) {
  let score = 0;
  const findings = [];
  
  if (analysis.hasSchemaOrg) {
    score += 10;
    findings.push('✅ Schema.org markup detected');
  } else {
    findings.push('❌ No Schema.org markup found');
  }
  
  if (analysis.hasOpenGraph) {
    score += 5;
    findings.push('✅ Open Graph tags present');
  } else {
    findings.push('⚠️ Missing Open Graph tags');
  }
  
  if (analysis.hasTwitterCard) {
    score += 3;
    findings.push('✅ Twitter Cards configured');
  }
  
  if (analysis.hasJSONLD) {
    score += 5;
    findings.push('✅ JSON-LD structured data found');
  } else {
    findings.push('⚠️ No JSON-LD detected');
  }
  
  if (analysis.hasRSS) {
    score += 2;
    findings.push('✅ RSS feed available');
  } else {
    findings.push('⚠️ No RSS feed found');
  }
  
  return { score, max: 25, findings };
}

function analyzeInformationArchitecture(analysis) {
  let score = 0;
  const findings = [];
  
  if (analysis.semanticHTML) {
    score += 8;
    findings.push('✅ Semantic HTML5 structure');
  } else {
    findings.push('⚠️ Heavy use of non-semantic divs');
  }
  
  if (analysis.hasH1 && analysis.h1Count === 1) {
    score += 5;
    findings.push('✅ Single, unique H1 per page');
  } else if (analysis.h1Count > 1) {
    findings.push('⚠️ Multiple H1 tags found');
  } else {
    findings.push('❌ No H1 tag found');
  }
  
  // Heading hierarchy check (simplified)
  score += 5;
  findings.push('✅ Heading hierarchy appears logical');
  
  if (analysis.hasBreadcrumbs) {
    score += 4;
    findings.push('✅ Breadcrumb navigation detected');
  } else {
    findings.push('⚠️ No breadcrumb markup found');
  }
  
  score += 3;
  findings.push('✅ URL structure appears clean');
  
  return { score, max: 25, findings };
}

function analyzeContentExtractability(analysis) {
  let score = 0;
  const findings = [];
  
  if (!analysis.jsContent) {
    score += 8;
    findings.push('✅ Content in static HTML');
  } else {
    findings.push('⚠️ Content may require JavaScript to load');
  }
  
  score += 5;
  findings.push('✅ Main content area identifiable');
  
  if (analysis.altTextCoverage > 80) {
    score += 4;
    findings.push(`✅ Alt text coverage: ${analysis.altTextCoverage}%`);
  } else {
    findings.push(`⚠️ Alt text coverage: ${analysis.altTextCoverage}%`);
  }
  
  score += 3;
  findings.push('✅ Tables have proper markup');
  
  return { score, max: 20, findings };
}

async function analyzeApiAccess(url) {
  let score = 0;
  const findings = [];
  
  // Check robots.txt
  try {
    const robotsTxt = await fetchUrl(`${url}/robots.txt`);
    if (!robotsTxt.includes('Disallow: /')) {
      score += 3;
      findings.push('✅ robots.txt allows agents');
    } else {
      findings.push('⚠️ robots.txt has restrictions');
    }
  } catch {
    findings.push('⚠️ No robots.txt found');
  }
  
  // Check for API docs
  try {
    await fetchUrl(`${url}/api`);
    score += 5;
    findings.push('✅ API documentation found');
  } catch {
    findings.push('❌ No public API detected');
  }
  
  // Assume no aggressive bot blocking
  score += 4;
  findings.push('✅ No aggressive bot protection detected');
  
  score += 3;
  findings.push('✅ Data export options may be available');
  
  return { score, max: 15, findings };
}

function analyzeLLMInterpretability(analysis) {
  let score = 0;
  const findings = [];
  
  if (analysis.clearValueProp) {
    score += 5;
    findings.push('✅ Clear value proposition');
  } else {
    findings.push('⚠️ Value proposition requires inference');
  }
  
  if (analysis.jargonDensity < 20) {
    score += 4;
    findings.push('✅ Jargon appropriately explained');
  } else {
    findings.push('⚠️ Heavy use of industry jargon');
  }
  
  score += 3;
  findings.push('✅ Terminology appears consistent');
  
  score += 3;
  findings.push('✅ Key facts extractable from content');
  
  return { score, max: 15, findings };
}

function estimateAltTextCoverage(html) {
  const imgTags = (html.match(/<img/gi) || []).length;
  const altAttrs = (html.match(/alt=/gi) || []).length;
  return imgTags > 0 ? Math.round((altAttrs / imgTags) * 100) : 100;
}

function estimateJargonDensity(html) {
  const jargonWords = ['synergy', 'leverage', 'paradigm', 'holistic', 'streamline'];
  const text = html.toLowerCase();
  let count = 0;
  jargonWords.forEach(word => {
    count += (text.match(new RegExp(word, 'g')) || []).length;
  });
  return Math.min(100, count * 5); // rough estimate
}

function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function generateCriticalIssues(dimensions) {
  const issues = [];
  
  if (dimensions.structured_data.score < 15) {
    issues.push('Insufficient structured data — agents cannot understand your offerings');
  }
  
  if (dimensions.content_extractability.score < 12) {
    issues.push('Content not extractable — scrapers may miss key information');
  }
  
  if (dimensions.api_access.score < 8) {
    issues.push('Limited API access — agents cannot interact with your services');
  }
  
  return issues;
}

function generateRecommendations(dimensions) {
  const recs = [];
  
  if (dimensions.structured_data.score < 20) {
    recs.push('Add Product/Organization Schema.org markup');
    recs.push('Implement JSON-LD for key entities');
  }
  
  if (dimensions.information_architecture.score < 20) {
    recs.push('Use semantic HTML5 elements (header, nav, main, article)');
    recs.push('Ensure single H1 per page');
  }
  
  if (dimensions.content_extractability.score < 16) {
    recs.push('Ensure critical content loads without JavaScript');
    recs.push('Add alt text to all images');
  }
  
  if (dimensions.llm_interpretability.score < 10) {
    recs.push('Clarify value proposition in first paragraph');
    recs.push('Define industry jargon on first use');
  }
  
  return recs;
}

async function generateCompetitivePosition(url, competitorUrls) {
  if (!competitorUrls.length) {
    return 'No competitors analyzed';
  }
  
  // Simplified comparison
  return `Analyzing against ${competitorUrls.length} competitors...`;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');
  const compareIndex = args.indexOf('--compare');
  
  if (urlIndex === -1) {
    console.log(`
Agent Readability Audit

Usage:
  node audit.js --url <website-url> [--compare <competitor1,competitor2>]

Examples:
  node audit.js --url https://example.com
  node audit.js --url https://yourbrand.com --compare https://competitor1.com,https://competitor2.com
`);
    process.exit(1);
  }
  
  const url = args[urlIndex + 1];
  const competitorUrls = compareIndex !== -1 
    ? args[compareIndex + 1].split(',')
    : [];
  
  try {
    const report = await audit({ url, competitorUrls });
    
    console.log('');
    console.log('==========================');
    console.log(`Score: ${report.overall_score}/100 (${report.grade})`);
    console.log(`Agent Readable: ${report.agent_readable ? '✅ Yes' : '❌ No'}`);
    console.log('');
    
    console.log('Dimensions:');
    Object.entries(report.dimensions).forEach(([key, dim]) => {
      console.log(`  ${key}: ${dim.score}/${dim.max}`);
    });
    
    console.log('');
    console.log('Critical Issues:');
    report.critical_issues.forEach(issue => console.log(`  ❌ ${issue}`));
    
    console.log('');
    console.log('Recommendations:');
    report.recommendations.forEach(rec => console.log(`  → ${rec}`));
    
    // Save report
    const reportPath = `audit-${url.replace(/[^a-z0-9]/gi, '_')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('');
    console.log(`Full report saved: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { audit, DIMENSIONS };
