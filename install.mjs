#!/usr/bin/env node

/**
 * Cross-platform installation script for claude-code-notifier
 * Works on Linux, macOS, and Windows
 */

import { execSync } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Installing claude-code-notifier dependencies...');

try {
  execSync('npm install --production', { cwd: __dirname, stdio: 'inherit' });
  console.log('\nclaude-code-notifier installed successfully!');
} catch (error) {
  console.error('\nFailed to install dependencies:', error.message);
  process.exit(1);
}
