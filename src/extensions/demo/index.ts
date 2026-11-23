import { lazy } from 'react'
import { Sparkles, Truck } from 'lucide-react'
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
  moduleTabs: {
    stock: [
      {
        path: 'rotas',
        label: 'Rotas do caminhão',
        icon: Truck,
        Component: lazy(() => import('./TruckRoutes')),
      },
    ],
  },
  widgets: {},
  labels: {},
}

export default extension
