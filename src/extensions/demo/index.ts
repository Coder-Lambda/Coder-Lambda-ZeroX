import { createElement, lazy } from 'react'
import { CalendarClock, MapPinned, Sparkles, Truck } from 'lucide-react'
import type { ClientExtension } from '../../core/extensions/types'
import { DeliveriesWidget } from './DeliveriesWidget'

/**
 * Demo client's set-as-wish parts: one example of each thing a client can order (a new part, compartments
 * inside modules, a rule book chapter, a widget). Only the demo build contains this folder.
 */
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
    collaborators: [
      {
        path: 'escalas',
        label: 'Escalas',
        icon: CalendarClock,
        Component: lazy(() => import('./Shifts')),
      },
    ],
    stock: [
      {
        path: 'rotas',
        label: 'Rotas do caminhão',
        icon: Truck,
        Component: lazy(() => import('./TruckRoutes')),
      },
    ],
  },
  ruleChapters: [
    {
      id: 'entregas',
      title: 'Entregas',
      sub: 'Regras de entrega pedidas pelo cliente Demonstração.',
      icon: MapPinned,
      Component: lazy(() => import('./DeliveryRules')),
    },
  ],
  widgets: [
    {
      type: 'demo.deliveries',
      title: 'Entregas de hoje',
      description: 'Entregas do dia e a regra de frete do Livro de regras.',
      kinds: ['widget'],
      places: ['dashboard', 'mainDashboard', 'stock'],
      render: (props) => createElement(DeliveriesWidget, props),
    },
  ],
  labels: {},
}

export default extension
