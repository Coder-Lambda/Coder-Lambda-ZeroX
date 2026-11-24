import { t } from '../i18n/pt-BR'
import type { FinanceBook } from '../modules/finance/types'
import {
  AbsencesWidget,
  HeadcountWidget,
  ProductionWidget,
  SalariesWidget,
  TeamWidget,
} from './kinds/collaborators'
import {
  BalanceTrendWidget,
  BalanceWidget,
  ExpensesWidget,
  ExtraCostsWidget,
  FlowsWidget,
  PayrollWidget,
  ResultWidget,
  StockSoldWidget,
} from './kinds/finance'
import {
  AvailabilityWidget,
  MonthRecordWidget,
  RankingWidget,
  StockFluctuationWidget,
  StockMovesWidget,
  StockTodayWidget,
} from './kinds/stock'
import type { WidgetContext, WidgetDef, WidgetPlace } from './types'

const D: WidgetPlace = 'dashboard'
const M: WidgetPlace = 'mainDashboard'

const needsModule = (module: keyof WidgetContext['modules']) => (ctx: WidgetContext) =>
  ctx.modules[module] ? null : t.widgets.unavailable.module(t.modules[module].label)

const both = (...checks: ((ctx: WidgetContext) => string | null)[]) => (ctx: WidgetContext) =>
  checks.map((check) => check(ctx)).find(Boolean) ?? null

const presence = (ctx: WidgetContext) => (ctx.rules.collaborators.presenceList ? null : t.widgets.unavailable.presence)
const production = (ctx: WidgetContext) =>
  ctx.rules.collaborators.production && ctx.rules.collaborators.productionItems.length > 0
    ? null
    : t.widgets.unavailable.production

function financeWidgets(book: FinanceBook): WidgetDef[] {
  const source = book === 'personal' ? 'personalFinance' : 'businessFinance'
  const unavailable = needsModule(source)
  return [
    { type: `${book}.balance`, source, kinds: ['widget'], places: [D, M], unavailable, render: (p) => <BalanceWidget {...p} book={book} /> },
    { type: `${book}.flows`, source, kinds: ['widget'], places: [D, M], periodic: true, unavailable, render: (p) => <FlowsWidget {...p} book={book} /> },
    {
      type: `${book}.result`,
      source,
      kinds: ['widget', 'chart'],
      places: [source, D, M],
      periodic: true,
      unavailable,
      render: (p) => <ResultWidget {...p} book={book} />,
    },
    {
      type: `${book}.balanceTrend`,
      source,
      kinds: ['chart', 'widget'],
      places: [D, M],
      periodic: true,
      unavailable,
      render: (p) => <BalanceTrendWidget {...p} book={book} />,
    },
  ]
}

/**
 * Every widget ZeroX offers. The dashboard takes the everyday ones; the main dashboard takes all of them
 * ("the dashboard's, extended"); a module strip only takes its own fluctuation widget.
 */
export const WIDGETS: WidgetDef[] = [
  // Colaboradores
  { type: 'collab.team', source: 'collaborators', kinds: ['widget'], places: [D, M], unavailable: needsModule('collaborators'), render: (p) => <TeamWidget {...p} /> },
  {
    type: 'collab.absences',
    source: 'collaborators',
    kinds: ['widget', 'chart'],
    places: [D, M],
    periodic: true,
    unavailable: both(needsModule('collaborators'), presence),
    render: (p) => <AbsencesWidget {...p} />,
  },
  {
    type: 'collab.production',
    source: 'collaborators',
    kinds: ['widget', 'chart'],
    places: ['collaborators', D, M],
    periodic: true,
    itemOption: true,
    unavailable: both(needsModule('collaborators'), production),
    render: (p) => <ProductionWidget {...p} />,
  },
  {
    type: 'collab.headcount',
    source: 'collaborators',
    kinds: ['widget', 'chart'],
    places: [M],
    periodic: true,
    unavailable: needsModule('collaborators'),
    render: (p) => <HeadcountWidget {...p} />,
  },
  { type: 'collab.salaries', source: 'collaborators', kinds: ['widget'], places: [M], unavailable: needsModule('collaborators'), render: (p) => <SalariesWidget {...p} /> },

  // Finanças pessoais e da empresa
  ...financeWidgets('personal'),
  {
    type: 'personal.expenses',
    source: 'personalFinance',
    kinds: ['widget', 'chart'],
    places: [M],
    unavailable: needsModule('personalFinance'),
    render: (p) => <ExpensesWidget {...p} />,
  },
  ...financeWidgets('business'),
  {
    type: 'business.payroll',
    source: 'businessFinance',
    kinds: ['widget'],
    places: [M],
    unavailable: both(needsModule('businessFinance'), needsModule('collaborators')),
    render: (p) => <PayrollWidget {...p} />,
  },
  {
    type: 'business.stockSold',
    source: 'businessFinance',
    kinds: ['widget'],
    places: [M],
    unavailable: both(needsModule('businessFinance'), needsModule('stock')),
    render: (p) => <StockSoldWidget {...p} />,
  },
  {
    type: 'business.extraCosts',
    source: 'businessFinance',
    kinds: ['widget', 'chart'],
    places: [M],
    unavailable: needsModule('businessFinance'),
    render: (p) => <ExtraCostsWidget {...p} />,
  },

  // Estoque
  { type: 'stock.today', source: 'stock', kinds: ['widget'], places: [D, M], unavailable: needsModule('stock'), render: (p) => <StockTodayWidget {...p} /> },
  {
    type: 'stock.fluctuation',
    source: 'stock',
    kinds: ['widget', 'chart'],
    places: ['stock', D, M],
    periodic: true,
    unavailable: needsModule('stock'),
    render: (p) => <StockFluctuationWidget {...p} />,
  },
  { type: 'stock.sent', source: 'stock', kinds: ['widget'], places: [D, M], periodic: true, unavailable: needsModule('stock'), render: (p) => <StockMovesWidget {...p} type="out" /> },
  { type: 'stock.received', source: 'stock', kinds: ['widget'], places: [D, M], periodic: true, unavailable: needsModule('stock'), render: (p) => <StockMovesWidget {...p} type="in" /> },
  { type: 'stock.availability', source: 'stock', kinds: ['widget'], places: [M], unavailable: needsModule('stock'), render: (p) => <AvailabilityWidget {...p} /> },
  { type: 'stock.mostSold', source: 'stock', kinds: ['widget', 'chart'], places: [M], unavailable: needsModule('stock'), render: (p) => <RankingWidget {...p} order="most" /> },
  { type: 'stock.leastSold', source: 'stock', kinds: ['widget', 'chart'], places: [M], unavailable: needsModule('stock'), render: (p) => <RankingWidget {...p} order="least" /> },
  { type: 'stock.bestMonth', source: 'stock', kinds: ['widget'], places: [M], unavailable: needsModule('stock'), render: (p) => <MonthRecordWidget {...p} order="best" /> },
  { type: 'stock.worstMonth', source: 'stock', kinds: ['widget'], places: [M], unavailable: needsModule('stock'), render: (p) => <MonthRecordWidget {...p} order="worst" /> },
]

export const widgetDef = (type: string) => WIDGETS.find((d) => d.type === type)

/** Widgets offered in a place, and the kinds each can take there (module strips only hold small widgets). */
export function offeredIn(place: WidgetPlace) {
  return WIDGETS.filter((d) => d.places.includes(place)).map((d) => ({
    def: d,
    kinds: place === 'dashboard' || place === 'mainDashboard' ? d.kinds : d.kinds.filter((k) => k === 'widget'),
  }))
}
