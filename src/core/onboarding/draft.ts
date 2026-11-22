import { CLIENT_ID } from '../config/clientRegistry'
import type { DatabaseChoice, ModuleFlags, PaletteThemeId } from '../config/types'

export interface OnboardingDraft {
  phase: 'intro' | 'steps'
  stepIndex: number
  userName: string
  theme: PaletteThemeId | null
  businessType: string
  database: DatabaseChoice | null
  modules: Partial<ModuleFlags>
}

const key = (accountId: string) => `zerox:onboarding:${CLIENT_ID}:${accountId}`

export function newDraft(userName = ''): OnboardingDraft {
  return { phase: 'intro', stepIndex: 0, userName, theme: null, businessType: '', database: null, modules: {} }
}

/** Kept in sessionStorage so a refresh mid-onboarding resumes on the same page. */
export function loadDraft(accountId: string): OnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem(key(accountId))
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(accountId: string, draft: OnboardingDraft) {
  try {
    sessionStorage.setItem(key(accountId), JSON.stringify(draft))
  } catch {
    // Not critical: the onboarding just restarts on refresh.
  }
}

export function clearDraft(accountId: string) {
  try {
    sessionStorage.removeItem(key(accountId))
  } catch {
    // Nothing to clear.
  }
}
