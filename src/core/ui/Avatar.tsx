import { initials } from '../lib/format'

export function Avatar({ name, size = 40, muted = false }: { name: string; size?: number; muted?: boolean }) {
  return (
    <span
      className={`avatar${muted ? ' is-muted' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
