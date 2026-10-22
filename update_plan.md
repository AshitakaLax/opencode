# OpenCode V2 Windows Desktop — Remote-Only Migration Plan

**Target fork:** https://github.com/AshitakaLax/opencode  
**Target deliverable:** Windows x64 desktop executable (`opencode-desktop-win-x64.exe`, or the actual upstream artifact name verified during discovery)  
**Scope:** Windows desktop shell and its build/release wiring only.  
**Guiding principle:** Prefer upstream extension points, conditional startup behavior, and build-time flags over modifications to shared OpenCode application, server, or authentication code.

> **Repository verification note:** This plan is based on documented OpenCode V2 behavior and known desktop architectures; the fork's current source tree, branch, and exact symbols were not independently verified. Phase 0 explicitly maps and confirms paths before changes. Do not assume historical Tauri paths are still active: some desktop versions use Electron.

## 1. Goals and invariants

### Required behavior
- [ ] The Windows executable never spawns, installs, downloads, or silently starts an OpenCode server or server sidecar.
- [ ] The Windows executable can connect to an already running OpenCode server, including one on the same PC (loopback), a LAN host, or a permitted remote endpoint.
- [ ] On first launch or when unpaired, show **Connect to a server** with a pairing-link input and a connect action; optionally expose password/manual URL fallback only if already supported upstream.
- [ ] Validate and redeem upstream-compatible pairing links without inventing a second authentication protocol.
- [ ] Persist only the connection/session material necessary to reconnect, securely, and handle expiration/revocation.
- [ ] Startup and connection do not read or require local `opencode.json` or a local OpenCode CLI installation.
- [ ] Model/provider/agent configuration, filesystem operations, tools, and prompt execution are handled by the selected remote OpenCode server.
- [ ] No application telemetry, analytics, crash uploads, usage reporting, or auto-update telemetry is transmitted by the Windows client.
- [ ] The desktop does not make direct LLM-provider calls; only the explicitly selected OpenCode server processes prompts.
- [ ] Preserve upstream desktop UI and server-backed capabilities, including sessions, agents, permissions, events, file navigation, and streaming, where supported by the server.

### Explicit non-goals
- Modifying the remote OpenCode server or its `opencode.json` configuration.
- Disabling the server's own telemetry; that is a separate server deployment policy.
- Removing the ability to connect to `127.0.0.1` when an independently managed server is already running there.
- Implementing a custom proxy, authentication service, new server protocol, or forked UI.
- Altering Linux/macOS desktop builds or the upstream CLI unless a proven build-system dependency requires a minimal conditional change.

### Definition of done
A clean Windows VM with no OpenCode CLI, no local `opencode.json`, and no server process can launch the installer, show the pairing screen, pair with an existing remote server, operate a session, reconnect after restart, and close without starting a local server or sending telemetry.

## 2. Architectural decision

**Preferred solution: a thin remote-only Windows desktop shell.** Keep the existing upstream desktop framework and frontend; introduce a single `remoteOnly` / `REMOTE_ONLY_DESKTOP` product mode, applied at desktop startup and packaging boundaries. Reuse upstream server selection, pairing UI, authentication handling, HTTP/SSE/WebSocket clients, and session state. Avoid copying `packages/app` or creating a new desktop frontend.

Desired control flow:

```text
Windows desktop starts
    |
    +--> load local desktop connection metadata (NOT opencode.json)
    |
    +--> saved server? -- no --> upstream pairing/connect screen
    |                         |
    |                         +--> validate and redeem pairing link
    |                         +--> securely save connection/session
    |
    +--> saved server? -- yes --> authenticate / health check
                                      |
                         success -----+---- failure
                            |                 |
                     existing UI       reconnect / re-pair UI
                            |
                  remote server API only
                            |
            agents, tools, models, files, sessions
                   execute on remote host
```

**Important:** Pairing links may contain short-lived credentials. Do not persist the original one-time URL, log it, put it in crash reports, or retain it in browser history. Persist the upstream-issued session or credential using the framework's supported secure storage mechanism. Prefer Windows Credential Manager or a vetted OS-backed credential store; store nonsecret display URL/alias separately. Verify whether upstream uses cookies, OS storage, or another supported session mechanism before choosing implementation.

## Execution tracking and mandatory ledger updates

`update_ledger.md` is the authoritative execution record for this plan. Each numbered sub-task (`0.1` through `8.7`) has a matching ledger entry. **After completing each individual sub-task, update its entry in `update_ledger.md` immediately, before starting the next sub-task or claiming the work complete.** Do not defer ledger updates to the end of a phase or pull request.

For each sub-task:
1. Before starting, set its ledger status to `In progress`, assign an owner, and record the starting date and baseline commit where applicable.
2. Perform the work and execute the task-specific verification. Record changed files, commands/tests and outcomes, commit/PR links, and any design decisions or deviations from the plan. Redact secrets and pairing tokens.
3. On success, mark the corresponding plan checkbox `[x]`, set the ledger status to `Complete`, and enter the completion date and evidence. **The plan checkbox and ledger status must agree.**
4. If blocked or verification fails, leave the plan checkbox unchecked; set the ledger status to `Blocked` or `Failed`, describe the issue, owner, next action, and retest criteria. Do not claim completion on implementation alone.
5. When a phase is complete, update its phase gate in the ledger with acceptance evidence and reviewer sign-off. Before every commit/PR, review consistency between both files; commit plan and ledger changes together with the implementation when possible.

If a sub-task is intentionally omitted, use `Not applicable` only with a written justification and approval; leave the plan checkbox unchecked unless the plan is formally revised. When adding, removing, or renumbering tasks, modify **both** documents in the same change, preserving stable IDs for historical entries.

## Phase 0 — Baseline, architecture discovery, and acceptance tests

**Objective:** Establish exact fork/upstream baseline and locate the smallest change surface. No production behavior changes in this phase.

- [x] **0.1** Record fork branch, commit SHA, upstream remote, merge base, package versions, desktop framework, Windows build commands, and artifact names.
- [x] **0.2** Add/verify upstream remote without replacing the fork's origin; capture `git status`, `git remote -v`, and `git log --oneline --decorate -10`.
- [x] **0.3** Identify the actual Windows desktop package (`packages/desktop-electron`, `packages/desktop`, or current equivalent), desktop main process, preload/IPC or Tauri commands, frontend entrypoint, server selection, authentication, updater, and packaging scripts.
- [x] **0.4** Trace startup from executable entrypoint to server connection. Record every code path that starts, probes, downloads, installs, or terminates an OpenCode server.
- [x] **0.5** Identify which code reads local `opencode.json`, what is used solely for local server startup, and whether frontend initialization requires local configuration before a server is selected.
- [x] **0.6** Locate existing pairing-link parsing, redeem/connection logic, persisted default server, credential storage, reconnect behavior, and remote health checks.
- [x] **0.7** Inventory all telemetry/analytics/crash/update/diagnostic endpoints and libraries reachable from Windows desktop startup, runtime, and shutdown; distinguish operational remote-server API traffic from telemetry.
- [x] **0.8** Inspect whether desktop-specific functionality (terminal, file chooser, notifications, filesystem bridges, updates) relies on a local server or local native helper. Classify each as server-backed, safe client-side UI, or incompatible with remote-only mode.
- [x] **0.9** Capture baseline Windows build, startup, remote connection, and telemetry network traces before modification.
- [x] **0.10** Write baseline tests first, where practical, for: no server spawn, no config file, unpaired startup, remote pairing, persisted reconnect, failed connection, and no telemetry.

**Discovery commands (adapt to actual repo):**

```bash
git remote -v
git status --short
git log -1 --format='%H %s'
rg -n 'spawn.*server|startServer|setupServerConnection|sidecar|opencode serve|checkHealth|pair|auth/connect' packages
rg -n 'opencode\.json|telemetry|analytics|sentry|posthog|crash|updater|autoUpdate' packages .github
rg -n 'desktop-electron|desktop-windows|desktop-win|windows-x64|nsis|tauri' packages .github
```

**Deliverables:** `docs/remote-only/baseline.md`, dependency and call-site inventory, and a file-level modification list with rationale.  
**Gate P0:** No implementation until the actual framework, pairing API, and startup call sites are confirmed.

## Phase 1 — Introduce Windows remote-only product mode

**Objective:** One centralized, auditable policy switch, without forking shared UI behavior.

- [x] **1.1** Define a build-time flag such as `OPENCODE_DESKTOP_REMOTE_ONLY=1` for the Windows x64 variant. Use the existing framework's native compile-time configuration mechanism where possible.
- [x] **1.2** Centralize policy in one small desktop module (example interface: `desktopPolicy.remoteOnly`, `allowManagedLocalServer=false`, `allowTelemetry=false`). Avoid scattering environment checks and Windows platform checks throughout UI code.
- [x] **1.3** Ensure the policy is immutable in production and enforced in the desktop main/native process, not just hidden in frontend controls.
- [x] **1.4** Keep normal upstream builds unchanged when the flag is absent. If this fork exclusively builds remote-only Windows, still preserve a default-off switch for easier rebasing.
- [x] **1.5** Add a small unit test proving the Windows product variant resolves to remote-only, server-spawn-disabled, telemetry-disabled.

**Gate P1:** One product-mode implementation, no shared server logic changed.

## Phase 2 — Remove managed local server lifecycle

**Objective:** Never start a local OpenCode backend from the Windows executable.

- [x] **2.1** At the desktop startup branch, bypass the call that provisions/spawns the embedded server and enter the existing remote connection flow.
- [x] **2.2** Disable every fallback that launches a local server after health-check failure, network timeout, login failure, or an absent saved server.
- [x] **2.3** Disable managed-server restart, update, auto-install, sidecar resolution, and teardown paths for remote-only builds; do not kill independently started servers on exit.
- [x] **2.4** Retain the existing ability to connect to `localhost` or `127.0.0.1` as a normal remote endpoint. A health check must never implicitly spawn a process.
- [x] **2.5** Audit frontend initialization for assumptions that an injected local server port or native server process always exists. Make the server address come from selected connection state.
- [x] **2.6** Ensure no local server is invoked by deep links, window restore, system tray, background resume, second-instance handling, or update flows.
- [x] **2.7** Decide whether to exclude the server binary from the Windows installer. **Preferred:** exclude it if packaging can do so without breaking client-only features. Do not delete shared sidecar assets globally. Confirm no runtime path can execute a bundled binary even if it remains as a transitional artifact.
- [x] **2.8** Verify with process monitoring that no `opencode` server child process is created during install, first launch, reconnect, session usage, and exit.

**Gate P2:** A clean machine with no local OpenCode binary starts the app and reaches the connection screen; no server process is spawned.

## Phase 3 — Pairing-first startup and session lifecycle

**Objective:** Reuse upstream `opencode pair` links and existing connection UI.

- [ ] **3.1** Prefer mounting the upstream pairing component as the initial route/state when there is no valid saved connection. Do not duplicate the form if it already exists.
- [ ] **3.2** Label the screen **Connect to a server**, explain that the server administrator runs `opencode pair`, and offer paste-link + Connect. Preserve upstream password/manual fallback if required for supported deployments.
- [ ] **3.3** Validate link syntax, supported scheme, host, port, expected `/auth/connect/...` structure, and origin. Treat link input as untrusted; prevent arbitrary local file schemes, JavaScript URLs, open redirects, or token leakage.
- [ ] **3.4** Reuse the server's existing one-time pairing redemption flow. Confirm actual endpoint semantics and expiration behavior in the checked-out version; do not assume the link itself is a permanent bearer credential.
- [ ] **3.5** Save the selected server URL and upstream-issued authentication/session material using existing secure storage when adequate; otherwise add a minimal Windows OS-backed credential adapter.
- [ ] **3.6** On subsequent launch, restore the saved connection, perform authenticated health check, and open the normal OpenCode UI. Ensure credentials are passed to the initial health check (a known historical failure class).
- [ ] **3.7** For expired/revoked credentials, show **Reconnect / Pair again** without losing the server alias or entering a local-server fallback.
- [ ] **3.8** Support switching/removing servers using upstream server picker if available; clearing a server must remove its stored credentials.
- [ ] **3.9** Treat a local-loopback pairing URL as an independently managed endpoint, not a trigger to start a server.
- [ ] **3.10** Test remote TLS certificates, hostname mismatch, unreachable host, bad credentials, expired one-time link, server restart, reconnect, and app relaunch.
- [ ] **3.11** Avoid placing pairing tokens in logs, telemetry, process arguments, browser history, clipboard history beyond normal paste behavior, or URLs opened in external browsers unless the upstream flow requires it.

**Gate P3:** First-run pairing and restart reconnect work against an unmodified, compatible OpenCode server.

## Phase 4 — Remove local configuration dependency

**Objective:** No client-side OpenCode server configuration needed to launch or connect.

- [ ] **4.1** Verify app launch and pairing work with `%USERPROFILE%\.config\opencode\opencode.json` absent and with no OpenCode CLI installed.
- [ ] **4.2** Bypass only desktop code that reads local server hostname/port or server configuration for managed startup. Do not remove shared configuration APIs used by the remote server.
- [ ] **4.3** Fetch models, providers, agents, permissions, tools, project settings, and sessions from the selected server using existing API clients.
- [ ] **4.4** Preserve local desktop preferences (window geometry, theme, selected server) without conflating them with `opencode.json`.
- [ ] **4.5** Make connection UI resilient to a remote server that has not yet finished loading its own config; show server-originated errors rather than local config prompts.
- [ ] **4.6** Verify a deliberately invalid local `opencode.json` does not prevent startup or pairing, if the client must ignore it entirely.

**Gate P4:** App works with no local `opencode.json` and reads configuration only from the connected server.

## Phase 5 — Disable telemetry and verify egress

**Objective:** No desktop-originated telemetry, without accidentally breaking normal remote-server communications.

- [ ] **5.1** Inventory instrumentation at all layers: desktop main process, frontend, crash reporter, native runtime, update framework, logging plugins, and bundled third-party analytics.
- [ ] **5.2** Use supported opt-out/disable flags for telemetry libraries first. Remove or conditionally exclude their initialization only when opt-out does not fully disable transmission.
- [ ] **5.3** Disable crash-report uploads and automatic diagnostics submission. Local diagnostic logs may remain, but redact URLs containing pairing tokens, auth headers, and secrets.
- [ ] **5.4** Audit automatic update checks: disable unsolicited requests if they produce telemetry or violate approved network destinations; if retaining updates, document destinations and verify requests contain no analytics or unique tracking identifiers.
- [ ] **5.5** Disable telemetry for the Windows remote-only artifact at build time, not by requiring users to edit `opencode.json` or set an environment variable.
- [ ] **5.6** Test startup, pairing, session creation, streaming, error handling, update flow, crash simulation (in test environment), and shutdown under packet capture/proxy logging.
- [ ] **5.7** Maintain an allowlist of operational traffic (configured server, approved update endpoint only if retained) and assert no analytics/crash-report hosts are contacted.
- [ ] **5.8** Inspect third-party native libraries for independent telemetry; document what can and cannot be controlled by the application.
- [ ] **5.9** Document that this client-only change does not turn off telemetry generated by the remote server or infrastructure hosting it.

**Gate P5:** Zero observed desktop telemetry transmissions across tested workflows; no telemetry setup required from end users.

## Phase 6 — Preserve upstream features and remote semantics

**Objective:** Prevent accidental loss of features from the client-only change.

- [ ] **6.1** Confirm session create/list/resume, streaming, model selection, agent selection, tool calls, permissions, MCP status, project switching, and server-backed file operations work remotely.
- [ ] **6.2** Identify desktop features that previously assumed local filesystem access; ensure project roots and shell commands refer to the remote server filesystem, not Windows client paths.
- [ ] **6.3** Preserve upstream UI components and API types; fix compatibility issues in the desktop adapter rather than copying/replacing shared app code.
- [ ] **6.4** Check SSE/WebSocket reconnect and proxy/TLS behavior for remote addresses.
- [ ] **6.5** Check server/client version compatibility. Display actionable errors for unsupported pairing protocol or incompatible API; do not silently start a local server.
- [ ] **6.6** Verify security-sensitive actions remain subject to server-side permissions and access control.

**Gate P6:** A representative remote feature regression suite passes, with any server-side limitations explicitly documented.

## Phase 7 — Windows packaging, CI, and artifact verification

**Objective:** Ship only the requested Windows x64 desktop variant.

- [ ] **7.1** Update only the Windows x64 build target to enable remote-only mode and exclude server sidecar if safe. Preserve other platforms' definitions.
- [ ] **7.2** Keep upstream installer framework, signing, and build tooling. Avoid renaming internal package IDs unnecessarily because it may disrupt upgrades and persisted credentials.
- [ ] **7.3** Confirm actual installer output filename. If the required filename differs from upstream (`opencode-desktop-win-x64.exe` vs `opencode-desktop-windows-x64.exe`), rename the release artifact in packaging/upload only, not in application code.
- [ ] **7.4** Add Windows CI jobs for clean install, first-run pairing UI, remote connection, app restart, and no-local-server process assertion.
- [ ] **7.5** Add static checks for forbidden server spawn code paths in remote-only mode and runtime checks for unexpected child processes.
- [ ] **7.6** Produce checksums, signed executable if signing is available, SBOM/dependency inventory, and a concise change summary.
- [ ] **7.7** Test fresh install, in-place upgrade, downgrade/rollback, uninstall, and credential removal behavior.

**Gate P7:** Release artifact installs and passes acceptance tests on a clean Windows x64 environment.

## Phase 8 — Upstream synchronization and maintenance

**Objective:** Make recurring upstream merges low risk and low effort.

- [ ] **8.1** Keep all fork-only behavior behind the single desktop product flag and narrowly scoped desktop adapter files.
- [ ] **8.2** Maintain `docs/remote-only/upstream-delta.md` listing each modified upstream file, reason, and associated test.
- [ ] **8.3** Prefer a small sequence of focused commits/PRs: policy flag, no-spawn, pairing-first, config independence, telemetry, Windows packaging/tests.
- [ ] **8.4** Avoid changes to shared `packages/app`, server, API schemas, and auth contracts unless an unavoidable upstream limitation is demonstrated and covered by regression tests.
- [ ] **8.5** On each upstream merge/rebase, rerun the complete Windows remote-only test matrix, especially startup, pairing, credential persistence, server spawn, telemetry, and packaging.
- [ ] **8.6** Track upstream changes to desktop framework, server selection, auth pairing, telemetry, and update infrastructure; review only the affected adapter files.
- [ ] **8.7** Maintain a reproducible Windows build with pinned dependencies and a documented rollback point.

**Gate P8:** A new upstream release can be integrated without manually reimplementing UI features or changing server code.

## 3. File-change budget and decision rules

Target the smallest **logical** diff, not an arbitrary file count:

| Area | Preferred action | Avoid |
|---|---|---|
| Desktop startup/main process | Branch into remote connection state | Replacing the desktop framework |
| Server lifecycle | Disable spawn/provision/restart in product mode | Deleting upstream server implementation |
| Pairing screen | Reuse existing UI and redemption | New custom auth protocol |
| Connection persistence | Reuse upstream session store; add OS-backed storage only if needed | Plaintext long-lived secrets |
| Local config | Remove client startup dependency | Editing server config resolution globally |
| Telemetry | Disable initialization/transmission for Windows product | Disabling server telemetry by modifying shared server code |
| Windows build | Set flag and exclude sidecar as appropriate | Forking all release workflows |
| Tests | Add focused Windows regression coverage | Duplicating entire upstream test suites |

**Escalation rule:** Before modifying a shared package, record (a) why desktop-only hooks are insufficient, (b) the exact shared API behavior required, (c) backward compatibility, and (d) an upstreamable alternative. Prefer a tiny optional parameter or injectable adapter over copied components.

## 4. Acceptance test matrix

| ID | Scenario | Expected result |
|---|---|---|
| A01 | Clean Windows machine, no CLI/config/server | App opens pairing screen; no process spawned |
| A02 | Pair using valid unexpired `opencode pair` link | Authenticated server connection succeeds |
| A03 | Restart desktop after pairing | Saved connection restored without re-pairing |
| A04 | Server unreachable at startup | Retry/re-pair state; no local server fallback |
| A05 | Invalid or expired pairing link | Clear error; no credentials persisted |
| A06 | Revoke server session | Re-pair requested; stale session rejected |
| A07 | Connect to existing server on `127.0.0.1` | Connects without starting or stopping it |
| A08 | Missing or malformed local `opencode.json` | No effect on startup/pairing |
| A09 | Run prompt with tool use | Execution occurs on remote host only |
| A10 | Switch models/agents/projects | Uses server-provided options and paths |
| A11 | Exercise permission prompts and streaming | Matches upstream server-backed behavior |
| A12 | Close app | No server killed; no telemetry emitted |
| A13 | Packet capture during full workflow | Only approved operational destinations contacted |
| A14 | Clean install and upgrade Windows x64 | Same pairing and connection behavior |
| A15 | Pairing URL with malformed scheme/redirect | Rejected safely; no token leak |
| A16 | Server and client version mismatch | Actionable compatibility error |
| A17 | Server requires authenticated health check | Health check uses existing credentials |
| A18 | Windows installer payload audit | No executable local-server capability available in product mode |

## 5. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Fork uses a different desktop framework than expected | Wrong patch locations | Phase 0 framework verification |
| Pairing link handling depends on embedded browser/session behavior | Authentication failure | Reuse upstream flow and test cookie/credential persistence |
| A hidden fallback spawns a local server | Violates remote-only policy | Main-process enforcement and process monitoring |
| Client-side UI references local config | Startup failure | Test with absent/malformed local config |
| Desktop features depend on local paths | Incorrect file/tool execution | Remote path semantic regression suite |
| Analytics hidden in updater or crash handler | Unwanted network egress | Multi-layer audit and packet capture |
| Sidecar exclusion breaks packaging | Release failure | Conditional packaging and clean Windows build |
| Upstream renames connection APIs | Merge conflicts | Small adapter surface and per-merge tests |
| Pairing secrets leak through logs or URLs | Credential compromise | Redaction, secure storage, no persistent one-time URL |
| Old installations retain local-server settings | Unwanted fallback | Explicit migration of desktop connection preferences |

## 6. Implementation sequence and PR boundaries

1. **PR-0 — Discovery and test harness:** baseline architecture map and acceptance tests.
2. **PR-1 — Product policy and server lifecycle:** Windows flag, remote-first entry, hard disable local spawn, optional sidecar packaging exclusion.
3. **PR-2 — Pairing and persistence:** reuse upstream pairing screen, restore connection, secure session handling, error/reconnect UX.
4. **PR-3 — Config isolation:** remove client startup dependency on local OpenCode configuration.
5. **PR-4 — Telemetry hardening:** disable all desktop-originated telemetry, egress verification.
6. **PR-5 — Packaging and upstream guardrails:** Windows installer, CI regression suite, merge documentation.

Phases 2–4 can be implemented together if the existing architecture already exposes a remote-server-first startup path; keep review commits logically separate.

## 7. External dependencies and decisions to resolve in Phase 0

- **Exact fork revision:** branch and commit to migrate, and target upstream V2 release.
- **Desktop framework:** Electron vs Tauri (do not mix code paths from historical releases).
- **Pairing contract:** exact URL redemption and credential/session persistence semantics in that revision.
- **Security policy:** whether plain HTTP is permitted for trusted LAN/loopback or HTTPS is mandatory for non-loopback hosts.
- **Telemetry definition:** whether approved update checks are permitted, and whether OS/runtime vendor diagnostics are in scope.
- **Installer identity:** whether this variant replaces an existing OpenCode install or installs side-by-side.
- **Release filename:** exact required artifact name and signing requirements.

## 8. References

- Target fork: https://github.com/AshitakaLax/opencode
- Upstream project: https://github.com/anomalyco/opencode
- OpenCode V2 pairing and remote access: https://dev.opencode.ai/v2/docs/cli/web
- Desktop troubleshooting (local/remote server startup): https://docs.opencode.ai/docs/troubleshooting/
- Historical authenticated startup health-check issue: https://github.com/anomalyco/opencode/issues/16123
- Historical desktop local-server/hostname issue: https://github.com/anomalyco/opencode/issues/7971

**Final engineering constraint:** The Windows desktop is a presentation and connection client. Server-side execution, model credentials, agent configuration, and repository operations stay on the selected OpenCode server. The client must not silently turn into a server under any error or recovery path.
