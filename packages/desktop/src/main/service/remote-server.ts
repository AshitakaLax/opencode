export * as RemoteServer from "./remote-server"

import { getStore } from "../storage/store"
import { REMOTE_SERVER_KEY } from "../storage/keys"
import type { SidecarCredentials } from "./sidecar-credentials"

export type Stored = {
  readonly url: string
  readonly password: string | null
}

/** Loads the persisted remote server connection, if any. */
export function load(): Stored | undefined {
  const stored = getStore().get(REMOTE_SERVER_KEY)
  if (!stored || typeof stored !== "object" || !("url" in stored)) return undefined
  if (stored.url === undefined || typeof stored.url !== "string") return undefined

  const password = "password" in stored ? stored.password : null
  if (password !== null && typeof password !== "string") return undefined

  return { url: stored.url, password }
}

/** Persists the remote server connection. */
export function save(data: Stored): void {
  getStore().set(REMOTE_SERVER_KEY, data)
}

/** Clears the persisted remote server connection. */
export function clear(): void {
  getStore().delete(REMOTE_SERVER_KEY)
}

/** Returns the stored data as SidecarCredentials.Data, or undefined if none. */
export function credentials(): SidecarCredentials.Data | undefined {
  const stored = load()
  if (!stored) return undefined

  return { url: stored.url, password: stored.password ?? null }
}
