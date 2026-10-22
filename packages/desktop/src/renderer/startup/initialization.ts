import type { ElectronAPI } from "../api-types"
import { isRemoteOnly } from "../desktop-policy"

type SidecarData = Awaited<ReturnType<ElectronAPI["awaitInitialization"]>>

export function initializationData<A>(state: (() => A | undefined) & { error: unknown }) {
  if (state.error !== undefined) throw markLocalServerStartup(state.error)

  return state()
}

// The main process adds Authorization to sidecar requests (`wireRendererHeaders`); the renderer never
// holds the password, and its GETs carry only CORS-safelisted headers so they skip the preflight.
export function sidecarHttp(data: SidecarData) {
  return { url: data.url }
}

export function createSidecarResolver(input: {
  api: Pick<ElectronAPI, "reconnectService">
  current: () => SidecarData | undefined
  update: (data: SidecarData) => void
}) {
  return async (signal: AbortSignal) => {
    if (signal.aborted) throw signal.reason
    const next = await input.api.reconnectService()

    if (signal.aborted) throw signal.reason

    if (!sameSidecar(input.current(), next)) input.update(next)

    return sidecarHttp(next)
  }
}

function sameSidecar(current: SidecarData | undefined, next: SidecarData) {
  return current?.url === next.url
}

function markLocalServerStartup(error: unknown) {
  const failure = error instanceof Error ? error : new Error(String(error))
  Object.defineProperty(failure, "localServerStartup", { value: true })

  return failure
}

// In remote-only mode, a missing saved server is not a crash; it is the normal
// initial state. Returns true when the error is the expected "no server" sentinel
// from the remote-only BackgroundService.connect path.
export function isNoServerConfigured(error: unknown): boolean {
  return isRemoteOnly && error instanceof Error && error.message === "RemoteOnlyNoServer"
}
