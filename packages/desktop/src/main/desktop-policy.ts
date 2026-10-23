export * as DesktopPolicy from "./desktop-policy"

// The desktop is a client for remote OpenCode servers: it never starts a local background service and
// sends no telemetry. The mode is a build-time constant (baked by Vite from OPENCODE_DESKTOP_REMOTE_ONLY),
// so it cannot be toggled at runtime. Setting OPENCODE_DESKTOP_REMOTE_ONLY=0 when building or running
// from source restores the upstream managed-sidecar behavior.
export const isRemoteOnly: boolean = import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY !== "0"

/** Whether the desktop is allowed to spawn or manage a local OpenCode server. */
export const allowManagedLocalServer: boolean = !isRemoteOnly

/** Whether the desktop is allowed to send telemetry, analytics, or crash reports. */
export const allowTelemetry: boolean = !isRemoteOnly
