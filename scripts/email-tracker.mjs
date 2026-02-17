#!/usr/bin/env node
/**
 * Email Duplicate Prevention Tracker
 * Prevents sending duplicate emails within a 24-hour window
 * AND prevents multiple sends in the same request (CRITICAL)
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { createHash } from 'crypto';

const TRACKER_FILE = '/Users/ghost/.openclaw/workspace/.email-tracker.json';
const LOCK_FILE = '/Users/ghost/.openclaw/workspace/.email-send.lock';
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOCK_TIMEOUT_MS = 30 * 1000; // 30 seconds max lock time

// In-memory request tracking (prevents same-session duplicates)
const sessionSentEmails = new Set();

/**
 * ACQUIRE SEND LOCK - Prevents concurrent sends
 * Returns true if lock acquired, false if another send is in progress
 */
export function acquireSendLock(requestId) {
  try {
    // Check if lock exists and is fresh
    if (existsSync(LOCK_FILE)) {
      const lockData = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
      const lockAge = Date.now() - lockData.timestamp;
      
      if (lockAge < LOCK_TIMEOUT_MS) {
        console.error(`🔒 Send lock active (age: ${(lockAge/1000).toFixed(1)}s)`);
        return false;
      }
      
      // Stale lock, remove it
      console.log('🧹 Cleaning stale lock file');
      unlinkSync(LOCK_FILE);
    }
    
    // Create lock
    writeFileSync(LOCK_FILE, JSON.stringify({
      timestamp: Date.now(),
      requestId: requestId || 'unknown'
    }));
    
    return true;
  } catch (e) {
    console.error('Lock error:', e.message);
    return false;
  }
}

/**
 * RELEASE SEND LOCK
 */
export function releaseSendLock() {
  try {
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE);
    }
  } catch (e) {
    // Ignore release errors
  }
}

/**
 * CHECK IF EMAIL ALREADY SENT THIS SESSION
 */
export function checkSessionDuplicate(to, subject) {
  const key = `${to.toLowerCase().trim()}|${subject.toLowerCase().trim()}`;
  if (sessionSentEmails.has(key)) {
    return {
      isDuplicate: true,
      message: `🚫 SESSION DUPLICATE: Email to ${to} with subject "${subject}" already sent in this request`
    };
  }
  return { isDuplicate: false };
}

/**
 * MARK EMAIL AS SENT THIS SESSION
 */
export function markSessionSent(to, subject) {
  const key = `${to.toLowerCase().trim()}|${subject.toLowerCase().trim()}`;
  sessionSentEmails.add(key);
}

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
