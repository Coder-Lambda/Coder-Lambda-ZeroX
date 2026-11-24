import type { ExtensionWidget } from '../extensions/types'

/**
 * The client extension's widgets, registered when the extension loads (it is a lazy chunk). Kept apart from the
 * catalog so the extension loader stays small. Views re-render through useExtensionWidgetsVersion().
 */
let widgets: ExtensionWidget[] = []
let status: 'idle' | 'loading' | 'ready' = 'idle'
let version = 0
const listeners = new Set<() => void>()

function notify() {
  version += 1
  listeners.forEach((listener) => listener())
}

export const extensionWidgets = {
  list: () => widgets,
  status: () => status,
  loading() {
    if (status === 'idle') {
      status = 'loading'
      notify()
    }
  },
  register(next: ExtensionWidget[]) {
    widgets = next
    status = 'ready'
    notify()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  version: () => version,
}
