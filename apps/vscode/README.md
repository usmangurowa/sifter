# Kodo - Every Session Tells a Story

Track your coding journey with meaningful context, not just hours. Smart session tracking that understands your work. Privacy-first.

## Features

- **🧠 Meaningful Context** - AI-powered sessions that understand your code, not just your time
- **⏱️ Smart Session Tracking** - Automatically tracks time and recognizes flow states (20+ min continuous coding)
- **🌿 Sustainable Wellness** - Proactive break reminders and flow state protection
- **📊 Session Analytics** - View heartbeats, sessions, and productivity metrics
- **🔒 Privacy-First** - Normal or stealth mode (no file names sent). Your code content is **never** sent to our servers.
- **💾 Offline Support** - Queues data locally and syncs when connected
- **🔄 Git Commit Tracking** - Track commits for session context and AI summaries
- **📝 AI Standup Generation** - Automatically generate standups from your coding sessions

## Getting Started

### 1. Create an Account

Sign up at [kodohq.app](https://kodohq.app/create-account)

### 2. Get Your API Key

1. Go to [kodohq.app/dashboard](https://kodohq.app/dashboard)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Copy your key (starts with `kodo_`)

### 3. Set Your API Key

In VS Code/Cursor:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type **"Kodo: Set API Key"**
3. Paste your API key

## Works With Your Favorite Editors

- VS Code
- Cursor
- Antigravity
- Windsurf

## Commands

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `Kodo: Set API Key`    | Configure your API key             |
| `Kodo: Clear API Key`  | Remove your API key                |
| `Kodo: Show Status`    | View current session stats         |
| `Kodo: Toggle Privacy` | Switch between normal/stealth mode |
| `Kodo: Sync Settings`  | Sync settings from dashboard       |

## Settings

| Setting                      | Default  | Description                                                              |
| ---------------------------- | -------- | ------------------------------------------------------------------------ |
| `kodo.enabled`               | `true`   | Enable/disable tracking                                                  |
| `kodo.privacyMode`           | `normal` | `normal` or `stealth`                                                    |
| `kodo.breakReminderMinutes`  | `90`     | Break reminder interval (0 to disable)                                   |
| `kodo.sessionTimeoutMinutes` | `15`     | Session timeout in minutes. Gaps shorter than this count as coding time. |
| `kodo.enableTelemetry`       | `false`  | Enable anonymous usage analytics                                         |
| `kodo.captureSymbols`        | `false`  | Capture function/class names for richer AI session summaries             |
| `kodo.captureCommits`        | `true`   | Track Git commits for session context and AI summaries                   |

## Status Bar

The Kodo status bar shows:

- **Coding Time** - Total coding time today
- **Session** - Current session duration
- **(Active)** - You're in an active session

Click the status bar item to view detailed stats.

## Privacy

- **Normal Mode**: Tracks file names and languages
- **Stealth Mode**: Only tracks heartbeats, no file details

Your code content is **never** sent to our servers.

## Telemetry

Kodo can collect anonymous usage analytics to help us improve the extension. This is **disabled by default**.

To enable, set `kodo.enableTelemetry` to `true` in your settings.

**What we track:**

- Extension activation/deactivation
- Sync events (heartbeat counts, not content)
- Error events for debugging

**What we never track:**

- File names or paths
- Code content
- Personal information

## Support

- Website: [kodohq.app](https://kodohq.app)
