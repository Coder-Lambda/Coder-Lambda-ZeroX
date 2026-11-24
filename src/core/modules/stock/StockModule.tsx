import { useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ChartNoAxesColumn, PackagePlus, PackageMinus, Plus } from 'lucide-react'
import { ExtensionTabLinks, extensionTabRoutes, useExtensionTabs } from '../../extensions/ExtensionTabs'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { todayKey } from '../../lib/format'
import { ConfirmDialog, Dialog } from '../../ui/Dialog'
import { toast } from '../../ui/Toaster'
import { MoveForm } from './MoveForm'
import { MovesList } from './MovesList'
import { ProductDetail } from './ProductDetail'
import { ProductForm } from './ProductForm'
import { ProductsList } from './ProductsList'
import { StockContext, type StockContextValue, type StockDialog } from './StockContext'
import { StockOverview } from './StockOverview'
import { deleteMove, quantities, useStock } from './store'
import './stock.css'
import { WidgetStrip } from '../../widgets/WidgetGrid'

const BASE = '/estoque'
const TABS = [
  { id: 'general', path: 'geral' },
  { id: 'received', path: 'recebidos' },
  { id: 'sent', path: 'enviados' },
] as const

export default function StockModule() {
  const data = useStock()
  const today = todayKey()
  const { pathname } = useLocation()
  const segment = pathname.split('/')[2]
  const [dialog, setDialog] = useState<StockDialog | null>(null)
  // A client can order extra compartments for this navbar (set-as-wish); they come from its extension.
  const { tabs: extraTabs, loading } = useExtensionTabs('stock')

  const value = useMemo<StockContextValue>(
    () => ({ data, qty: quantities(data), today, open: setDialog }),
    [data, today],
  )

  const section = segment === 'recebidos' ? 'received' : segment === 'enviados' ? 'sent' : segment === 'geral' ? 'general' : null
  const add =
    section === 'general'
      ? { label: t.stock.add.general, icon: Plus, onClick: () => setDialog({ type: 'product' }) }
      : section === 'received'
        ? { label: t.stock.add.received, icon: PackagePlus, onClick: () => setDialog({ type: 'move', moveType: 'in' }) }
        : section === 'sent'
          ? { label: t.stock.add.sent, icon: PackageMinus, onClick: () => setDialog({ type: 'move', moveType: 'out' }) }
          : null

  const editingMove = dialog?.type === 'move' ? dialog.move : undefined

  return (
    <StockContext.Provider value={value}>
      <PageHead title={t.modules.stock.label} sub={t.modules.stock.description} />

      <div className="module-nav glass">
        <nav className="module-tabs" aria-label={t.modules.stock.label}>
          {TABS.map((tab) => (
            <NavLink key={tab.id} to={`${BASE}/${tab.path}`} className="module-tab tactile">
              {t.stock.tabs[tab.id]}
            </NavLink>
          ))}
          <ExtensionTabLinks base={BASE} tabs={extraTabs} />
        </nav>
        <div className="module-actions">
          <NavLink to={`${BASE}/visao-geral`} className="btn btn-secondary tactile stock-overview-link" aria-label={t.stock.overview}>
            <ChartNoAxesColumn />
            <span className="module-action-label">{t.stock.overview}</span>
            <span className="module-action-short">{t.stock.overview}</span>
          </NavLink>
          {add && (
            <button type="button" className="btn btn-primary tactile" aria-label={add.label} onClick={add.onClick}>
              <add.icon />
              <span className="module-action-label">{add.label}</span>
              <span className="module-action-short">{t.collab.addShort}</span>
            </button>
          )}
        </div>
      </div>

      <WidgetStrip place="stock" />

      <Routes>
        <Route index element={<Navigate to="geral" replace />} />
        <Route path="geral" element={<ProductsList />} />
        <Route path="geral/:id" element={<ProductDetail />} />
        <Route path="recebidos" element={<MovesList type="in" />} />
        <Route path="enviados" element={<MovesList type="out" />} />
        <Route path="visao-geral" element={<StockOverview />} />
        {extensionTabRoutes(extraTabs)}
        {!loading && <Route path="*" element={<Navigate to="geral" replace />} />}
      </Routes>

      <Dialog open={dialog?.type === 'product'} onClose={() => setDialog(null)} title={dialog?.type === 'product' && dialog.product ? t.stock.product.editTitle : t.stock.product.newTitle}>
        {dialog?.type === 'product' && <ProductForm product={dialog.product} onDone={() => setDialog(null)} />}
      </Dialog>
      <Dialog
        open={dialog?.type === 'move'}
        onClose={() => setDialog(null)}
        title={
          dialog?.type !== 'move'
            ? ''
            : dialog.moveType === 'in'
              ? editingMove
                ? t.stock.moves.editIn
                : t.stock.moves.newIn
              : editingMove
                ? t.stock.moves.editOut
                : t.stock.moves.newOut
        }
      >
        {dialog?.type === 'move' && (
          <MoveForm type={dialog.moveType} move={dialog.move} productId={dialog.productId} onDone={() => setDialog(null)} />
        )}
      </Dialog>
      <ConfirmDialog
        open={dialog?.type === 'adjustment'}
        onClose={() => setDialog(null)}
        title={t.stock.moves.deleteTitle}
        message={t.stock.moves.deleteMessage}
        confirmLabel={t.common.delete}
        danger
        onConfirm={() => {
          if (dialog?.type !== 'adjustment') return
          deleteMove(dialog.move)
          toast(t.stock.moves.deleted)
        }}
      />
    </StockContext.Provider>
  )
}
