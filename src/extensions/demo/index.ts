import { lazy } from 'react'
import { Sparkles } from 'lucide-react'
import type { ClientExtension } from '../../core/extensions/types'

/** Demo client's exclusive code. Only the demo build contains this folder. */
const extension: ClientExtension = {
  clientId: 'demo',
  routes: [
    {
      path: 'painel-exclusivo',
      label: 'Painel exclusivo',
      icon: Sparkles,
      Component: lazy(() => import('./ExclusivePanel')),
    },
  ],
  widgets: {},
  labels: {},
}

export default extension
