import { Check } from 'lucide-react'
import { t } from '../i18n/pt-BR'
import type { ThemeMeta } from './themes'

interface ThemeCardProps {
  theme: ThemeMeta
  selected: boolean
  onSelect: () => void
}

/** Rendered inside its own [data-theme] scope, so the card previews the theme in its real colors. */
export function ThemeCard({ theme, selected, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      className="theme-card tactile"
      data-theme={theme.id}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="theme-card-preview" aria-hidden="true">
        <span className="theme-card-glass">
          <span className="theme-card-bar" style={{ width: '62%' }} />
          <span className="theme-card-bar" style={{ width: '38%' }} />
          <span className="theme-card-pill" />
        </span>
      </span>
      {selected && (
        <span className="theme-card-check" aria-hidden="true">
          <Check />
        </span>
      )}
      <span className="theme-card-name">{theme.name}</span>
      <span className="theme-card-desc">{t.themes[theme.id]}</span>
      <span className="theme-card-swatches" aria-hidden="true">
        {theme.palette.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </span>
    </button>
  )
}
