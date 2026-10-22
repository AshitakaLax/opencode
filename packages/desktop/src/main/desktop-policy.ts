export * as DesktopPolicy from "./desktop-policy"

// In remote-only mode the desktop never spawns a local background service and connects
// only to remote OpenCode servers via pairing. The flag is set:
//   - At build time via import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY for packaged Windows x64 builds.
//   - At runtime via process.env.OPENCODE_DESKTOP_REMOTE_ONLY for development.
// The build-time flag is always defined by Vite's define for packaged builds; in
// development it is undefined and the env var is checked instead.

const REMOTE_ONLY =
  import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY === "1" ||
  process.env.OPENCODE_DESKTOP_REMOTE_ONLY === "1"

/** In remote-only mode the desktop never spawns a local background service. */
export const isRemoteOnly: boolean = REMOTE_ONLY

/** Whether the desktop is allowed to spawn or manage a local OpenCode server. */
export const allowManagedLocalServer: boolean = !REMOTE_ONLY

/** Whether the desktop is allowed to send telemetry, analytics, crash reports, or update pings. */
export const allowTelemetry: boolean = !REMOTE_ONLY
