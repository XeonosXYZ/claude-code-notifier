#!/usr/bin/env node

/**
 * Cross-platform notification hooks for Claude Code
 * Features:
 * - i18n support (auto-detect system language)
 * - Custom Claude icon
 * - Click-to-focus terminal
 *
 * Usage:
 *   node notify.mjs start-timer
 *   node notify.mjs check-duration
 *   node notify.mjs permission-request
 */

import notifier from 'node-notifier';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { tmpdir, platform } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  durationThreshold: 60, // seconds - notify if task takes longer than this
  iconPath: join(__dirname, '..', 'assets', 'claude-icon.png'),
  appName: 'Claude Code',
};

// ============================================================================
// i18n - Internationalization
// ============================================================================

const MESSAGES = {
  en: {
    completed: 'Completed',
    seconds: 'seconds',
    permissionRequest: 'Permission Request',
    clickToFocus: 'Click to focus terminal',
  },
  ko: {
    completed: '완료',
    seconds: '초',
    permissionRequest: '권한 요청',
    clickToFocus: '클릭하여 터미널로 이동',
  },
  ja: {
    completed: '完了',
    seconds: '秒',
    permissionRequest: '権限リクエスト',
    clickToFocus: 'クリックしてターミナルにフォーカス',
  },
  zh: {
    completed: '完成',
    seconds: '秒',
    permissionRequest: '权限请求',
    clickToFocus: '点击聚焦终端',
  },
  de: {
    completed: 'Abgeschlossen',
    seconds: 'Sekunden',
    permissionRequest: 'Berechtigungsanfrage',
    clickToFocus: 'Klicken zum Fokussieren des Terminals',
  },
  fr: {
    completed: 'Terminé',
    seconds: 'secondes',
    permissionRequest: 'Demande de permission',
    clickToFocus: 'Cliquer pour focus le terminal',
  },
  es: {
    completed: 'Completado',
    seconds: 'segundos',
    permissionRequest: 'Solicitud de permiso',
    clickToFocus: 'Clic para enfocar la terminal',
  },
};

/**
 * Detect system language
 */
function getSystemLanguage() {
  const os = platform();
  let lang = 'en';

  try {
    if (os === 'win32') {
      // Windows: Use PowerShell to get culture
      const result = execSync('powershell -Command "(Get-Culture).TwoLetterISOLanguageName"', {
        encoding: 'utf-8',
        timeout: 3000,
      }).trim();
      lang = result.toLowerCase();
    } else {
      // Linux/macOS: Use LANG environment variable
      const envLang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || '';
      lang = envLang.split('_')[0].split('.')[0].toLowerCase();
    }
  } catch {
    // Fallback to Intl
    try {
      lang = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0].toLowerCase();
    } catch {
      lang = 'en';
    }
  }

  return MESSAGES[lang] ? lang : 'en';
}

/**
 * Get localized message
 */
function t(key) {
  const lang = getSystemLanguage();
  return MESSAGES[lang]?.[key] || MESSAGES.en[key] || key;
}

// ============================================================================
// Terminal Focus
// ============================================================================

/**
 * Get terminal window identifier on session start
 */
function getTerminalWindowId() {
  const os = platform();

  try {
    if (os === 'linux') {
      // Get active window ID using xdotool
      const windowId = execSync('xdotool getactivewindow', { encoding: 'utf-8', timeout: 3000 }).trim();
      return windowId;
    } else if (os === 'darwin') {
      // macOS: Get frontmost app bundle identifier
      const script = 'tell application "System Events" to get bundle identifier of first process whose frontmost is true';
      const bundleId = execSync(`osascript -e '${script}'`, { encoding: 'utf-8', timeout: 3000 }).trim();
      return bundleId;
    } else if (os === 'win32') {
      // Windows: Get active window handle using PowerShell
      const ps = `Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Win{[DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();}';[Win]::GetForegroundWindow().ToInt64()`;
      const hwnd = execSync(`powershell -Command "${ps}"`, { encoding: 'utf-8', timeout: 3000 }).trim();
      return hwnd;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Focus terminal window
 */
function focusTerminal(windowId) {
  if (!windowId) return;

  const os = platform();

  try {
    if (os === 'linux') {
      spawn('xdotool', ['windowactivate', windowId], { detached: true, stdio: 'ignore' }).unref();
    } else if (os === 'darwin') {
      const script = `tell application id "${windowId}" to activate`;
      spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' }).unref();
    } else if (os === 'win32') {
      const ps = `Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Win{[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr hWnd);}';[Win]::SetForegroundWindow([IntPtr]${windowId})`;
      spawn('powershell', ['-Command', ps], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Temp File Management
// ============================================================================

function getTempDir() {
  const dir = join(tmpdir(), 'claude-code-notifier');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getTempFile(sessionId, type) {
  return join(getTempDir(), `${type}-${sessionId}`);
}

// ============================================================================
// Stdin Helper
// ============================================================================

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf-8');
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// ============================================================================
// Notification
// ============================================================================

function notify(title, message, options = {}) {
  const iconPath = existsSync(CONFIG.iconPath) ? CONFIG.iconPath : undefined;

  notifier.notify(
    {
      title,
      message,
      icon: iconPath,
      sound: true,
      wait: options.wait ?? true,
      timeout: options.timeout ?? 10,
      appID: CONFIG.appName,
    },
    (_err, response, metadata) => {
      // Handle click event
      if (response === 'activate' || response === 'clicked' || metadata?.activationType === 'contentsClicked') {
        if (options.windowId) {
          focusTerminal(options.windowId);
        }
      }
    }
  );
}

// ============================================================================
// Hook Handlers
// ============================================================================

/**
 * Hook: Start Timer (UserPromptSubmit)
 * Saves start time and terminal window ID
 */
async function startTimer() {
  const input = await readStdin();
  const sessionId = input.session_id || 'default';
  const prompt = input.prompt || '';

  const startFile = getTempFile(sessionId, 'start');
  const promptFile = getTempFile(sessionId, 'prompt');
  const windowFile = getTempFile(sessionId, 'window');

  // Save start time
  writeFileSync(startFile, Date.now().toString());

  // Save prompt (first 50 chars)
  if (prompt) {
    writeFileSync(promptFile, prompt.slice(0, 50));
  }

  // Save terminal window ID
  const windowId = getTerminalWindowId();
  if (windowId) {
    writeFileSync(windowFile, windowId);
  }
}

/**
 * Hook: Check Duration (Stop)
 * Notifies if task duration exceeded threshold
 */
async function checkDuration() {
  const input = await readStdin();
  const sessionId = input.session_id || 'default';

  const startFile = getTempFile(sessionId, 'start');
  const promptFile = getTempFile(sessionId, 'prompt');
  const windowFile = getTempFile(sessionId, 'window');

  if (!existsSync(startFile)) return;

  try {
    const startTime = parseInt(readFileSync(startFile, 'utf-8'));
    const duration = Math.floor((Date.now() - startTime) / 1000);

    if (duration >= CONFIG.durationThreshold) {
      let message = `${t('completed')} (${duration}${t('seconds')})`;

      if (existsSync(promptFile)) {
        const prompt = readFileSync(promptFile, 'utf-8');
        message = `${t('completed')} (${duration}${t('seconds')})\n${prompt}...`;
      }

      const windowId = existsSync(windowFile) ? readFileSync(windowFile, 'utf-8') : null;

      notify(CONFIG.appName, message, { windowId });
    }

    // Cleanup temp files
    unlinkSync(startFile);
    if (existsSync(promptFile)) unlinkSync(promptFile);
    if (existsSync(windowFile)) unlinkSync(windowFile);
  } catch {
    // Silently fail
  }
}

/**
 * Hook: Permission Request
 * Shows notification for tool permission requests
 */
async function permissionRequest() {
  const input = await readStdin();
  const toolName = input.tool_name || 'unknown';
  const toolInput = input.tool_input || {};
  const sessionId = input.session_id || 'default';

  const detail = toolInput.file_path || toolInput.command || '';
  const shortDetail = detail.slice(0, 50);

  const windowFile = getTempFile(sessionId, 'window');
  const windowId = existsSync(windowFile) ? readFileSync(windowFile, 'utf-8') : null;

  const message = shortDetail
    ? `${t('permissionRequest')}: ${toolName}\n${shortDetail}...`
    : `${t('permissionRequest')}: ${toolName}`;

  notify(CONFIG.appName, message, { windowId, timeout: 30 });
}

// ============================================================================
// Main
// ============================================================================

const command = process.argv[2];

switch (command) {
  case 'start-timer':
    startTimer();
    break;
  case 'check-duration':
    checkDuration();
    break;
  case 'permission-request':
    permissionRequest();
    break;
  default:
    console.error('Usage: node notify.mjs <start-timer|check-duration|permission-request>');
    process.exit(1);
}
