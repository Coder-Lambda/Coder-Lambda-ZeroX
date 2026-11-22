import type { PaletteThemeId } from '../../config/types'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { ThemeCard } from '../../theme/ThemeCard'
import { THEMES } from '../../theme/themes'
import { withName } from '../withName'

interface ThemeStepProps {
  name: string
  selected: PaletteThemeId | null
  onPick: (theme: PaletteThemeId) => void
}

export function ThemeStep({ name, selected, onPick }: ThemeStepProps) {
  return (
    <>
      <h1 className="ob-title" tabIndex={-1}>
        {withName(t.onboarding.themeTitle(name), name)}
      </h1>
      <p className="ob-sub">{t.onboarding.themeSub}</p>
      <div className="theme-grid">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={selected === theme.id}
            onSelect={() => {
              haptic('selection')
              onPick(theme.id)
            }}
          />
        ))}
      </div>
    </>
  )
}
