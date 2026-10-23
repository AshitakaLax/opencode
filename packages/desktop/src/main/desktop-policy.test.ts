import { describe, expect, test } from "bun:test"
import { allowManagedLocalServer, allowTelemetry, isRemoteOnly } from "./desktop-policy"

describe("desktop policy", () => {
  // Remote-only is the default: only an explicit OPENCODE_DESKTOP_REMOTE_ONLY=0 build restores the sidecar.
  test("defaults to remote-only with no managed server and no telemetry", () => {
    expect({ isRemoteOnly, allowManagedLocalServer, allowTelemetry }).toEqual({
      isRemoteOnly: true,
      allowManagedLocalServer: false,
      allowTelemetry: false,
    })
  })
})
