import { useEffect, useState } from 'react'
import type { ClientExtension } from './types'

let pending: Promise<ClientExtension> | null = null

// '@client-extension' is resolved per build (vite.config.ts) and split into its own chunk.
function loadClientExtension() {
  pending ??= import('@client-extension').then((mod) => mod.default)
  return pending
}

export type ExtensionState =
  | { status: 'off' }
  | { status: 'loading' }
  | { status: 'ready'; extension: ClientExtension }

export function useClientExtension(enabled: boolean): ExtensionState {
  const [extension, setExtension] = useState<ClientExtension | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadClientExtension().then((ext) => {
      if (alive) setExtension(ext)
    })
    return () => {
      alive = false
    }
  }, [enabled])

  if (!enabled) return { status: 'off' }
  return extension ? { status: 'ready', extension } : { status: 'loading' }
}
