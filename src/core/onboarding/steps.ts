import { MODULE_IDS, type ModuleId } from '../config/types'

export type Step =
  | { kind: 'name' }
  | { kind: 'theme' }
  | { kind: 'business' }
  | { kind: 'database' }
  | { kind: 'module'; module: ModuleId }
  | { kind: 'welcome' }

/** 12 pages when the client has every module; modules it can't use are not asked about. */
export function buildSteps(availableModules: ModuleId[]): Step[] {
  return [
    { kind: 'name' },
    { kind: 'theme' },
    { kind: 'business' },
    { kind: 'database' },
    ...MODULE_IDS.filter((id) => availableModules.includes(id)).map((module) => ({ kind: 'module' as const, module })),
    { kind: 'welcome' },
  ]
}
