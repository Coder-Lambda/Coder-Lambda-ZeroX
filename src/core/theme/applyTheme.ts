import { flushSync } from 'react-dom'
import { writePref } from '../data/localDb'
import type { ThemeId } from '../config/types'

function setThemeAttribute(id: ThemeId) {
  const root = document.documentElement
  root.dataset.theme = id
  const canvas = getComputedStyle(root).getPropertyValue('--canvas').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas)
  writePref('boot-theme', id)
}

/**
 * Switches the whole app to a theme. With `animate`, the page cross-fades (View Transitions);
 * `update` runs inside the same transition so a React state change lands in the same frame.
 */
export function applyTheme(id: ThemeId, options: { animate?: boolean; update?: () => void } = {}) {
  const run = () => {
    setThemeAttribute(id)
    if (options.update) flushSync(options.update)
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const changes = document.documentElement.dataset.theme !== id
  if (options.animate && changes && !reduceMotion && 'startViewTransition' in document) {
    document.startViewTransition(run)
  } else {
    run()
  }
}
