# Nota

[![Website](https://img.shields.io/badge/Website-marwan--nashy.github.io%2Fnota-indigo?style=flat&logo=safari)](https://marwan-nashy.github.io/nota/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Release](https://img.shields.io/github/v/release/marwan-nashy/nota?color=emerald)](https://github.com/marwan-nashy/nota/releases)
[![Memory](https://img.shields.io/badge/RAM-%3C%2035MB-success)](https://github.com/marwan-nashy/nota)

A lightweight, zero-bloat, open-source personal workspace designed specifically to run flawlessly on low-spec "potato PCs" (low RAM, integrated Intel GPUs, dual-core CPUs) without Electron runtime overhead.

🌐 **Live Website**: [https://marwan-nashy.github.io/nota/](https://marwan-nashy.github.io/nota/)  
🚀 **Live Web App (Try in Browser)**: [https://marwan-nashy.github.io/nota/app/](https://marwan-nashy.github.io/nota/app/)


## Architectural Core Principles
1. **Zero Electron Bloat**: Avoids bundling full Chromium + Node.js runtimes. Built on **Tauri v2 (Rust backend)** + **OS Evergreen WebView2** (~30 MB idle RAM vs. official apps at 600 MB–1.2 GB).
2. **100% Local-First**: Zero cloud lag, 0ms input latency, and zero dependency on external servers or spinning sync wheels.
3. **Sub-50ms Cold Startup**: Instant launch directly from a single 4.3 MB native `.exe`.
4. **Full Feature Parity**: Block graph engine, slash commands (`/`), markdown auto-conversions, relational database tables, and Kanban boards.
5. **Multi-Workspace System**: Create, switch, rename, change icons, and manage multiple isolated workspaces.

---

## Tech Stack
- **Desktop Shell**: [Tauri v2](https://tauri.app/) (Native Rust backend)
- **UI Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Pixel-perfect light `#ffffff` / dark `#191919` aesthetic)
- **Icons**: [Lucide React](https://lucide.dev/) (Geometric SVGs with zero missing-glyph or Unicode square issues)

---

## Feature Parity & Highlights

### 1. True Block-Based Document Editor
- **Slash Menu (`/`)**: Type `/` anywhere to insert Headings (H1, H2, H3), To-do items, Bullet lists, Numbered lists, Toggles, Callouts, Quotes, Dividers, Code snippets, and Databases.
- **Markdown Auto-Conversion**:
  - `# `, `## `, `### ` $\rightarrow$ Headings
  - `[] ` or `[ ] ` $\rightarrow$ Interactive checkbox
  - `- ` or `* ` $\rightarrow$ Bullet point
  - `1. ` $\rightarrow$ Numbered list
  - `> ` $\rightarrow$ Blockquote
  - `---` $\rightarrow$ Divider
- **Block Hover Controls**:
  - `+` button to quickly insert a block below.
  - `⋮⋮` handle to open the block transformation menu (*Turn into...*, *Delete*).
- **Fluid Keyboard Navigation**: `Enter` creates blocks, `Backspace` converts or deletes empty blocks, `Arrow Up/Down` navigates seamlessly.

### 2. Inline Relational Databases (Tables & Kanban Boards)
- **Table View**: Spreadsheet layout with typed columns (`Task Name`, `Status`, `Priority`, `Checkbox`, `Due Date`), inline cell editing, and row addition.
- **Kanban Board View**: Real-time visual cards grouped by Status (*Not Started*, *In Progress*, *Completed*), with one-click status transitions.

### 3. Workspace System & Navigation
- Hierarchical sidebar with collapsible page trees and custom emoji icons.
- **Multi-Workspace Switcher**: Create new workspaces, rename them, pick custom icons, and switch contexts instantly.
- **Page Covers**: Sunset, Ocean, Violet, and Dark Slate gradient presets.
- **Typography Switcher**: Instant toggle between **Default (Inter)**, **Serif (Newsreader)**, and **Mono (JetBrains Mono)**.
- **Layout Controls**: Full-width canvas toggle and Small-text mode.

### 4. Instant Command Palette (`Ctrl + K` / `Ctrl + P`)
- Instant search across all page titles and block contents.
- Quick actions to toggle dark/light mode, create pages, and export backups.

### 5. Data Ownership & Persistence
- **100% Local-First**: Automatic debounced saving to local storage.
- **Export Page to Markdown (`.md`)**: One-click download of any page as clean markdown.
- **Export/Import Workspace (`.json`)**: Backup and restore your entire workspace anytime.
- **Trash & Archive Modal**: Restore deleted pages or permanently purge them.

---

### 6. Cross-Platform & Mobile Ready
- **Windows**: Single portable `.exe` (4.6 MB) with 0ms startup time.
- **Linux**: Native `.deb` packages and universal `.AppImage` binaries built via GitHub Actions.
- **Mobile (iOS & Android PWA)**: Installable directly to phone home screen with full offline storage and touch drawer navigation.
- **Android APK**: Automated CI/CD build workflow via Tauri v2 Android target.
- **Web App**: Client-side single-page application hosted on GitHub Pages.

---

## Development & Build Instructions

### Run in Development Mode
```bash
npm run tauri dev
```

### Build Web App & PWA
```bash
npm run build
```

### Build Windows Standalone Executable
```bash
npm run tauri build --no-bundle
```

### Build Linux Packages (.deb / .AppImage)
On Ubuntu/Debian:
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf libssl-dev libgtk-3-dev
npm run build
npx tauri build
```
*(Or let GitHub Actions compile them automatically via `.github/workflows/build-linux.yml`)*

### Build Android APK
```bash
npx tauri android init
npx tauri android build --apk
```
*(Or let GitHub Actions compile them automatically via `.github/workflows/build-android.yml`)*

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for the full text.

---

## Disclaimer

Nota is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Notion Labs, Inc. Notion is a registered trademark of Notion Labs, Inc.


