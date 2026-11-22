import type { ReactNode } from 'react'

/** Highlights the user's name in a sentence with the accent glow (icy §4). */
export function withName(text: string, name: string): ReactNode {
  const at = name ? text.lastIndexOf(name) : -1
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <span className="text-accent">{name}</span>
      {text.slice(at + name.length)}
    </>
  )
}
