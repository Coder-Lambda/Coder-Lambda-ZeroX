/**
 * Sample data for a shareable demo (VITE_DEMO_SEED=1, see `npm run dev:tunnel:seed`): a bakery with a year of
 * history. Written into the visitor's own browser on the first visit (or when the URL has ?dados=novos), and
 * signs them straight in. Never imported by a normal build: main.tsx only loads it behind the flag.
 * All names, numbers and contacts are made up.
 */
import { CLIENT_ID } from '../config/clientRegistry'
import type { ClientConfig } from '../config/types'
import { toDateKey } from '../lib/format'
import type { Absence, Employee, EmployeeLeave, EmployeeNote, Partner, ProductionRecord, Supplier } from '../modules/collaborators/types'
import type { FinAccount, FinCategory, FinEntry, FinTitle } from '../modules/finance/types'
import type { StockMove, StockProduct } from '../modules/stock/types'
import type { RuleBook } from '../rules/types'
import { localDb, readPref, writePref } from './localDb'

const BUSINESS = 'biz_demo_padaria'
const OWNER = 'acc_demo_owner'
const scope = { tenant_id: CLIENT_ID, business_id: BUSINESS }

/** Same "random" numbers for every visitor, so everyone sees the same bakery. */
function generator(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedDemoData() {
  const reset = new URLSearchParams(window.location.search).get('dados') === 'novos'
  if (reset) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('zerox:'))
      .forEach((k) => localStorage.removeItem(k))
    window.history.replaceState(null, '', window.location.pathname)
  }
  // Already seeded in this browser: keep what the visitor did since.
  if (!reset && readPref(`session:${CLIENT_ID}`)) return

  const rand = generator(20261124)
  const between = (min: number, max: number) => min + rand() * (max - min)
  const int = (min: number, max: number) => Math.round(between(min, max))
  const money = (min: number, max: number) => Math.round(between(min, max) * 100) / 100

  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = (offset: number) => toDateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset))
  const stamp = (offset: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 9, 30).toISOString()
  const weekday = (offset: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset).getDay()
  const today = day(0)
  const month = today.slice(0, 7)
  let n = 0
  const id = (prefix: string) => `${prefix}_demo_${(n += 1)}`

  // ── Account and business ──
  localDb.upsert(
    'accounts',
    { id: OWNER, tenant_id: CLIENT_ID, displayName: 'Conta Google (demonstração)', provider: 'google-mock', createdAt: stamp(-400) },
  )

  const rules: RuleBook = {
    collaborators: {
      presenceList: true,
      absenceCharge: 'salaryDay',
      absenceValue: null,
      absenceAlert: 3,
      leaveTypes: [
        { id: 'lvt_maternidade', name: 'Licença-maternidade', days: 120 },
        { id: 'lvt_atestado', name: 'Atestado médico', days: null },
      ],
      production: true,
      productionItems: [
        { id: 'pit_pao', name: 'Pão francês', unit: 'un', kind: 'goal', per: 'employee', daily: 800, monthly: 18000, yearly: null },
        { id: 'pit_bolo', name: 'Bolos', unit: 'un', kind: 'ceiling', per: 'team', daily: 30, monthly: 700, yearly: null },
      ],
    },
    personalFinance: {
      alarms: [
        { id: 'fal_casa', name: 'Contas da casa', kind: 'payable', match: '', daysBefore: 5 },
        { id: 'fal_reembolso', name: 'Reembolsos', kind: 'receivable', match: 'reembolso', daysBefore: 7 },
      ],
    },
    businessFinance: {
      payRules: [
        { id: 'pay_vt', name: 'Vale-transporte', kind: 'discount', mode: 'percent', value: 6, employeeIds: [] },
        { id: 'pay_bonus', name: 'Bônus de produção', kind: 'add', mode: 'fixed', value: 150, employeeIds: ['emp_mariana', 'emp_joao'] },
      ],
      moneyAlarms: [
        { id: 'mal_caixa', name: 'Caixa baixo', metric: 'balance', when: 'below', value: 10000 },
        { id: 'mal_meta', name: 'Meta de vendas do mês', metric: 'revenue', when: 'above', value: 45000 },
      ],
    },
    stock: {
      units: [{ id: 'unt_bandeja', name: 'Bandeja', abbr: 'bdj' }],
      itemValue: true,
      fields: [
        { id: 'fld_validade', name: 'Validade', type: 'date' },
        { id: 'fld_lote', name: 'Lote', type: 'text' },
      ],
    },
    dashboard: { slots: ['widget', 'widget', 'widget', 'widget', 'widget', 'widget', 'widget', 'chart', 'chart'] },
    mainDashboard: {
      pages: [
        { name: 'Visão geral', slots: ['widget', 'widget', 'widget', 'widget', 'widget', 'chart', 'chart'] },
        { name: 'Equipe e finanças', slots: ['widget', 'widget', 'widget', 'widget', 'widget', 'chart', 'chart'] },
        { name: 'Estoque', slots: ['widget', 'widget', 'widget', 'widget', 'widget', 'chart', 'chart'] },
      ],
    },
    custom: { entregas: { perKm: 2.5, maxKm: 25 } },
  }

  const config: ClientConfig = {
    clientId: CLIENT_ID,
    businessId: BUSINESS,
    ownerAccountId: OWNER,
    userName: 'Carlos',
    theme: 'dolphin',
    businessType: 'Padaria Bom Grão',
    database: { hasExisting: false, provider: null },
    modules: {
      dashboard: true,
      collaborators: true,
      personalFinance: true,
      stock: true,
      businessFinance: true,
      mainDashboard: true,
      setAsWish: true,
    },
    layout: {
      widgets: {
        collaborators: { widgets: [{ uid: 'wdg_s1', type: 'collab.production', kind: 'widget', period: 'daily', itemId: 'pit_pao' }], charts: [] },
        personalFinance: { widgets: [{ uid: 'wdg_s2', type: 'personal.result', kind: 'widget', period: 'monthly' }], charts: [] },
        businessFinance: { widgets: [{ uid: 'wdg_s3', type: 'business.result', kind: 'widget', period: 'daily' }], charts: [] },
        stock: {
          widgets: [
            { uid: 'wdg_s4', type: 'stock.fluctuation', kind: 'widget', period: 'daily' },
            { uid: 'wdg_s5', type: 'demo.deliveries', kind: 'widget' },
          ],
          charts: [],
        },
      },
    },
    labels: {},
    rules,
    wishes: [
      { id: 'wish_1', kind: 'part', text: 'Agenda de encomendas de bolos, com cliente, sabor e data de retirada.', createdAt: stamp(-30) },
      { id: 'wish_2', kind: 'rule', text: 'Comissão de 2% para as atendentes em cada encomenda.', createdAt: stamp(-12) },
    ],
    createdAt: stamp(-400),
  }
  localDb.upsert('client_configs', { id: BUSINESS, ...scope, owner_account_id: OWNER, config })

  // ── Colaboradores ──
  const people: [string, string, number, Employee['status'], number, string][] = [
    ['emp_mariana', 'Mariana Alves', 2600, 'active', -390, '1988-03-14'],
    ['emp_joao', 'João Pereira', 2400, 'active', -380, '1992-07-02'],
    ['emp_rafael', 'Rafael Souza', 2300, 'active', -300, '1995-11-21'],
    ['emp_beatriz', 'Beatriz Santos', 1900, 'active', -260, '1997-01-30'],
    ['emp_lucas', 'Lucas Oliveira', 1850, 'active', -200, '2000-09-09'],
    ['emp_fernanda', 'Fernanda Costa', 2100, 'vacation', -170, '1990-05-17'],
    ['emp_camila', 'Camila Rocha', 1750, 'active', -95, '2001-12-03'],
    ['emp_pedro', 'Pedro Lima', 1800, 'inactive', -330, '1999-04-25'],
  ]
  const employees: Employee[] = people.map(([eid, name, salary, status, hired, birthday], i) => ({
    id: eid,
    ...scope,
    name,
    phone: `(12) 9${String(8100 + i * 37).padStart(4, '0')}-${String(2200 + i * 113).padStart(4, '0')}`,
    email: `${name.split(' ')[0].toLowerCase()}@exemplo.com`,
    pixKey: `${name.split(' ')[0].toLowerCase()}@exemplo.com`,
    birthday,
    salary,
    registered: i < 6,
    status,
    removedOn: status === 'inactive' ? day(-50) : null,
    source: 'manual',
    createdAt: stamp(hired),
  }))
  localDb.insertMany('employees', employees)

  const leaves: EmployeeLeave[] = [
    { id: 'lv_1', ...scope, employee_id: 'emp_beatriz', typeId: 'lvt_maternidade', typeName: 'Licença-maternidade', start: day(-40), end: day(79), note: '', createdAt: stamp(-41) },
    { id: 'lv_2', ...scope, employee_id: 'emp_rafael', typeId: 'lvt_atestado', typeName: 'Atestado médico', start: day(-20), end: day(-19), note: 'Gripe', createdAt: stamp(-20) },
  ]
  localDb.insertMany('employee_leaves', leaves)

  const absences: Absence[] = []
  const working = employees.filter((e) => e.status !== 'inactive')
  for (let offset = -120; offset < 0; offset += 1) {
    if (weekday(offset) === 0) continue
    for (const e of working) {
      if (e.createdAt > stamp(offset)) continue
      if (rand() < 0.025) absences.push({ id: id('abs'), ...scope, employee_id: e.id, date: day(offset) })
    }
  }
  absences.push({ id: id('abs'), ...scope, employee_id: 'emp_rafael', date: day(-20) })
  // Lucas reaches the rule book's alert (3 absences this month).
  for (let k = 1; k <= Math.min(3, base.getDate() - 1); k += 1) {
    absences.push({ id: id('abs'), ...scope, employee_id: 'emp_lucas', date: `${month}-${String(k).padStart(2, '0')}` })
  }
  localDb.insertMany('absences', absences)

  const notes: EmployeeNote[] = [
    { id: 'note_1', ...scope, employee_id: 'emp_lucas', kind: 'warning', date: day(-9), text: 'Atrasos repetidos na abertura da loja.', createdAt: stamp(-9) },
    { id: 'note_2', ...scope, employee_id: 'emp_rafael', kind: 'incident', date: day(-33), text: 'Queimadura leve no forno; atendido e liberado.', createdAt: stamp(-33) },
  ]
  localDb.insertMany('employee_notes', notes)

  const partners: Partner[] = [
    { id: 'ptn_1', ...scope, name: 'Café Serra Alta', email: 'contato@exemplo.com', phone: '(12) 3301-4400', pixKey: '', summary: 'Fornece o café da loja e divide a vitrine nos fins de semana.', sections: [], createdAt: stamp(-200) },
    { id: 'ptn_2', ...scope, name: 'Feira do Produtor', email: 'feira@exemplo.com', phone: '(12) 3302-1188', pixKey: '', summary: 'Banca de pães aos sábados.', sections: [], createdAt: stamp(-150) },
  ]
  localDb.insertMany('partners', partners)
  const suppliers: Supplier[] = [
    { id: 'sup_1', ...scope, name: 'Moinho Vale Verde', email: 'vendas@exemplo.com', phone: '(12) 3200-1010', pixKey: '', supplies: 'Farinha de trigo e fermento', monthlyAmount: 4800, sections: [], createdAt: stamp(-380) },
    { id: 'sup_2', ...scope, name: 'Laticínios Boa Vista', email: 'pedidos@exemplo.com', phone: '(12) 3200-2020', pixKey: '', supplies: 'Leite, manteiga e ovos', monthlyAmount: 3100, sections: [], createdAt: stamp(-360) },
    { id: 'sup_3', ...scope, name: 'Embala Fácil', email: 'atendimento@exemplo.com', phone: '(12) 3200-3030', pixKey: '', supplies: 'Sacos e caixas', monthlyAmount: 600, sections: [], createdAt: stamp(-300) },
  ]
  localDb.insertMany('suppliers', suppliers)

  const production: ProductionRecord[] = []
  for (let offset = -120; offset <= 0; offset += 1) {
    if (weekday(offset) === 0) continue
    for (const baker of ['emp_mariana', 'emp_joao']) {
      production.push({ id: id('prod'), ...scope, employee_id: baker, itemId: 'pit_pao', date: day(offset), quantity: int(640, 960) })
    }
    production.push({ id: id('prod'), ...scope, employee_id: 'emp_rafael', itemId: 'pit_pao', date: day(offset), quantity: int(300, 520) })
    production.push({ id: id('prod'), ...scope, employee_id: 'emp_rafael', itemId: 'pit_bolo', date: day(offset), quantity: int(12, 24) })
    production.push({ id: id('prod'), ...scope, employee_id: 'emp_mariana', itemId: 'pit_bolo', date: day(offset), quantity: int(3, 10) })
  }
  localDb.insertMany('production_records', production)

  // ── Estoque ──
  type Spec = { pid: string; name: string; unit: string; price: number; min: number; start: number; use: [number, number]; every: number; restock: [number, number]; pause?: number; extra?: Record<string, string> }
  const specs: Spec[] = [
    { pid: 'prd_farinha', name: 'Farinha de trigo', unit: 'kg', price: 4.2, min: 80, start: 320, use: [18, 32], every: 1, restock: [250, 350], extra: { fld_validade: day(60), fld_lote: 'MV-2311' } },
    { pid: 'prd_acucar', name: 'Açúcar', unit: 'kg', price: 4.9, min: 30, start: 120, use: [3, 9], every: 2, restock: [90, 140] },
    { pid: 'prd_fermento', name: 'Fermento biológico', unit: 'kg', price: 28, min: 5, start: 18, use: [0.4, 1], every: 2, restock: [12, 18] },
    { pid: 'prd_ovos', name: 'Ovos', unit: 'cx', price: 18, min: 10, start: 40, use: [1, 3], every: 1, restock: [30, 45], extra: { fld_validade: day(12) } },
    { pid: 'prd_leite', name: 'Leite', unit: 'L', price: 5.2, min: 40, start: 160, use: [8, 15], every: 1, restock: [120, 180] },
    { pid: 'prd_manteiga', name: 'Manteiga', unit: 'kg', price: 42, min: 8, start: 26, use: [0.6, 1.6], every: 1, restock: [20, 30], pause: 14, extra: { fld_validade: day(25), fld_lote: 'BV-0907' } },
    { pid: 'prd_paoqueijo', name: 'Pão de queijo congelado', unit: 'bdj', price: 12, min: 15, start: 60, use: [3, 8], every: 1, restock: [50, 70] },
    { pid: 'prd_embalagem', name: 'Sacos de papel', unit: 'pct', price: 9.5, min: 20, start: 80, use: [1, 4], every: 1, restock: [60, 90], pause: 25 },
  ]
  const suppliersOf: Record<string, string> = {
    prd_farinha: 'Moinho Vale Verde',
    prd_fermento: 'Moinho Vale Verde',
    prd_acucar: 'Atacadão Centro',
    prd_ovos: 'Laticínios Boa Vista',
    prd_leite: 'Laticínios Boa Vista',
    prd_manteiga: 'Laticínios Boa Vista',
    prd_paoqueijo: 'Congelados Minas',
    prd_embalagem: 'Embala Fácil',
  }
  const products: StockProduct[] = specs.map((s) => ({
    id: s.pid,
    ...scope,
    name: s.name,
    code: '',
    unit: s.unit,
    initialQuantity: s.start,
    minQuantity: s.min,
    unitPrice: s.price,
    extra: s.extra ?? {},
    createdAt: stamp(-365),
  }))
  localDb.insertMany('stock_products', products)

  const moves: StockMove[] = []
  const round3 = (v: number) => Math.round(v * 1000) / 1000
  for (const s of specs) {
    let qty = s.start
    for (let offset = -364; offset <= 0; offset += 1) {
      if (weekday(offset) === 0) continue
      const restocking = qty <= s.min * 1.3 && !(s.pause && offset > -s.pause)
      if (restocking) {
        const amount = int(s.restock[0], s.restock[1])
        qty = round3(qty + amount)
        moves.push({
          id: id('mv'),
          ...scope,
          productId: s.pid,
          type: 'in',
          quantity: amount,
          date: day(offset),
          description: 'Reposição',
          party: suppliersOf[s.pid],
          price: Math.round(amount * s.price * 0.92 * 100) / 100,
          createdAt: stamp(offset),
        })
      }
      if ((offset + 364) % s.every !== 0) continue
      const want = round3(between(s.use[0], s.use[1]))
      const used = round3(Math.min(qty, s.unit === 'cx' || s.unit === 'bdj' || s.unit === 'pct' ? Math.round(want) : want))
      if (used <= 0) continue
      qty = round3(qty - used)
      moves.push({
        id: id('mv'),
        ...scope,
        productId: s.pid,
        type: 'out',
        quantity: used,
        date: day(offset),
        description: '',
        party: s.pid === 'prd_paoqueijo' || s.pid === 'prd_embalagem' ? 'Venda no balcão' : 'Produção',
        price: null,
        createdAt: stamp(offset),
      })
    }
  }
  localDb.insertMany('stock_moves', moves)

  // ── Finanças da empresa ──
  const businessAccounts: FinAccount[] = [
    { id: 'acc_bb', ...scope, book: 'business', name: 'Banco do Brasil', initialBalance: 18000, createdAt: stamp(-400) },
    { id: 'acc_caixa', ...scope, book: 'business', name: 'Caixa da loja', initialBalance: 1500, createdAt: stamp(-400) },
    { id: 'acc_nubank', ...scope, book: 'personal', name: 'Nubank', initialBalance: 4000, createdAt: stamp(-400) },
    { id: 'acc_poupanca', ...scope, book: 'personal', name: 'Poupança', initialBalance: 12000, createdAt: stamp(-400) },
  ]
  localDb.insertMany('fin_accounts', businessAccounts)

  const label = (type: 'in' | 'out', name: string, description: string, origin: string): FinCategory => ({
    id: id('cat'),
    ...scope,
    book: 'business',
    type,
    name,
    description,
    origin,
    createdAt: stamp(-400),
  })
  localDb.insertMany('fin_categories', [
    label('in', 'Vendas no balcão', 'Pães, bolos e café vendidos na loja', 'Clientes da loja'),
    label('in', 'Encomendas', 'Bolos e salgados sob encomenda', 'Clientes de encomenda'),
    label('out', 'Aluguel', 'Ponto da loja', 'Imobiliária Centro'),
    label('out', 'Energia', 'Fornos, câmara fria e iluminação', 'Distribuidora de energia'),
    label('out', 'Impostos', 'Simples Nacional', 'Receita Federal'),
    label('out', 'Manutenção', 'Fornos e equipamentos', 'Assistência técnica'),
  ])

  const entries: FinEntry[] = []
  const entry = (book: FinEntry['book'], accountId: string, type: FinEntry['type'], amount: number, offset: number, description: string, category: string, party = '', extra: Partial<FinEntry> = {}) =>
    entries.push({ id: id('en'), ...scope, book, accountId, type, amount, date: day(offset), description, category, titleId: null, party, source: null, sourceRef: null, createdAt: stamp(offset), ...extra })

  const sales = new Map<string, number>()
  for (let offset = -364; offset <= 0; offset += 1) {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset)
    const dom = date.getDate()
    const key = day(offset).slice(0, 7)
    if (weekday(offset) !== 0) {
      const amount = money(1150, 2000) * (weekday(offset) === 6 ? 1.3 : 1)
      const rounded = Math.round(amount * 100) / 100
      sales.set(key, (sales.get(key) ?? 0) + rounded)
      entry('business', rand() < 0.75 ? 'acc_bb' : 'acc_caixa', 'in', rounded, offset, 'Vendas do dia', 'Vendas no balcão', 'Clientes da loja')
    }
    if (weekday(offset) === 5) entry('business', 'acc_bb', 'in', money(200, 700), offset, 'Encomendas da semana', 'Encomendas', 'Clientes de encomenda')
    if (dom === 5) entry('business', 'acc_bb', 'out', 3500, offset, 'Aluguel da loja', 'Aluguel', 'Imobiliária Centro')
    if (dom === 5) entry('business', 'acc_bb', 'out', 8500, offset, 'Pró-labore do Carlos', 'Pró-labore', 'Carlos')
    if (dom === 12) entry('business', 'acc_bb', 'out', money(1100, 1650), offset, 'Conta de energia', 'Energia', 'Distribuidora de energia')
    if (dom === 20 && offset < -1) {
      const previous = toDateKey(new Date(date.getFullYear(), date.getMonth() - 1, 1)).slice(0, 7)
      const tax = Math.round((sales.get(previous) ?? 40000) * 0.06 * 100) / 100
      entry('business', 'acc_bb', 'out', tax, offset, 'DAS do Simples', 'Impostos', 'Receita Federal')
    }
    if (dom === 15 && rand() < 0.3) entry('business', 'acc_bb', 'out', money(250, 900), offset, 'Manutenção do forno', 'Manutenção', 'Assistência técnica')
    // Payroll of the previous month, paid on the 5th (the current month stays to pay).
    if (dom === 5 && offset > -360) {
      const paidMonth = toDateKey(new Date(date.getFullYear(), date.getMonth() - 1, 1)).slice(0, 7)
      const payroll = working.reduce((sum, e) => sum + (e.salary ?? 0), 0) * 0.97
      entry('business', 'acc_bb', 'out', Math.round(payroll * 100) / 100, offset, `Folha de pagamento · ${paidMonth}`, 'Funcionários', '', { source: 'payroll', sourceRef: paidMonth })
    }
  }
  // Stock receipts are paid a few days later, except the most recent ones.
  for (const move of moves.filter((m) => m.type === 'in' && (m.price ?? 0) > 0 && m.date < day(-6))) {
    const [y, m, d] = move.date.split('-').map(Number)
    const paidOn = toDateKey(new Date(y, m - 1, d + 3))
    const offset = Math.round((new Date(y, m - 1, d + 3).getTime() - base.getTime()) / 86_400_000)
    if (paidOn > today) continue
    const product = products.find((p) => p.id === move.productId)
    entry('business', 'acc_bb', 'out', move.price ?? 0, offset, `${product?.name ?? ''} · ${move.quantity} ${product?.unit ?? ''}`, 'Compras de estoque', move.party, {
      source: 'stock',
      sourceRef: move.id,
    })
  }

  // ── Finanças pessoais ──
  for (let offset = -364; offset <= 0; offset += 1) {
    const dom = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset).getDate()
    if (dom === 5) entry('personal', 'acc_nubank', 'in', 8500, offset, 'Pró-labore', 'Pró-labore')
    if (dom === 10) entry('personal', 'acc_nubank', 'out', 2200, offset, 'Aluguel do apartamento', 'Moradia')
    if (dom === 8) entry('personal', 'acc_nubank', 'out', 920, offset, 'Mensalidade da escola', 'Educação')
    if (dom === 3) entry('personal', 'acc_nubank', 'out', 650, offset, 'Plano de saúde', 'Saúde')
    if (dom === 15) entry('personal', 'acc_nubank', 'out', money(1600, 2200), offset, 'Fatura do cartão', 'Cartão')
    if (weekday(offset) === 6) entry('personal', 'acc_nubank', 'out', money(260, 480), offset, 'Mercado', 'Alimentação')
    if (weekday(offset) === 3 && rand() < 0.5) entry('personal', 'acc_nubank', 'out', money(180, 300), offset, 'Combustível', 'Transporte')
    if (weekday(offset) === 0 && rand() < 0.35) entry('personal', 'acc_nubank', 'out', money(80, 260), offset, 'Restaurante', 'Lazer')
    if (dom === 6) entry('personal', 'acc_poupanca', 'in', 600, offset, 'Aplicação mensal', 'Investimentos')
  }
  localDb.insertMany('fin_entries', entries)

  const title = (kind: FinTitle['kind'], description: string, amount: number, due: number, category: string): FinTitle => ({
    id: id('tit'),
    ...scope,
    book: 'personal',
    kind,
    description,
    amount,
    dueDate: day(due),
    category,
    paidOn: null,
    entryId: null,
    createdAt: stamp(-15),
  })
  localDb.insertMany('fin_titles', [
    title('payable', 'Conta de luz', 236.4, 2, 'Moradia'),
    title('payable', 'Internet', 119.9, 9, 'Moradia'),
    title('payable', 'Cartão de crédito', 1984.5, -3, 'Cartão'),
    title('payable', 'IPVA (parcela)', 486.0, 24, 'Transporte'),
    title('receivable', 'Reembolso do plano de saúde', 380.0, 6, 'Saúde'),
  ])

  writePref(`session:${CLIENT_ID}`, OWNER)
  writePref(`active-business:${CLIENT_ID}:${OWNER}`, BUSINESS)
}
