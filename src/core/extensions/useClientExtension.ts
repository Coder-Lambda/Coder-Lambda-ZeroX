import { useEffect, useState } from 'react'
import { useSession } from '../auth/SessionProvider'
import { extensionWidgets } from '../widgets/extensionRegistry'
import type { ClientExtension } from './types'

let pending: Promise<ClientExtension> | null = null

// '@client-extension' is resolved per build (vite.config.ts) and split into its own chunk.
function loadClientExtension() {
  if (!pending) {
    extensionWidgets.loading()
    pending = import('@client-extension').then((mod) => {
      extensionWidgets.register(mod.default.widgets ?? [])
      return mod.default
    })
  }
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

/** The client's set-as-wish parts, only for a business that said yes to set-as-wish in the onboarding. */
export function useActiveExtension(): ExtensionState {
  const { active } = useSession()
  return useClientExtension(active?.modules.setAsWish === true)
}
