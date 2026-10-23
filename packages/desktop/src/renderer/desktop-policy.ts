// Mirrors src/main/desktop-policy.ts; both read the same build-time constant.
export const isRemoteOnly: boolean = import.meta.env.OPENCODE_DESKTOP_REMOTE_ONLY !== "0"
