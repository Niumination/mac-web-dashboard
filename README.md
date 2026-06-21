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

---

## Getting Started (Local macOS)

```bash
cd ~/Desktop/Niumination/projects/mac-web-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ **Important**: API routes `exec` real system commands (`sw_vers`, `ps`, `launchctl`, `df`, `brew`). These work on **local macOS** only. On Vercel or non-macOS, the API falls back to mock/simulated data.

---

## Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

The dashboard is fully deployable to Vercel. All API routes include graceful fallbacks for serverless environments.

---

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
