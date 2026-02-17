#!/usr/bin/env node
/**
 * Email Duplicate Prevention Tracker
 * Prevents sending duplicate emails within a 24-hour window
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const TRACKER_FILE = '/Users/ghost/.openclaw/workspace/.email-tracker.json';
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadTracker() {
  if (!existsSync(TRACKER_FILE)) {
    return { emails: [], lastCleaned: Date.now() };
  }
  try {
    return JSON.parse(readFileSync(TRACKER_FILE, 'utf8'));
  } catch {
    return { emails: [], lastCleaned: Date.now() };
  }
}

function saveTracker(tracker) {
  writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
}

function generateEmailHash(to, subject, body) {
  const content = `${to.toLowerCase().trim()}|${subject.toLowerCase().trim()}|${body.slice(0, 200).toLowerCase().trim()}`;
  return createHash('sha256').update(content).digest('hex');
}

function cleanOldEntries(tracker) {
  const now = Date.now();
  tracker.emails = tracker.emails.filter(e => (now - e.timestamp) < DUPLICATE_WINDOW_MS);
  tracker.lastCleaned = now;
  return tracker;
}

export function checkDuplicate(to, subject, body) {
  const tracker = cleanOldEntries(loadTracker());
  const hash = generateEmailHash(to, subject, body);
  
  const existing = tracker.emails.find(e => e.hash === hash);
  if (existing) {
    const hoursAgo = ((Date.now() - existing.timestamp) / (1000 * 60 * 60)).toFixed(1);
    return {
      isDuplicate: true,
      message: `⚠️ DUPLICATE EMAIL BLOCKED: Similar email sent ${hoursAgo} hours ago to ${to}`,
      previousSent: new Date(existing.timestamp).toISOString()
    };
  }
  
  return { isDuplicate: false };
}

export function recordEmail(to, subject, body) {
  const tracker = loadTracker();
  const hash = generateEmailHash(to, subject, body);
  
  tracker.emails.push({
    hash,
    to: to.toLowerCase().trim(),
    subject: subject.slice(0, 100),
    timestamp: Date.now(),
    sentAt: new Date().toISOString()
  });
  
  saveTracker(cleanOldEntries(tracker));
}

// CLI usage
if (process.argv[2] === 'check') {
  const to = process.argv[3];
  const subject = process.argv[4];
  const body = process.argv[5] || '';
  const result = checkDuplicate(to, subject, body);
  console.log(JSON.stringify(result));
  process.exit(result.isDuplicate ? 1 : 0);
}

if (process.argv[2] === 'record') {
  const to = process.argv[3];
  const subject = process.argv[4];
  const body = process.argv[5] || '';
  recordEmail(to, subject, body);
  console.log('✅ Email recorded');
}
