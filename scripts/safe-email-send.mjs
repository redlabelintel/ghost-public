#!/usr/bin/env node
/**
 * Safe Email Sender with Duplicate Protection
 * Wrapper around email sending to prevent duplicates
 */

import { checkDuplicate, recordEmail } from './email-tracker.mjs';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const RECIPIENT = process.argv[2];
const SUBJECT = process.argv[3];
const BODY_FILE = process.argv[4];

if (!RECIPIENT || !SUBJECT || !BODY_FILE) {
  console.error('Usage: safe-email-send.mjs <to> <subject> <body-file>');
  process.exit(1);
}

const BODY = require('fs').readFileSync(BODY_FILE, 'utf8');

// Check for duplicate
const duplicateCheck = checkDuplicate(RECIPIENT, SUBJECT, BODY);
if (duplicateCheck.isDuplicate) {
  console.error(duplicateCheck.message);
  process.exit(1);
}

// Send email using Python
const pythonScript = `
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sender_email = "aarontrubic@gmail.com"
receiver_email = "${RECIPIENT}"
password = "itsb lwfc ifdi keuv"

message = MIMEMultipart()
message["From"] = sender_email
message["To"] = receiver_email
message["Subject"] = """${SUBJECT}"""

message.attach(MIMEText("""${BODY.replace(/"/g, '\\"')}""", "plain"))

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, password)
    text = message.as_string()
    server.sendmail(sender_email, receiver_email, text)
    server.quit()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
`;

try {
  const result = execSync(`python3 -c '${pythonScript}'`, { encoding: 'utf8' });
  if (result.includes('SUCCESS')) {
    recordEmail(RECIPIENT, SUBJECT, BODY);
    console.log(`✅ Email sent to ${RECIPIENT} and recorded`);
  } else {
    console.error('❌ Send failed:', result);
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Send error:', e.message);
  process.exit(1);
}
