# Batched - Claude Code Instructions

## Project Overview
Batched is a macOS recipe manager built with Electron, Svelte 5, and better-sqlite3. It allows users to manage recipes, generate shopping lists, and export to Apple Reminders.

## Tech Stack
- **Electron 39** with Electron Forge v7
- **Svelte 5** (using runes: `$state`, `$props`, `$derived`)
- **Vite** for bundling
- **better-sqlite3** for local database
- **TypeScript** throughout

## Building & Signing

### Build Command
```bash
npm run make
```

### Code Signing (macOS)
The app uses **ad-hoc signing** (no Apple Developer certificate). This is handled automatically by the `postPackage` hook in `forge.config.ts`:

1. `scripts/signApp.cjs` strips all existing signatures
2. Re-signs with `--deep` and entitlements from `scripts/entitlements.mac.plist`
3. Entitlements include `com.apple.security.cs.disable-library-validation` which is required for the app to open when downloaded from the internet

**Important**: Without proper signing, downloaded apps show "damaged and can't be opened" on macOS.

## Auto-Update System

### How It Works
- Updates are hosted on GitHub Releases: `ohjey/batched-app`
- `src/main/updater.ts` checks the GitHub API for new releases
- Users trigger updates via **Batched menu > Check for Updates...**
- The app downloads the zip, extracts it, replaces itself, and restarts

### Creating a New Release

**IMPORTANT: Always bump the version before building a release!**

```bash
# 1. Bump version (updates package.json)
npm version patch   # or minor/major

# 2. Build the app
npm run make

# 3. Upload to GitHub
gh release create v1.0.X --title "v1.0.X" --notes "Release notes here" \
  out/make/zip/darwin/arm64/Batched-darwin-arm64-1.0.X.zip
```

The version number displays in the sidebar (bottom left) so users know what version they're running.

## Project Structure
```
src/
├── main.ts              # Electron main process entry
├── preload.ts           # IPC bridge to renderer
├── main/
│   ├── database.ts      # SQLite database operations
│   ├── ipc-handlers.ts  # IPC handler registration
│   ├── updater.ts       # GitHub-based update checker
│   ├── consolidator.ts  # Shopping list consolidation
│   └── reminders.ts     # Apple Reminders export
├── renderer/
│   ├── App.svelte       # Main app component
│   └── lib/components/  # Svelte components
├── shared/
│   ├── ipc-channels.ts  # IPC channel constants
│   └── types.ts         # Shared TypeScript types
scripts/
├── signApp.cjs          # macOS code signing script
└── entitlements.mac.plist
```

## Native Modules
The app uses `better-sqlite3` which requires native compilation. The `vite-plugin-native` package in `vite.main.config.ts` handles bundling native modules correctly.
