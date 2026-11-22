import type { PaletteThemeId } from '../config/types'

export interface ThemeMeta {
  id: PaletteThemeId
  name: string
  /** The palette as given for the theme — shown as swatches on the theme cards. */
  palette: string[]
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'dolphin',
    name: 'Dolphin',
    palette: ['#04202E', '#0A3C55', '#0F5E83', '#1786B4', '#4FB3DA', '#98D5EE', '#E1F2FA'],
  },
  { id: 'blackwidow', name: 'Black Widow', palette: ['#CA0808', '#120404', '#270A0A', '#FFFFFF', '#000000'] },
  { id: 'frog', name: 'Frog', palette: ['#B7E5BA', '#5CA87C', '#288760', '#1A5140'] },
  { id: 'wolf', name: 'Wolf', palette: ['#232526', '#757F9A'] },
]
