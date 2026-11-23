import { haptic } from '../lib/haptic'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  /** Focused first when its dialog opens. */
  autoFocus?: boolean
}

/** uxstyling §3.6: recessed track with a metallic sphere; stretches while pressed (interactions §5.6). */
export function Toggle({ checked, onChange, label, id, autoFocus }: ToggleProps) {
  return (
    <button
      id={id}
      data-autofocus={autoFocus || undefined}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle${checked ? ' is-on' : ''}`}
      onClick={() => {
        haptic(checked ? 'soft' : 'rigid')
        onChange(!checked)
      }}
    >
      <span className="toggle-thumb" aria-hidden="true" />
    </button>
  )
}
