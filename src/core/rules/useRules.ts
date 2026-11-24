import { useCallback, useMemo } from 'react'
import { useSession } from '../auth/SessionProvider'
import { readRules } from './defaults'
import type { RuleBook, RuleChapter } from './types'

/** The active business's rule book, and a way to rewrite one chapter of it. */
export function useRules() {
  const { active, updateActive } = useSession()
  const rules = useMemo(() => readRules(active), [active])

  const saveChapter = useCallback(
    <K extends RuleChapter>(chapter: K, change: (current: RuleBook[K]) => RuleBook[K]) =>
      // Read from the latest saved config, so two quick changes never overwrite each other.
      updateActive((latest) => {
        const book = readRules(latest)
        return { rules: { ...book, [chapter]: change(book[chapter]) } }
      }),
    [updateActive],
  )

  return { rules, saveChapter }
}

/**
 * A client's own rule chapter (set-as-wish): its values over the defaults its extension gives, and a save that
 * merges a patch. Used by code in src/extensions/<clientId>.
 */
export function useCustomRules<T extends Record<string, unknown>>(id: string, defaults: T) {
  const { rules, saveChapter } = useRules()
  const value = { ...defaults, ...(rules.custom[id] as Partial<T> | undefined) } as T
  const save = useCallback(
    (patch: Partial<T>) => saveChapter('custom', (custom) => ({ ...custom, [id]: { ...defaults, ...custom[id], ...patch } })),
    [saveChapter, id, defaults],
  )
  return [value, save] as const
}

/** One chapter: `save` merges a patch; `update` derives the patch from the latest saved chapter (use it for lists). */
export function useChapter<K extends RuleChapter>(chapter: K) {
  const { rules, saveChapter } = useRules()
  const update = useCallback(
    (change: (current: RuleBook[K]) => Partial<RuleBook[K]>) =>
      saveChapter(chapter, (current) => ({ ...current, ...change(current) })),
    [saveChapter, chapter],
  )
  const save = useCallback((patch: Partial<RuleBook[K]>) => update(() => patch), [update])
  return { chapter: rules[chapter], save, update }
}
