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
- **Slash Menu (`/`)**: Type `/` anywhere to insert Headings (H1, H2, H3), To-do items, Bullet lists, Numbered lists, Toggles, Callouts, Quotes, Dividers, Code snippets, KaTeX Math (`/math`), Mermaid Diagrams (`/diagram`), Table of Contents (`/toc`), Voice Memos (`/voice`), and Relational Databases.
- **Collapsible Headings (`H1`, `H2`, `H3`)**: 1-click fold/unfold chevron to collapse child sections under any heading with an inline expansion badge.
- **In-Page Find & Replace (`Ctrl + F`)**: Real-time floating search toolbar with match counter, next/previous navigation, case matching, and replace all.
- **Focus / Zen Mode (`F11`)**: Fullscreen distraction-free typing without sidebars or toolbars, plus typewriter center mode.
- **Live Word & Read-Time Counter**: Real-time word, character, and estimated reading time statistics.
- **Multi-Tab Document Strip**: Browser-style tabs across the top to keep active notes open and switch seamlessly.
- **Inline `#tags` & Tag Explorer**: Type `#tag` anywhere in your notes and browse cross-referenced topics from the sidebar.
- **Markdown Auto-Conversion**:
  - `# `, `## `, `### ` $\rightarrow$ Headings
  - `[] ` or `[ ] ` $\rightarrow$ Interactive checkbox
  - `- ` or `* ` $\rightarrow$ Bullet point
  - `1. ` $\rightarrow$ Numbered list
  - `> ` $\rightarrow$ Blockquote
  - `---` $\rightarrow$ Divider
- **Block Hover & Drag-and-Drop Controls**:
  - `+` button to quickly insert a block below.
  - `⋮⋮` 6-dot grip handle to drag and reorder blocks across the page.
- **Fluid Keyboard Navigation**: `Enter` creates blocks, `Backspace` converts or deletes empty blocks, `Arrow Up/Down` navigates seamlessly.

### 2. Inline Relational Databases (Tables & Kanban Boards)
- **Table View**: Spreadsheet layout with typed columns (`Task Name`, `Status`, `Priority`, `Checkbox`, `Due Date`), inline cell editing, and row addition.
- **Kanban Board View**: Real-time visual cards grouped by Status (*Not Started*, *In Progress*, *Completed*), with one-click status transitions.

### 3. Visual Knowledge Graph & Media Engine
- **Obsidian-Style 2D Knowledge Graph**: Interactive force-directed graph view connecting notes across your workspace with physics simulation and 1-click navigation.
- **Mermaid.js Flowcharts & Diagrams**: Built-in SVG renderer for flowcharts, sequence diagrams, state machines, and mindmaps (`/diagram`).
- **KaTeX LaTeX Math Formulas**: Clean rendering engine for mathematical equations and scientific proofs (`/math`).
- **Web Audio Voice Notes (`/voice`)**: Offline microphone recorder and audio memo player stored in local IndexedDB.
- **Local Image Paste (`Ctrl+V`) & Drag-and-Drop**: Paste screenshots directly from your clipboard or drag image files onto the page. Stored 100% offline in browser IndexedDB.

### 4. Privacy, Security & Data Ownership
- **Encrypted Vault (AES-GCM-256)**: Password-protect confidential pages with client-side 256-bit cryptography and zero cloud exposure.
- **Local Revision History & Auto-Snapshots**: Time-machine rollback checkpoints with word deltas and 1-click restore.
- **Obsidian, Markdown & Notion Importer**: Drag-and-drop `.md` folders or Notion export files directly into your workspace.
- **Direct P2P & QR Transfer**: Wirelessly migrate your encrypted workspace between PC and mobile phone with zero servers.
- **100% Local-First**: Automatic debounced saving to local storage.
- **Export Page to Markdown (`.md`) / HTML**: One-click download of any page as clean markdown or formatted HTML.
- **Export/Import Workspace (`.json`)**: Backup and restore your entire workspace anytime.

### 5. Bilingual English & Arabic (RTL) Support
- **1-Click Language Switcher**: Seamless toggle between English and Arabic.
- **Full RTL Layout Inversion**: Automatic bidirectional per-block text flow (`dir="auto"`) and crisp Cairo typography.
- **Arabic Starter Templates**: Pre-configured Arabic meeting notes, journals, and task boards.

### 6. Customization & Themes
- **Hide & Customize Features**: Toggle off any modules you don't use (Graph, Math, Diagrams, Databases, Vault, Daily Notes, Backlinks, TOC, Templates) in Settings.
- **In-App Update Checker**: Verify and download new official releases directly from GitHub on demand.
- **6 Handcrafted Themes**: OLED Pure Black (#000000), Catppuccin Mocha, Nord Arctic, Warm Sepia, Classic Light, and Modern Dark.

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


