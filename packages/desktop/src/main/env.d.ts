interface ImportMetaEnv {
  readonly OPENCODE_CHANNEL: string
  readonly OPENCODE_VERSION?: string
  readonly OPENCODE_DESKTOP_REMOTE_ONLY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
