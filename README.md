# Claude Code Notifier

Cross-platform desktop notifications for Claude Code with i18n support, custom icons, and click-to-focus terminal functionality. Easy installation via Claude Code plugin system.

## Features

- **Cross-platform**: Works on Linux, macOS, and Windows
- **i18n Support**: Auto-detects system language (English, Korean, Japanese, Chinese, German, French, Spanish)
- **Custom Icon**: Claude logo for easy identification
- **Click-to-Focus**: Click notification to focus the terminal where Claude Code is running
- **Smart Notifications**:
  - Task completion (when task takes longer than 60 seconds)
  - Permission requests (when Claude needs approval)

## Installation

### Via Claude Code Plugin System (Recommended)

```bash
# Add marketplace
/plugin marketplace add https://github.com/XeonosXYZ/claude-code-notifier.git

# Install plugin
/plugin install claude-code-notifier@claude-code-notifier

# Install dependencies (cross-platform)
node ~/.claude/plugins/cache/claude-code-notifier/claude-code-notifier/*/install.mjs
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/XeonosXYZ/claude-code-notifier.git
   cd claude-code-notifier
   ```

2. Install dependencies (cross-platform):
   ```bash
   node install.mjs
   ```

3. Link to Claude Code plugins directory:
   ```bash
   # Linux/macOS
   ln -s $(pwd) ~/.claude/plugins/marketplaces/claude-code-notifier

   # Windows (PowerShell as Admin)
   New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\plugins\marketplaces\claude-code-notifier" -Target (Get-Location)
   ```

## Requirements

### Linux
- `libnotify` (usually pre-installed)
- `xdotool` (for click-to-focus feature)
  ```bash
  sudo apt install xdotool  # Debian/Ubuntu
  sudo pacman -S xdotool    # Arch
  ```

### macOS
- No additional requirements (uses native notifications)

### Windows
- No additional requirements (uses native toast notifications)

## Configuration

The plugin uses these hooks:

| Hook | Trigger | Action |
|------|---------|--------|
| `UserPromptSubmit` | User sends a prompt | Starts timer, saves terminal window ID |
| `Stop` | Claude finishes task | Shows notification if task took >60s |
| `PermissionRequest` | Claude requests permission | Shows notification with tool details |

### Customization

Edit `hooks/notify.mjs` to customize:

```javascript
const CONFIG = {
  durationThreshold: 60,  // seconds - adjust notification threshold
  // ...
};
```

## Supported Languages

| Language | Code |
|----------|------|
| English | `en` |
| Korean | `ko` |
| Japanese | `ja` |
| Chinese | `zh` |
| German | `de` |
| French | `fr` |
| Spanish | `es` |

The language is auto-detected from your system settings.

## Troubleshooting

### Notifications not showing (Linux)

Make sure you have a notification daemon running:
```bash
# Check if notifications work
notify-send "Test" "Hello"
```

### Click-to-focus not working (Linux)

Install xdotool:
```bash
sudo apt install xdotool
```

### No sound on notifications

This depends on your system's notification settings. Check your OS notification preferences.

## License

MIT

## Author

[Xeonos](https://github.com/XeonosXYZ)
