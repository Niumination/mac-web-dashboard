# macOS Pro Max Dashboard 🖥️

**Web-based system telemetry, file manager, process inspector, and launchd service manager for macOS.**

Built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Inspired by the Niumination Arch Linux Pro Max Dashboard ecosystem.

---

## Features

### 📊 System Intelligence
- Real-time CPU, memory, disk, and load average telemetry
- Homebrew package management (formulae, casks, outdated)
- macOS kernel and Darwin release info
- Live polling every 10 seconds

### 📁 File Manager
- Full directory browsing with breadcrumb navigation
- Create files and folders
- Edit files with built-in code editor
- Delete, chmod, and archive/compress files
- `/Users/zaryu` as default home directory

### 🔄 Launchd Service Manager
- List all macOS launchd services (system & user)
- Start / Stop / Restart services via `launchctl`
- Real-time service status monitoring

### ⚙️ Process Inspector
- Top resource-consuming processes with PID, CPU%, MEM%
- Search/filter by name, PID, or user
- Kill processes with SIGKILL (GUI confirmation)

### 🛡️ HexStrike Security
- 10 security tools: nmap, ping, whois, dig, nslookup, curl, traceroute, netstat, lsof, system_profiler
- Python Flask backend server with tool execution engine
- Start/stop server from the dashboard UI
- Command history with recent results viewer
- Server health monitoring with auto-polling

### 🤖 AI Workspace (12 Tabs)
- **Agent Dashboard** — Auto-detect all AI agents on the system (Hermes, Ollama, Claude Code, Codex, OpenCode, Cursor Agent, Mimo, Agent Browser) with live status
- **Hermes Console** — Chat interface with Hermes Agent gateway, status monitoring, tool browser
- **Ollama Models** — Model browser, pull/delete models, chat directly with any loaded model
- **Agent Launcher** — Launchpad for CLI agents with background process management
- **Workspace Manager** — Create/manage agent workspaces persisted to `~/.niumination/workspaces/*.json`
- **Prompt Studio** — Multi-agent prompt dispatcher (Ollama, Hermes Telegram, OpenCode/Claude/Codex CLI)
- **Sessions Browser** — Browse 59 Hermes session files from USB gateway, view message history
- **MCP Servers** — Live monitoring of 8 MCP servers (time, github, filesystem, postgres, sqlite, ponytail, notebooklm)
- **Activity Timeline** — Hourly/daily agent activity chart with response times and error tracking
- **Cron Manager** — List/create/pause/resume/delete/run Hermes cron jobs
- **Smart Router** — Keyword-based intent detection routing to appropriate agents
- **Herdr Manager** — Real-time herdr workspace monitor: 6 agents, 7 tabs, workspace layout, agent output reader, command sender

---

## Getting Started (Local macOS)

```bash
cd ~/Desktop/Niumination/projects/mac-web-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ **Important**: API routes `exec` real system commands (`sw_vers`, `ps`, `launchctl`, `df`, `brew`, `which`, `lsof`, `ollama`, `hermes`). These work on **local macOS** only. On Vercel or non-macOS, the API falls back to mock/simulated data.

---

## Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

The dashboard is fully deployable to Vercel. All API routes include graceful fallbacks for serverless environments.

---

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/system` | `GET` | OS info, CPU, memory, disk, brew pkgs |
| `/api/system/events` | `GET` (SSE) | Live CPU/memory every 3s |
| `/api/battery` | `GET` | Battery %, cycles, health |
| `/api/brew` | `GET` / `POST` (SSE) | Outdated pkgs / upgrade stream |
| `/api/files` | `GET` / `POST` | File CRUD, chmod, archive |
| `/api/processes` | `GET` / `DELETE` | ps aux / kill |
| `/api/services` | `GET` / `POST` | launchctl list / start/stop |
| `/api/hexstrike` | `GET` / `POST` | HexStrike status / start/stop/proxy |
| `/api/agents` | `GET` | **Auto-discover** all AI agents (port scan + `which`) |
| `/api/agents/hermes` | `GET` / `POST` | Hermes gateway status / proxy to port 8642 |
| `/api/agents/ollama` | `GET` / `POST` | Ollama status / proxy + pull + delete models |
| `/api/agents/launch` | `GET` / `POST` | List / run / kill CLI agent processes |
| `/api/agents/workspace` | `GET` / `POST` / `DELETE` | Workspace CRUD (JSON in `~/.niumination/workspaces/`) |
| `/api/agents/sessions` | `GET` | List 59 Hermes sessions / detail by id from USB |
| `/api/agents/mcp` | `GET` | ps aux pattern matching for 8 MCP servers + stderr log |
| `/api/agents/cron` | `GET` / `POST` | `hermes cron list` / create/pause/resume/delete/run |
| `/api/agents/activity` | `GET` | Parse gateway.log for hourly/daily stats, errors |
| `/api/agents/studio` | `POST` | Dispatch prompt to multiple agents concurrently |
| `/api/agents/herdr` | `GET` / `POST` | herdr agent list/snapshot/workspaces/sessions + agent send/read |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| UI Library | React 18 |
| Styling | Tailwind CSS 3 (UI/UX Pro Max — Glassmorphism + Swiss Style) |
| Icons | Lucide React |
| Language | TypeScript ~5.4 |
| Service Manager | launchd (macOS native) |
| Package Management | Homebrew |

---

## Part of the Niumination Ecosystem

This project is a macOS adaptation of the Arch Linux Pro Max Dashboard. Other ecosystem projects:

- **niu-dash** (v2.16.8) — Niumination ecosystem dashboard (vanilla JS, GH Pages)
- **arch-web-dashboard** — Arch Linux Pro Max Dashboard (Linux version)
- **niu-flow** — AI orchestration bridge
- **niu-lkh** — Laporan Kegiatan Harian
- **kune-ya.com** — TEDEO agency site

---

## License

MIT — Niumination / Afrizal Munthe
