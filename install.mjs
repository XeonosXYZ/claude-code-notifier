#!/usr/bin/env node

/**
 * Cross-platform installation script for claude-code-notifier
 * Works on Linux, macOS, and Windows
 */

import { execSync } from 'child_process';

console.log('Installing claude-code-notifier dependencies (global)...');

try {
  // Check if node-notifier is already installed globally
  try {
    execSync('npm list -g node-notifier', { stdio: 'ignore' });
    console.log('node-notifier is already installed globally.');
  } catch {
    console.log('Installing node-notifier globally...');
    execSync('npm install -g node-notifier', { stdio: 'inherit' });
  }
  console.log('\nclaude-code-notifier installed successfully!');
} catch (error) {
  console.error('\nFailed to install dependencies:', error.message);
  console.error('Try running: npm install -g node-notifier');
  process.exit(1);
}
