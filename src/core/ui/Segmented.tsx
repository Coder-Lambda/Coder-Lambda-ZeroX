import type { CSSProperties } from 'react'
import { haptic } from '../lib/haptic'

interface SegmentedProps {
  options: string[]
  value: number
  onChange: (index: number) => void
  label: string
}

export function Segmented({ options, value, onChange, label }: SegmentedProps) {
  const style = { '--n': options.length, '--i': value } as CSSProperties
  return (
    <div className="segmented" role="group" aria-label={label} style={style}>
      <span className="segmented-indicator" aria-hidden="true" />
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          className="segmented-option tactile"
          aria-pressed={index === value}
          onClick={() => {
            haptic('selection')
            onChange(index)
          }}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
