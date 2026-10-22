// Renderer-process policy flags. These mirror the main-process policy in
// src/main/desktop-policy.ts but use renderer-safe values (import.meta.env).
// Build-time flags are injected by Vite's define; runtime env vars only apply in dev.

/** In remote-only mode the desktop never spawns a local background service. */
export const isRemoteOnly: boolean =
  import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY === "1" ||
  process.env.OPENCODE_DESKTOP_REMOTE_ONLY === "1"
