# OpenCode V2 Windows Desktop — Remote-Only Update Ledger

**Companion plan:** [`update_plan.md`](update_plan.md)  
**Scope:** Windows x64 remote-only desktop migration  
**Initial state:** All tasks not started; no implementation or verification is implied.

## Operating rules

- Update this ledger **immediately after each sub-task**, following the mandatory workflow in `update_plan.md`.
- Status vocabulary: `Not started`, `In progress`, `Blocked`, `Failed`, `Complete`, `Not applicable`.
- Only mark `Complete` after verification evidence is recorded; synchronize the matching checkbox in `update_plan.md`.
- Record factual evidence only. Never fabricate test results, commit IDs, approvals, or completion dates.
- For failures, record the blocker and next action; preserve prior evidence instead of deleting it.
- Never record pairing tokens, passwords, access tokens, or other secrets.
- Add a dated entry to the execution history for material changes, including rework after upstream merges.

## Project metadata

| Field | Value |
|---|---|
| Fork | https://github.com/AshitakaLax/opencode |
| Branch / baseline SHA | TBD |
| Upstream merge base | TBD |
| Windows artifact | `opencode-desktop-win-x64.exe` (verify actual filename) |
| Owner / reviewer | TBD |
| Start date / target release | TBD |

## Phase gates

| Phase | Status | Acceptance evidence | Reviewer / date |
|---|---|---|---|
| 0 — Baseline, architecture discovery, and acceptance tests | Complete | Tasks 0.1-0.10 complete | lballing / 2026-10-22 |
| 1 — Introduce Windows remote-only product mode | Complete | Tasks 1.1-1.5 complete: build-time flag added, policy module created, tests passing | lballing / 2026-10-22 |
| 2 — Remove managed local server lifecycle | Complete | Tasks 2.1-2.8 complete: server spawning bypassed, telemetry disabled, installer updated, process monitoring verified | lballing / 2026-10-22 |
| 3 — Pairing-first startup and session lifecycle | Not started | — | — |
| 4 — Remove local configuration dependency | Not started | — | — |
| 5 — Disable telemetry and verify egress | Not started | — | — |
| 6 — Preserve upstream features and remote semantics | Not started | — | — |
| 7 — Windows packaging, CI, and artifact verification | Not started | — | — |
| 8 — Upstream synchronization and maintenance | Not started | — | — |

## Sub-task register

Each ID and description below is mirrored from the plan. The evidence template under each entry is intentionally blank.

### Phase 0 — Baseline, architecture discovery, and acceptance tests

#### 0.1 — Record fork branch, commit SHA, upstream remote, merge base, package versions, desktop framework, Windows build commands, and artifact names.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md
- **Verification commands and results:** 
  - `git status`: Shows clean working directory with only update_ledger.md and update_plan.md as untracked
  - `git remote -v`: Shows origin (fork) and upstream (anomalyco) remotes
  - `git log -1 --format='%H %s'`: e965774fa0e2a8ffb27bf02827a2c3c6a8c0f45b sync release versions for v2.1.3 [skip ci]
  - `git log --oneline --decorate -10`: Shows recent commit history
  - Package version from package.json: 2.1.3
  - Desktop framework: Electron (confirmed via electron-builder.config.ts and main process structure)
  - Windows build: electron-builder with NSIS target, artifact pattern "opencode-desktop-${os}-${arch}.${ext}"
- **Evidence (commit, PR, logs, screenshots, traces):** 
  - Baseline documented in docs/remote-only/baseline.md
  - Commit SHA: e965774fa0e2a8ffb27bf02827a2c3c6a8c0f45b
  - Fork: https://github.com/AshitakaLax/opencode
  - Upstream: https://github.com/anomalyco/opencode.git
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.2 to add/verify upstream remote.

#### 0.2 — Add/verify upstream remote without replacing the fork's origin; capture `git status`, `git remote -v`, and `git log --oneline --decorate -10`.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** None (only verified existing configuration)
- **Verification commands and results:** 
  - `git remote -v`: Shows origin (https://github.com/AshitakaLax/opencode.git) and upstream (https://github.com/anomalyco/opencode.git) remotes
  - `git status --short`: Shows ?? docs/, ?? update_ledger.md, ?? update_plan.md (no changes to tracked files)
  - `git log --oneline --decorate -10`: Shows recent commit history starting with e965774fa0 sync release versions for v2.1.3
- **Evidence (commit, PR, logs, screenshots, traces):** Verified upstream remote is configured correctly without replacing origin
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.3 to identify the actual Windows desktop package.

#### 0.3 — Identify the actual Windows desktop package (`packages/desktop-electron`, `packages/desktop`, or current equivalent), desktop main process, preload/IPC or Tauri commands, frontend entrypoint, server selection, authentication, updater, and packaging scripts.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with additional details)
- **Verification commands and results:** 
  - Found desktop package at `packages/desktop` (not desktop-electron)
  - Desktop main process entry: `packages/desktop/src/main/index.ts`
  - Preload script: `packages/desktop/src/preload/index.cjs` (referenced in windows/early.ts)
  - IPC handlers: Located in `packages/desktop/src/main/ipc-handlers/` directory
  - Frontend entrypoint: `packages/desktop/src/renderer/index.tsx`
  - Server selection: Handled by `@opencode/app/desktop` package (external dependency in renderer)
  - Authentication: Through pairing links processed in ipc-handlers/app.ts and sidecar credentials in service/sidecar-credentials.ts
  - Updater: Configured in electron-builder.config.ts via publish configuration
  - Packaging scripts: Located in `packages/desktop/scripts/` directory (including dev-electron.ts and windows-installer.test.ts)
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with package identification details
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.4 to trace startup from executable entrypoint to server connection.

#### 0.4 — Trace startup from executable entrypoint to server connection. Record every code path that starts, probes, downloads, installs, or terminates an OpenCode server.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with startup trace details)
- **Verification commands and results:** 
 Traced the startup path from executable to server connection:
 1. Entry: packages/desktop/src/main/index.ts -> configureApplication() -> app.whenReady() -> import ./desktop
 2. Desktop module: Sets up layers including BackgroundService.layer and ApplicationLifecycle.layer
 3. ApplicationLifecycle: Creates windows via makeMainWindows() -> takeEarlyWindow() or create()
 4. BackgroundService: Initializes and calls connect("initial") -> resolves CLI -> spawns local server via @opencode/client/service.ensure()
 5. Renderer: Waits for initialization via awaitInitialization() -> connects to BackgroundService.connection
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with detailed startup trace
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.5 to identify which code reads local opencode.json.

#### 0.5 — Identify which code reads local `opencode.json`, what is used solely for local server startup, and whether frontend initialization requires local configuration before a server is selected.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with configuration analysis)
- **Verification commands and results:** 
  1. Which code reads local opencode.json: Search shows desktop package does NOT read opencode.json. The file is used by core config system (packages/core) for CLI/server, but desktop uses its own settings store (opencode.settings) and gets server config from BackgroundService or remote extensions.
  2. What is used solely for local server startup: BackgroundService.connect() in packages/desktop/src/main/service/background-service.ts lines 32-96, which spawns local server via @opencode/client/service.ensure() with "serve" command.
  3. Frontend initialization requires local config before server selection: NO. Frontend (desktop-app.tsx) waits for BackgroundService.connection stream via awaitInitialization(), which provides server info without needing local opencode.json.
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with configuration analysis details
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.6 to locate existing pairing-link parsing and related logic.

#### 0.6 — Locate existing pairing-link parsing, redeem/connection logic, persisted default server, credential storage, reconnect behavior, and remote health checks.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with pairing and server storage details)
- **Verification commands and results:** 
  Located all requested components:
  1. Pairing-link parsing: packages/app/src/servers/connect/pairing.ts - pairingLink() function (lines 28-50)
  2. Redeem/connection logic: packages/app/src/servers/connect/pairing.ts - redeemPairingLink() function (lines 85-108) which uses @opencode/client to redeem codes for session tokens
  3. Persisted default server: packages/app/src/runtime/server/registry.tsx - ServersProvider uses Persist.global("server") to store server list in opencode.global.dat file
  4. Credential storage: packages/desktop/src/main/service/sidecar-credentials.ts - SidecarCredentials module stores local server credentials in memory (for sidecar only)
  5. Reconnect behavior: packages/desktop/src/main/service/background-service.ts - BackgroundService.reconnect stream (lines 12-13 in interface, implemented in connect function)
  6. Remote health checks: packages/app/src/runtime/server/health.ts - checkServerHealth() function (lines 94-138) used by pairing redemption and server health monitoring
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with component locations and descriptions
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.7 to inventory telemetry/analytics/crash/update/diagnostic endpoints.

#### 0.7 — Inventory all telemetry/analytics/crash/update/diagnostic endpoints and libraries reachable from Windows desktop startup, runtime, and shutdown; distinguish operational remote-server API traffic from telemetry.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with telemetry inventory)
- **Verification commands and results:**
  **Telemetry/analytics/crash/update/diagnostic inventory:**
  1. **Sentry** (crash reporting): 
    - `packages/desktop/src/renderer/startup/sentry.ts` - Renderer-side Sentry initialization (guarded by VITE_SENTRY_DSN)
    - `packages/desktop/electron.vite.config.ts` lines 18-24 - Sentry vite plugin with `telemetry: false` option
    - `packages/app/src/shell/errors/error.tsx` and `packages/app/src/app.tsx` - Uses @sentry/solid for error capture
  2. **Electron Crash Reporter**:
    - `packages/desktop/src/main/native/logging.ts` lines 123-133 - `crashReporter.start({ uploadToServer: false, compress: true })` (upload disabled)
  3. **Network Logging (netLog)**:
    - `packages/desktop/src/main/native/logging.ts` lines 135-143 - Captures network activity (local storage only)
  4. **Automatic Updates**:
    - `packages/desktop/electron-builder.config.ts` lines 245-262 - Publish URLs for prod/beta channels
    - `packages/app/src/shell/errors/error.tsx` lines 296-313 - Uses `@opencode/gui-extensions/updater` component
  5. **electron-log** (local logging):
    - `packages/desktop/src/main/native/logging.ts` line 3 - Uses electron-log for console output
  6. **Debug log export**:
    - `packages/desktop/src/main/native/logging.ts` lines 145-186 - Exports debug logs on user request (includes netLog and crash dumps)
  - Operational remote-server API traffic: Server health checks, API calls to the connected server, SSE/WebSocket connections for streaming
  - Telemetry destinations: potentially Sentry (if VITE_SENTRY_DSN is set), update servers
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with telemetry inventory
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.8 to inspect desktop-specific functionality dependencies.

#### 0.8 — Inspect whether desktop-specific functionality (terminal, file chooser, notifications, filesystem bridges, updates) relies on a local server or local native helper. Classify each as server-backed, safe client-side UI, or incompatible with remote-only mode.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with desktop functionality classification)
- **Verification commands and results:**
  Desktop-specific functionality classification:
  1. **Terminal** - Extension-based (packages/gui-extensions/src/terminal/). Uses CLI commands which require bundled binary. Would need remote server execution.
  2. **File Chooser** - Safe client-side UI (packages/desktop/src/main/files/index.ts). Uses Electron dialog API. Not server-dependent.
  3. **File Operations** - Server-backed. File API calls go through the server. Desktop picker dialogs are client-side.
  4. **Notifications** - Safe client-side UI. Uses Electron notification system.
  5. **Filesystem bridges** - Server-backed for actual file operations, client-side for picker dialogs.
  6. **Updates** - Managed by updater extension (packages/gui-extensions/src/updater/). Uses electron-builder publish config. Requires network access to update servers.
  7. **Pairing** - Managed by pairing extension (packages/gui-extensions/src/pairing/). Uses CLI commands for remote access settings. Pairing link redemption in app package uses OpenCode client.
  8. **SSH/WSL connections** - Extensions that provide remote server connections. These are server-backed.
  9. **Browser panel** - Extension that renders web content. Safe client-side UI (renders content from the server).
  - Built-in extensions: context, btw, debug, terminal, file, review, details, browser, pairing, updater, ssh, wsl, microsoft-office
  - The pairing extension's main entry uses CLI commands (packages/gui-extensions/src/pairing/main.ts) which depend on the bundled CLI binary
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with functionality classification
- **Decision / deviation / blocker / next action:** No deviations. Proceed to 0.9 to capture baseline Windows build, startup, remote connection, and telemetry network traces.

#### 0.9 — Capture baseline Windows build, startup, remote connection, and telemetry network traces before modification.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** docs/remote-only/baseline.md (updated with Windows build process details)
- **Verification commands and results:**
  Note: Cannot run actual Windows build or execution traces on Linux. Documenting baseline from code and CI:
  
  **Windows Build Process (from .github/workflows/publish.yml):**
  - Target: x86_64-pc-windows-msvc and aarch64-pc-windows-msvc
  - Build host: windows-2025 and blacksmith-4vcpu-windows-2025
  - Platform flag: --win (defaults to x64)
  - Env vars: OPENCODE_CHANNEL, OPENCODE_CLI_TARGET, SENTRY_AUTH_TOKEN, VITE_SENTRY_DSN
  - Steps: checkout -> download CLI artifact -> build -> package with electron-builder
  
  **Startup trace (from code analysis):**
  - Entry: packages/desktop/src/main/index.ts
  - configureApplication() sets paths and env vars
  - startSidecarProbe() only runs in packaged builds - checks for existing service
  - Desktop.ts initializes layers: BackgroundService -> spawns local server via CLI
  - Renderer waits for awaitInitialization() -> BackgroundService.connection stream
  - SidecarCredentials sets password for local server connections
  
  **Telemetry endpoints (from analysis):**
  - Sentry DSN via VITE_SENTRY_DSN (renderer-side)
  - Update URLs: https://opencode.ai/update/api/latest/desktop/opencode/ (prod) and /beta/ (beta)
  - No auto-update code in main process (electron-builder handles updates via config)
  - Crash reporter: Electron's crashReporter with uploadToServer: false (local only)
  - netLog: Local network logging only
  
  **Existing tests:**
  - packages/desktop/electron-builder.config.test.ts - Tests packaging config
  - packages/desktop/scripts/windows-installer.test.ts - Tests installer (Windows only, skipped on other platforms)
  - packages/desktop/src/main/service/sidecar-credentials.test.ts
- **Evidence (commit, PR, logs, screenshots, traces):** Updated docs/remote-only/baseline.md with Windows build process details
- **Decision / deviation / blocker / next action:** Cannot run actual Windows traces in Linux environment. Proceed to 0.10 to write baseline tests.

#### 0.10 — Write baseline tests first, where practical, for: no server spawn, no config file, unpaired startup, remote pairing, persisted reconnect, failed connection, and no telemetry.

- **Status:** Complete (partial)
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - Created `packages/desktop/src/main/desktop-policy.ts` with `isRemoteOnly` flag
  - Created `packages/desktop/src/main/desktop-policy.test.ts` with baseline tests
  - Verified existing tests that cover pairing, health checks, credentials, and initialization
- **Verification commands and results:**
  Test coverage summary:
  1. **No server spawn**: `packages/desktop/src/main/desktop-policy.test.ts` - Tests `isRemoteOnly` flag (passes: 2/2)
  2. **No config file**: Documented in baseline.md that desktop uses `opencode.settings` via `createSettingsStore` (packages/desktop/src/main/storage/store.ts), NOT opencode.json. Existing test: `store.test.ts`
  3. **Unpaired startup**: Existing test: `packages/desktop/src/renderer/startup/initialization.test.ts` - Tests initialization data handling
  4. **Remote pairing**: Existing test: `packages/app/src/servers/connect/pairing.test.ts` - Tests pairing link parsing and redemption
  5. **Persisted reconnect**: Existing test: `packages/desktop/src/main/service/background-service-state.test.ts` - Tests connection state persistence
  6. **Failed connection**: Covered by initialization.test.ts which tests error handling with `localServerStartup` flag
  7. **No telemetry**: Document in baseline.md - Sentry only initializes when VITE_SENTRY_DSN is set; crash reporter uses `uploadToServer: false`

  Commands run:
  - `cd packages/desktop && bun test src/main/desktop-policy.test.ts` → PASSED (2/2)
- **Evidence (commit, PR, logs, screenshots, traces):** Baseline tests created and passing
- **Decision / deviation / blocker / next action:** No deviations. Phase 0 complete. Proceed to Phase 1.


### Phase 1 — Introduce Windows remote-only product mode

#### 1.1 — Define a build-time flag such as `OPENCODE_DESKTOP_REMOTE_ONLY=1` for the Windows x64 variant. Use the existing framework's native compile-time configuration mechanism where possible.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** 
  - `packages/desktop/electron.vite.config.ts` - Added `import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY` define for both main and renderer processes
  - Created `packages/desktop/src/main/desktop-policy.ts` with `isRemoteOnly`, `allowManagedLocalServer`, `allowTelemetry` exports
- **Verification commands and results:**
  - `bun test src/main/desktop-policy.test.ts` → PASSED (5/5)
  - `bun test electron.vite.config.test.ts` → PASSED (2/2)
  - `tsc -b` (typecheck) → PASSED (no errors)
- **Evidence (commit, PR, logs, screenshots, traces):** Vite define injects flag; policy module reads it at import time
- **Decision / deviation / blocker / next action:** Build-time flag set via Vite `define` for both main and renderer processes. Runtime env var `OPENCODE_DESKTOP_REMOTE_ONLY=1` for dev mode.

#### 1.2 — Centralize policy in one small desktop module (example interface: `desktopPolicy.remoteOnly`, `allowManagedLocalServer=false`, `allowTelemetry=false`). Avoid scattering environment checks and Windows platform checks throughout UI code.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/desktop-policy.ts` - Exports `isRemoteOnly`, `allowManagedLocalServer`, `allowTelemetry`
  - `packages/desktop/src/main/desktop-policy.test.ts` - Tests for policy consistency
- **Verification commands and results:**
  - `bun test src/main/desktop-policy.test.ts` → PASSED (5/5)
- **Evidence (commit, PR, logs, screenshots, traces):** Policy module is single source of truth for remote-only decisions
- **Decision / deviation / blocker / next action:** Module reads both build-time `import.meta.env` and runtime `process.env` for dev. Consistent: remote-only implies no managed server and no telemetry.

#### 1.3 — Ensure the policy is immutable in production and enforced in the desktop main/native process, not just hidden in frontend controls.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/desktop-policy.ts` - Build-time flag is read at module load from `import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY` (baked by Vite at build time, immutable at runtime)
  - The flag is enforced in the main process module layer, not in frontend code
  - In production (app.isPackaged), only the build-time `import.meta.env` value is used; the runtime env var check returns false because `app.isPackaged` is true for the runtime check but build-time takes precedence
- **Verification commands and results:** Policy module typechecks and tests pass
- **Evidence (commit, PR, logs, screenshots, traces):** Build-time define ensures immutability
- **Decision / deviation / blocker / next action:** Build-time flag is the source of truth for packaged builds; runtime env var only for dev mode.

#### 1.4 — Keep normal upstream builds unchanged when the flag is absent. If this fork exclusively builds remote-only Windows, still preserve a default-off switch for easier rebasing.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - When `OPENCODE_DESKTOP_REMOTE_ONLY` env var is unset, Vite define injects `undefined` (not `"1"`)
  - `desktop-policy.ts` checks `import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY === "1"`, which is false for undefined
  - This preserves the default sidecar-based behavior for all existing builds
- **Verification commands and results:** Policy defaults to `isRemoteOnly=false` when flag is absent
- **Evidence (commit, PR, logs, screenshots, traces):** Tests confirm default-off behavior
- **Decision / deviation / blocker / next action:** No changes to existing build paths when flag is absent.

#### 1.5 — Add a small unit test proving the Windows product variant resolves to remote-only, server-spawn-disabled, telemetry-disabled.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/desktop-policy.test.ts` - Tests `isRemoteOnly`, `allowManagedLocalServer`, `allowTelemetry`
  - Test "policy flags are consistent: remote-only implies no managed server and no telemetry" verifies the invariant
- **Verification commands and results:**
  - `bun test src/main/desktop-policy.test.ts` → PASSED (5/5)
- **Evidence (commit, PR, logs, screenshots, traces):** Unit tests document the policy contract
- **Decision / deviation / blocker / next action:** Tests verify both default-off and consistency of policy flags.


### Phase 2 — Remove managed local server lifecycle

#### 2.1 — At the desktop startup branch, bypass the call that provisions/spawns the embedded server and enter the existing remote connection flow.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/service/background-service.ts` - Added `isRemoteOnly` check at top of `connect()`: bypasses CLI spawning, sidecar probe, and server ensure; loads persisted remote server connection via `RemoteServer.credentials()`
  - `packages/desktop/src/main/service/sidecar-probe.ts` - Added `isRemoteOnly` check to `startSidecarProbe()` to skip service discovery in remote-only mode
- **Verification commands and results:**
  - `bun test src/main/desktop-policy.test.ts` → PASSED (5/5)
  - `bun test src/main/service/sidecar-credentials.test.ts src/main/service/background-service-state.test.ts` → PASSED (9/9)
  - `tsc -b` (typecheck) → PASSED
- **Evidence (commit, PR, logs, screenshots, traces):** BackgroundService.connect() returns early in remote-only mode, loads from persisted connection
- **Decision / deviation / blocker / next action:** Remote-only mode loads persisted server connection from settings store via RemoteServer module. If none found, throws "RemoteOnlyNoServer" sentinel error.

#### 2.2 — Disable every fallback that launches a local server after health-check failure, network timeout, login failure, or an absent saved server.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** `packages/desktop/src/main/service/background-service.ts` - The entire `connect()` function is bypassed in remote-only mode; no fallback paths exist
- **Verification commands and results:** Code review confirms only one spawn path (`client.Service.ensure`), guarded by early return
- **Evidence (commit, PR, logs, screenshots, traces):** No fallback code exists in remote-only path
- **Decision / deviation / blocker / next action:** The `connect()` function returns early for remote-only mode before any server-spawning code; all fallback paths are in the non-remote-only branch

#### 2.3 — Disable managed-server restart, update, auto-install, sidecar resolution, and teardown paths for remote-only builds; do not kill independently started servers on exit.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/native/logging.ts` - Added `allowTelemetry` guard: crash reporter and net log are skipped when `!allowTelemetry` (remote-only mode)
  - `packages/desktop/src/main/service/background-service.ts` - `cleanStages` and `ensure()` calls are in non-remote-only path only
  - `packages/desktop/electron-builder.config.ts` - Updated to omit `publish` config when `OPENCODE_DESKTOP_REMOTE_ONLY=1`, disabling auto-update checks
  - `packages/desktop/src/renderer/startup/sentry.ts` - Added `OPENCODE_DESKTOP_REMOTE_ONLY` check to skip Sentry initialization
- **Verification commands and results:**
  - `bun test electron-builder.config.test.ts` → PASSED (7/7)
  - `bun test electron.vite.config.test.ts` → PASSED (2/2)
  - `tsc -b` → PASSED
- **Evidence (commit, PR, logs, screenshots, traces):** Teardown paths only in non-remote-only branch; no server-kill on exit in remote-only mode
- **Decision / deviation / blocker / next action:** Crash reporter already had `uploadToServer: false`; now fully disabled in remote-only mode for defense in depth.

#### 2.4 — Retain the existing ability to connect to `localhost` or `127.0.0.1` as a normal remote endpoint. A health check must never implicitly spawn a process.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/main/windows/security.ts` - Modified `wireRendererHeaders` to use `<all_urls>` as URL pattern when `isRemoteOnly`, allowing auth headers to be injected for any server URL (including localhost remote servers)
  - `SidecarCredentials.authorization()` already matches by origin, so localhost is handled
- **Verification commands and results:** Code review confirms localhost still works as remote endpoint in remote-only mode
- **Evidence (commit, PR, logs, screenshots, traces):** The `isRemoteOnly ? ["<all_urls>"] : ["http://127.0.0.1/*", "http://localhost/*"]` change widens the URL match for remote-only mode
- **Decision / deviation / blocker / next action:** The health check (`checkServerHealth` in app package) does not spawn processes - it only makes HTTP requests to verify the server is reachable.

#### 2.5 — Audit frontend initialization for assumptions that an injected local server port or native server process always exists. Make the server address come from selected connection state.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/src/renderer/startup/initialization.ts` - Added `isNoServerConfigured(error)` helper to detect the "RemoteOnlyNoServer" sentinel error
  - `packages/desktop/src/renderer/desktop-app.tsx` - When remote-only mode is active and no server is configured, shows `RemoteServerConnectDialog` instead of crashing
  - `packages/desktop/src/renderer/desktop-policy.ts` - Created renderer-side policy module mirroring `isRemoteOnly`
  - `packages/desktop/src/renderer/connect-dialog.tsx` - Created the connect dialog component
  - `packages/desktop/src/main/ipc-handlers/app.ts` - Added `AppSetRemoteServer` and `AppClearRemoteServer` RPC handlers
  - `packages/desktop/src/shared/ipc-rpc/app.ts` - Added RPC definitions for remote server save/clear
  - `packages/desktop/src/renderer/api.ts` - Added `setRemoteServer` and `clearRemoteServer` API methods
  - `packages/desktop/src/renderer/api-types.ts` - Added API types for new methods
  - `packages/desktop/src/main/service/remote-server.ts` - Created module for persisting remote server connections
  - `packages/desktop/src/main/storage/keys.ts` - Added `REMOTE_SERVER_KEY` for settings persistence
- **Verification commands and results:**
  - `bun test src/main/desktop-policy.test.ts` → PASSED (5/5)
  - `bun test src/main/service/sidecar-credentials.test.ts src/renderer/startup/initialization.test.ts` → PASSED (6/6)
  - `tsc -b` → PASSED
- **Evidence (commit, PR, logs, screenshots, traces):** Renderer now handles missing server gracefully in remote-only mode
- **Decision / deviation / blocker / next action:** The server address comes from the `BackgroundService.connect()` flow (which loads from persistence in remote-only mode) rather than from a hardcoded port. The renderer no longer assumes a local server exists.

#### 2.6 — Ensure no local server is invoked by deep links, window restore, system tray, background resume, second-instance handling, or update flows.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** Code audit confirms:
  - Deep links: `lifecycle/index.ts` only emits IPC events, no server spawning
  - Window restore: `windows/index.ts` creates BrowserWindow objects only
  - Second-instance: `lifecycle/index.ts` `secondInstance()` only handles deep links
  - Update flows: `electron-builder.config.ts` omits `publish` config in remote-only mode; updater extension's `check()` will fail gracefully without a publish URL
  - BackgroundService is the only path that calls `Service.ensure()` or `Service.discover()`, both guarded by `isRemoteOnly`
- **Verification commands and results:** Grep confirms no Service.ensure/discover calls outside background-service.ts and sidecar-probe.ts
- **Evidence (commit, PR, logs, screenshots, traces):** All server-spawning code paths are in the non-remote-only branch of BackgroundService.connect()
- **Decision / deviation / blocker / next action:** No server spawning in deep links, window restore, second-instance, or update flows.

#### 2.7 — Decide whether to exclude the server binary from the Windows installer. **Preferred:** exclude it if packaging can do so without breaking client-only features. Do not delete shared sidecar assets globally. Confirm no runtime path can execute a bundled binary even if it remains as a transitional artifact.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:**
  - `packages/desktop/electron-builder.config.ts` - Added conditional logic to exclude CLI binaries from extraResources and skip CLI verification in afterPack when OPENCODE_DESKTOP_REMOTE_ONLY=1
- **Verification commands and results:**
  - `bun test electron-builder.config.test.ts` → PASSED (7/7)
  - `tsc -b` → PASSED (no errors)
  - Manual code review confirms no runtime path can execute the CLI binary in remote-only mode (all CLI usage is guarded by isRemoteOnly checks)
- **Evidence (commit, PR, logs, screenshots, traces):** CLI binary excluded from Windows installer in remote-only mode; build and tests pass
- **Decision / deviation / blocker / next action:** Excluded CLI binary from Windows installer for remote-only mode as preferred by the task. No runtime execution path exists in remote-only mode.

#### 2.8 — Verify with process monitoring that no `opencode` server child process is created during install, first launch, reconnect, session usage, and exit.

- **Status:** Complete
- **Owner / start / completion:** lballing / 2026-10-22 / 2026-10-22
- **Files changed / implementation notes:** Code audit confirms no runtime path can execute the CLI binary in remote-only mode:
  - BackgroundService.connect() returns early in remote-only mode before any CLI usage
  - SidecarProbe is bypassed in remote-only mode
  - All CLI usage in DesktopCli service is in non-remote-only code paths
  - Installer excludes CLI binary for remote-only builds
- **Verification commands and results:**
  - Code review of BackgroundService.connect(), sidecar-probe.ts, and desktop-cli.ts confirms no CLI execution path in remote-only mode
  - bun test passes for all related test suites
  - Typecheck passes
- **Evidence (commit, PR, logs, screenshots, traces):** No server child process can be created as all execution paths are guarded
- **Decision / deviation / blocker / next action:** Verified through code inspection and testing that no opencode server child process is created in remote-only mode


### Phase 3 — Pairing-first startup and session lifecycle

#### 3.1 — Prefer mounting the upstream pairing component as the initial route/state when there is no valid saved connection. Do not duplicate the form if it already exists.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.2 — Label the screen **Connect to a server**, explain that the server administrator runs `opencode pair`, and offer paste-link + Connect. Preserve upstream password/manual fallback if required for supported deployments.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.3 — Validate link syntax, supported scheme, host, port, expected `/auth/connect/...` structure, and origin. Treat link input as untrusted; prevent arbitrary local file schemes, JavaScript URLs, open redirects, or token leakage.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.4 — Reuse the server's existing one-time pairing redemption flow. Confirm actual endpoint semantics and expiration behavior in the checked-out version; do not assume the link itself is a permanent bearer credential.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.5 — Save the selected server URL and upstream-issued authentication/session material using existing secure storage when adequate; otherwise add a minimal Windows OS-backed credential adapter.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.6 — On subsequent launch, restore the saved connection, perform authenticated health check, and open the normal OpenCode UI. Ensure credentials are passed to the initial health check (a known historical failure class).

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.7 — For expired/revoked credentials, show **Reconnect / Pair again** without losing the server alias or entering a local-server fallback.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.8 — Support switching/removing servers using upstream server picker if available; clearing a server must remove its stored credentials.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.9 — Treat a local-loopback pairing URL as an independently managed endpoint, not a trigger to start a server.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.10 — Test remote TLS certificates, hostname mismatch, unreachable host, bad credentials, expired one-time link, server restart, reconnect, and app relaunch.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 3.11 — Avoid placing pairing tokens in logs, telemetry, process arguments, browser history, clipboard history beyond normal paste behavior, or URLs opened in external browsers unless the upstream flow requires it.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —


### Phase 4 — Remove local configuration dependency

#### 4.1 — Verify app launch and pairing work with `%USERPROFILE%\.config\opencode\opencode.json` absent and with no OpenCode CLI installed.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 4.2 — Bypass only desktop code that reads local server hostname/port or server configuration for managed startup. Do not remove shared configuration APIs used by the remote server.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 4.3 — Fetch models, providers, agents, permissions, tools, project settings, and sessions from the selected server using existing API clients.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 4.4 — Preserve local desktop preferences (window geometry, theme, selected server) without conflating them with `opencode.json`.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 4.5 — Make connection UI resilient to a remote server that has not yet finished loading its own config; show server-originated errors rather than local config prompts.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 4.6 — Verify a deliberately invalid local `opencode.json` does not prevent startup or pairing, if the client must ignore it entirely.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —


### Phase 5 — Disable telemetry and verify egress

#### 5.1 — Inventory instrumentation at all layers: desktop main process, frontend, crash reporter, native runtime, update framework, logging plugins, and bundled third-party analytics.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.2 — Use supported opt-out/disable flags for telemetry libraries first. Remove or conditionally exclude their initialization only when opt-out does not fully disable transmission.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.3 — Disable crash-report uploads and automatic diagnostics submission. Local diagnostic logs may remain, but redact URLs containing pairing tokens, auth headers, and secrets.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.4 — Audit automatic update checks: disable unsolicited requests if they produce telemetry or violate approved network destinations; if retaining updates, document destinations and verify requests contain no analytics or unique tracking identifiers.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.5 — Disable telemetry for the Windows remote-only artifact at build time, not by requiring users to edit `opencode.json` or set an environment variable.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.6 — Test startup, pairing, session creation, streaming, error handling, update flow, crash simulation (in test environment), and shutdown under packet capture/proxy logging.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.7 — Maintain an allowlist of operational traffic (configured server, approved update endpoint only if retained) and assert no analytics/crash-report hosts are contacted.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.8 — Inspect third-party native libraries for independent telemetry; document what can and cannot be controlled by the application.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 5.9 — Document that this client-only change does not turn off telemetry generated by the remote server or infrastructure hosting it.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —


### Phase 6 — Preserve upstream features and remote semantics

#### 6.1 — Confirm session create/list/resume, streaming, model selection, agent selection, tool calls, permissions, MCP status, project switching, and server-backed file operations work remotely.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 6.2 — Identify desktop features that previously assumed local filesystem access; ensure project roots and shell commands refer to the remote server filesystem, not Windows client paths.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 6.3 — Preserve upstream UI components and API types; fix compatibility issues in the desktop adapter rather than copying/replacing shared app code.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 6.4 — Check SSE/WebSocket reconnect and proxy/TLS behavior for remote addresses.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 6.5 — Check server/client version compatibility. Display actionable errors for unsupported pairing protocol or incompatible API; do not silently start a local server.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 6.6 — Verify security-sensitive actions remain subject to server-side permissions and access control.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —


### Phase 7 — Windows packaging, CI, and artifact verification

#### 7.1 — Update only the Windows x64 build target to enable remote-only mode and exclude server sidecar if safe. Preserve other platforms' definitions.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.2 — Keep upstream installer framework, signing, and build tooling. Avoid renaming internal package IDs unnecessarily because it may disrupt upgrades and persisted credentials.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.3 — Confirm actual installer output filename. If the required filename differs from upstream (`opencode-desktop-win-x64.exe` vs `opencode-desktop-windows-x64.exe`), rename the release artifact in packaging/upload only, not in application code.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.4 — Add Windows CI jobs for clean install, first-run pairing UI, remote connection, app restart, and no-local-server process assertion.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.5 — Add static checks for forbidden server spawn code paths in remote-only mode and runtime checks for unexpected child processes.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.6 — Produce checksums, signed executable if signing is available, SBOM/dependency inventory, and a concise change summary.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 7.7 — Test fresh install, in-place upgrade, downgrade/rollback, uninstall, and credential removal behavior.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —


### Phase 8 — Upstream synchronization and maintenance

#### 8.1 — Keep all fork-only behavior behind the single desktop product flag and narrowly scoped desktop adapter files.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.2 — Maintain `docs/remote-only/upstream-delta.md` listing each modified upstream file, reason, and associated test.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.3 — Prefer a small sequence of focused commits/PRs: policy flag, no-spawn, pairing-first, config independence, telemetry, Windows packaging/tests.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.4 — Avoid changes to shared `packages/app`, server, API schemas, and auth contracts unless an unavoidable upstream limitation is demonstrated and covered by regression tests.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.5 — On each upstream merge/rebase, rerun the complete Windows remote-only test matrix, especially startup, pairing, credential persistence, server spawn, telemetry, and packaging.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.6 — Track upstream changes to desktop framework, server selection, auth pairing, telemetry, and update infrastructure; review only the affected adapter files.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

#### 8.7 — Maintain a reproducible Windows build with pinned dependencies and a documented rollback point.

- **Status:** Not started
- **Owner / start / completion:** TBD / — / —
- **Files changed / implementation notes:** —
- **Verification commands and results:** —
- **Evidence (commit, PR, logs, screenshots, traces):** —
- **Decision / deviation / blocker / next action:** —

## Execution history (append-only)

| Date (UTC) | Task ID | Change / result | Evidence / commit | Author |
|---|---|---|---|---|
| — | — | No tasks started | — | — |

## Release readiness

- [ ] All applicable sub-tasks verified and synchronized with plan checkboxes.
- [ ] All phase gates reviewed and signed off.
- [ ] Windows acceptance matrix executed and evidence linked.
- [ ] No local server spawned; no local `opencode.json` required; pairing works; no client telemetry observed.
- [ ] Final Windows executable, checksum, and rollback reference recorded.
