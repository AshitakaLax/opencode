import { Button } from "@opencode/ui/button"
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "@opencode/ui/dialog"
import { TextInput } from "@opencode/ui/text-input"
import { Show, createSignal } from "solid-js"
import type { ElectronAPI } from "./api-types"

interface RemoteServerConnectDialogProps {
  api: ElectronAPI
  onCancel: () => void
}

function normalizeServerUrl(input: string) {
  const trimmed = input.trim()

  if (!trimmed) return
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`

  return withProtocol.replace(/\/+$/, "")
}

// In remote-only mode, the desktop has no sidecar. When no remote server is configured,
// this screen collects the server URL and password (session token obtained from pairing),
// saves them, and triggers a reconnect.
export function RemoteServerConnectDialog(props: RemoteServerConnectDialogProps) {
  const [url, setUrl] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [status, setStatus] = createSignal<"idle" | "saving" | "error">("idle")

  const save = async () => {
    const normalized = normalizeServerUrl(url())

    if (!normalized) {
      setStatus("error")
      return
    }

    setStatus("saving")

    try {
      await props.api.setRemoteServer({ url: normalized, password: password() })
      setStatus("idle")
      void props.api.reconnectService().then(() => {
        // Reload to pick up the new server connection.
        window.location.reload()
      })
    } catch {
      setStatus("error")
    }
  }

  const saveDisabled = () => status() === "saving" || !normalizeServerUrl(url()) || !password()

  return (
    <Dialog fit>
      <DialogHeader>
        <DialogTitle>Connect to OpenCode Server</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Server URL</label>
            <TextInput
              placeholder="http://your-server:4096"
              value={url()}
              onInput={(e) => setUrl(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Password (session token)</label>
            <TextInput
              type="password"
              placeholder="Token from `opencode pair`"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <Show when={status() === "error"}>
            <p class="text-sm text-destructive">Please enter a valid server URL and password.</p>
          </Show>
          <div class="flex gap-2 justify-end">
            <Button variant="outline" onClick={props.onCancel} disabled={saveDisabled()}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saveDisabled()}>
              {saveDisabled() ? "Enter URL and password" : "Connect"}
            </Button>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  )
}
