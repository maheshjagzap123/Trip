/**
 * Auto-version script for ExpenseX
 * Format: YY.MM.release (e.g., 26.07.1, 26.07.2, 26.08.0)
 * - Release resets to 0 when month changes
 * - Auto-increments on each build
 * 
 * Run: node update-version.js
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));

const now = new Date();
const year = String(now.getFullYear()).slice(2); // "26"
const month = String(now.getMonth() + 1).padStart(2, '0'); // "07"

const currentVersion = appJson.expo.version || '1.0.0';
const parts = currentVersion.split('.');

let release = 0;

// If same year.month, increment release number
if (parts.length === 3 && parts[0] === year && parts[1] === month) {
  release = parseInt(parts[2], 10) + 1;
}

const newVersion = `${year}.${month}.${release}`;
appJson.expo.version = newVersion;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`✓ Version updated: ${currentVersion} → ${newVersion}`);
