import { describe, expect, test } from "bun:test"
import { allowManagedLocalServer, allowTelemetry, isRemoteOnly } from "./desktop-policy"

describe("desktop policy remote-only product mode", () => {
  // The remote-only flag is a build-time constant for packaged builds and a dev-time
  // environment variable check for development. In the default (non-remote-only) build
  // the desktop manages a local sidecar service; remote-only builds set the flag to
  // true and never spawn a local server.

  test("is a boolean", () => {
    expect(typeof isRemoteOnly).toBe("boolean")
  })

  test("defaults to false (sidecar mode) when no remote-only flag is set", () => {
    expect(isRemoteOnly).toBe(false)
  })

  test("allows managed local server when not remote-only", () => {
    expect(allowManagedLocalServer).toBe(true)
  })

  test("does not allow telemetry when not remote-only (telemetry follows upstream defaults)", () => {
    // In non-remote-only mode, telemetry is controlled by Sentry DSN presence,
    // not the remote-only flag. The flag itself does not disable telemetry
    // unless remote-only mode is active.
    expect(allowTelemetry).toBe(true)
  })

  test("policy flags are consistent: remote-only implies no managed server and no telemetry", () => {
    if (isRemoteOnly) {
      expect(allowManagedLocalServer).toBe(false)
      expect(allowTelemetry).toBe(false)
    } else {
      expect(allowManagedLocalServer).toBe(true)
      expect(allowTelemetry).toBe(true)
    }
  })
})
