# OpenCode V2 Windows Desktop — Remote-Only Baseline

## Repository Information
- **Fork:** https://github.com/AshitakaLax/opencode
- **Branch:** dev
- **Commit SHA:** e965774fa0e2a8ffb27bf02827a2c3c6a8c0f45b
- **Upstream Remote:** https://github.com/anomalyco/opencode.git
- **Package Version:** 2.1.3

## Desktop Framework
- **Framework:** Electron
- **Main Process Entry:** `packages/desktop/src/main/index.ts`
- **Renderer Entry:** `packages/desktop/src/renderer/index.tsx`
- **Build Configuration:** `packages/desktop/electron-builder.config.ts`

## Windows Build Configuration
- **Build Tool:** electron-builder
- **Target:** NSIS installer
- **Artifact Pattern:** `opencode-desktop-${os}-${arch}.${ext}`
- **Windows Specific:** 
  - Icon: `resources/icons/icon.ico`
  - Installer script: `resources/windows/installer.nsh`
  - Signing script: `script/sign-windows.ps1` (only in GitHub Actions)

## CLI Bundling
The desktop application bundles platform-specific CLI binaries:
- Windows x64: `@opencode/cli-windows-x64-baseline`
- Windows ARM64: `@opencode/cli-windows-arm64`

These are included as extraResources in the electron-builder configuration.

## Key Files Identified
1. **Main Process:**
   - `packages/desktop/src/main/index.ts` - Application entrypoint
   - `packages/desktop/src/main/service/background-service.ts` - Creates local server (sidecar) via BackgroundService.connect()
   - `packages/desktop/src/main/service/desktop-cli.ts` - Resolves and installs CLI
   - `packages/desktop/src/main/service/sidecar-probe.ts` - Checks for existing service
   - `packages/desktop/src/main/ipc-handlers/app.ts` - Handles AppAwaitInitialization/AppReconnectService IPC calls
   - `packages/desktop/src/main/service/sidecar-credentials.ts` - Manages sidecar credentials
   - `packages/desktop/src/main/lifecycle/index.ts` - ApplicationLifecycle layer that creates windows
   - `packages/desktop/src/main/windows/index.ts` - Window creation and management functions

2. **Renderer Process:**
   - `packages/desktop/src/renderer/desktop-app.tsx` - Main application component
   - `packages/desktop/src/renderer/startup/initialization.ts` - Handles sidecar initialization
   - `packages/desktop/src/renderer/api.ts` - Electron API bridge

3. **Build Scripts:**
   - `packages/desktop/electron-builder.config.ts` - Electron builder configuration
   - `packages/desktop/scripts/utils.ts` - CLI binary definitions

## Startup Trace (Executable to Server Connection)
1. **Entrypoint:** `packages/desktop/src/main/index.ts`
   - Calls `configureApplication()` to set up environment
   - Acquires application lock
   - Sets up renderer scheme
   - Waits for `app.whenReady()`

2. **When Ready:** Imports and runs `packages/desktop/src/main/desktop.ts`
   - Sets up Effect layers including:
     - `BackgroundService.layer` - Manages local server lifecycle
     - `ApplicationLifecycle.layer` - Creates and manages windows
     - Other layers (IPC, CLI, initialization, etc.)

3. **Window Creation:** ApplicationLifecycle.layer
   - Calls `makeMainWindows()` from `packages/desktop/src/main/windows/index.ts`
   - On restore, uses `takeEarlyWindow()` to get window created before layers loaded
   - Otherwise creates new windows via `create()` function

4. **Server Initialization:** BackgroundService.layer
   - Initializes BackgroundServiceState
   - Makes initial connection via `connect("initial")` 
   - This spawns the local OpenCode server by:
     - Resolving the CLI bundler (`desktop-cli.resolve`)
     - Calling `@opencode/client/service`.Service.ensure() 
     - Which spawns the CLI with `serve` command

5. **Renderer Connection:** `packages/desktop/src/renderer/desktop-app.tsx`
   - Waits for initialization via `props.api.awaitInitialization()`
   - This connects to BackgroundService.connection stream
   - Gets sidecar data and creates local server connection object
   - Also checks for remote server extensions

## Pairing, Credentials, and Remote Health Checks (Task 0.6)
- **Pairing link parsing:** `packages/app/src/servers/connect/pairing.ts` exports `pairingLink(value)` which parses both link-form (`http://host:port/auth/connect/CODE`) and JSON-form (`{"code":"...","urls":[...]}`) pairing links. Validates code format (`^[A-Za-z0-9_-]+$`) and server addresses.
- **Pairing link redemption:** `redeemPairingLink(link)` calls `OpenCode.make({ baseUrl }).server.connect({ code })` for each URL, preferring the first address when it answers. Returns `{ type: "paired", pairing: { url, password } }`, `{ type: "expired" }`, or `{ type: "unreachable" }`.
- **Legacy pairing links:** `legacyPairingLink(value)` checks for `/connect` with hash or data params.
- **Credential storage:** `packages/desktop/src/main/service/sidecar-credentials.ts` manages credentials in memory only. `set(data)` stores `{ url, password }`, `ready(data)` returns `{ url }` to renderer (strips password). `authorization(sidecar, url)` returns `Basic` auth header only for matching sidecar origin.
- **Server persistence:** `packages/app/src/runtime/server/persistence.ts` defines `ServerHttp` schema (url, password, displayName) persisted via `Persistence.struct` and `Persist.global("server")`.
- **Reconnect behavior:** `createSidecarResolver()` in `packages/desktop/src/renderer/startup/initialization.ts` handles reconnect by calling `reconnectService()` and updating the connection if URL changes.
- **Remote health checks:** `packages/app/src/runtime/server/health.ts` exports `checkServerHealth(server, fetch, opts)` which calls `/api/info` and `/api/session?limit=1` to verify server reachability and authentication. Cached for 750ms.

## Telemetry, Analytics, Crash, Update, and Diagnostic Endpoints (Task 0.7)
- **Sentry (crash reporting):**
  - `packages/desktop/src/renderer/startup/sentry.ts` - Initializes Sentry in renderer if `VITE_SENTY_DSN` is set. Filters out Breadcrumbs, GlobalHandlers, and BrowserApiErrors integrations for prod channel.
  - `packages/desktop/electron.vite.config.ts` lines 18-24 - Sentry vite plugin with `telemetry: false` option (Sentry's own telemetry disabled).
  - `packages/app/src/shell/errors/error.tsx` line 285 - Lazy imports @sentry/solid for exception capture.
- **Electron Crash Reporter:** `packages/desktop/src/main/native/logging.ts` lines 123-133 - `crashReporter.start({ uploadToServer: false, compress: true })` - crash reports stored locally, NOT uploaded.
- **Network Logging (netLog):** Lines 135-143 - `netLog.start({ path })` captures network activity to local file only.
- **Automatic Updates:**
  - `packages/desktop/electron-builder.config.ts` lines 243-263 - Publish URLs: prod `https://opencode.ai/update/api/latest/desktop/opencode/`, beta `https://opencode.ai/update/api/beta/desktop/opencode/`
  - No auto-update code in main process; electron-builder/electron-updater handles via config.
  - `packages/gui-extensions/src/updater/` - Extension for update checking (main + renderer)
- **electron-log:** `packages/desktop/src/main/native/logging.ts` line 3 - Uses `electron-log/main.js` for console.log/stdout/stderr capture (local only).
- **Debug log export:** Lines 145-186 - `exportDebug` exports logs on user request via IPC (`AppExportDebugLogs`), includes netLog + crash dumps.

## Desktop Feature Classification (Task 0.8)
Built-in extensions (`packages/gui-extensions/src/main.ts`):
1. **context** - Runtime context (server, sessions, extensions). Safe (reads from server state).
2. **btw** - Built-in terminal/window. Server-backed (uses CLI commands).
3. **debug** - Debug tools (web view, dev tools toggle, network inspection). Safe client-side UI.
4. **terminal** - Terminal extension. Server-backed (uses shell via server API).
5. **file** - File browser. Server-backed (file API calls through server).
6. **review** - Code review (inline comments, diffs). Server-backed.
7. **details** - Details panel. Server-backed.
8. **browser** - Browser panel (internal links, web search). Safe client-side UI (renders external content).
9. **pairing** - Pairing link UI and remote access settings. **Server-backed** (pairing extension's `main.ts` uses CLI commands: `opencode service get remote`, `opencode service set remote <enabled>`, `opencode service start`).
10. **updater** - Update checking via `@opencode/gui-extensions/updater`. Network access to update servers (not telemetry, but update check).
11. **ssh** - SSH server connections. Server-backed (connection logic).
12. **wsl** - WSL server connections. Server-backed.
13. **microsoft-office** - Microsoft Office integration. Server-backed.

**Client-side native features:**
- File picker dialogs (`packages/desktop/src/main/files/index.ts` - uses Electron dialog API, not server-dependent)
- Notifications (Electron notification API, not server-dependent)
- Native menu management
- Context menus
- Window management

## Windows Build Process (Task 0.9)
- **CI Workflow:** `.github/workflows/publish.yml` - `build-electron` job
- **Matrix targets:** macOS (x86_64-apple-darwin, aarch64-apple-darwin), Windows (x86_64-pc-windows-msvc, aarch64-pc-windows-msvc)
- **Windows build host:** `blacksmith-4vcpu-windows-2025`
- **Build steps:**
  1. Checkout repository
  2. Download CLI artifact (from `build-cli` job)
  3. Run `bun ./scripts/prepare.ts` (working-directory: packages/desktop)
  4. Run `bun run build` (working-directory: packages/desktop)
  5. Package with electron-builder
- **Environment variables passed to build:**
  - `OPENCODE_VERSION`, `OPENCODE_CHANNEL`, `OPENCODE_CLI_TARGET`, `OPENCODE_CLI_DIST`
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_RELEASE`, `VITE_SENTRY_DSN`
- **Existing Windows tests:**
  - `packages/desktop/electron-builder.config.test.ts` - Tests packaging config for all channels
  - `packages/desktop/scripts/windows-installer.test.ts` - Tests installer (Windows ONLY, skipped on other platforms)

## Baseline Test Coverage (Task 0.10)
**Created:**
- `packages/desktop/src/main/desktop-policy.ts` - Defines `isRemoteOnly` flag (build-time + runtime env var)
- `packages/desktop/src/main/desktop-policy.test.ts` - Baseline tests for the policy flag

**Existing tests that cover remote-only behaviors:**
| Behavior | Test File | Status |
|---|---|---|
| Pairing link parsing | `packages/app/src/servers/connect/pairing.test.ts` | Exists, passes |
| Server health checks | `packages/app/src/runtime/server/health.test.ts` | Exists, passes |
| Sidecar credentials | `packages/desktop/src/main/service/sidecar-credentials.test.ts` | Exists, passes |
| Connection state persistence | `packages/desktop/src/main/service/background-service-state.test.ts` | Exists, passes |
| Initialization data handling | `packages/desktop/src/renderer/startup/initialization.test.ts` | Exists, passes |
| Settings store persistence | `packages/desktop/src/main/storage/store.test.ts` | Exists, passes |
| Windows installer behavior | `packages/desktop/scripts/windows-installer.test.ts` | Exists, Windows-only |

## No Config File Dependency (Task 0.4/Phase 4 finding)
- The desktop app stores settings in `opencode.settings` (JSON file per tab-indented format) via `createSettingsStore()` in `packages/desktop/src/main/storage/store.ts`
- The app does NOT read `opencode.json` — only the CLI binary reads that file
- For remote-only mode, the CLI binary is not spawned, so `opencode.json` is never read
- Desktop-specific config: `packages/desktop/src/main/lifecycle/configure.ts` sets XDG paths, app metadata, protocol registration

## Initial Observations
- The application starts a local OpenCode server (sidecar) by spawning the bundled CLI with `serve` command in `BackgroundService.connect()` (packages/desktop/src/main/service/background-service.ts)
- The renderer expects either a sidecar connection (local server) or remote server connections via extensions
- Pairing functionality is handled in two layers: pairing links parsed in `packages/app/src/servers/connect/pairing.ts`, and remote access CLI commands in `packages/gui-extensions/src/pairing/main.ts`
- The application stores connection information and can restore previous connections via BackgroundServiceState
- For remote-only mode: prevent BackgroundService from spawning local server, bypass sidecar probe, use pairing flow for remote server connection, persist remote server connections, disable telemetry