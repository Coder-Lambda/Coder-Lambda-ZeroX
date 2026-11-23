import { useSyncExternalStore } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error'
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

/** Short confirmation at the bottom of the screen ("Funcionário adicionado"). */
export function toast(message: string, tone: Toast['tone'] = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, tone }]
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((item) => item.id !== id)
    emit()
  }, 3200)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts)
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast glass toast-${item.tone}`}>
          {item.tone === 'success' ? <CircleCheck /> : <CircleAlert />}
          {item.message}
        </div>
      ))}
    </div>
  )
}
