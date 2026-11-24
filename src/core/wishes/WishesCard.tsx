import { useState } from 'react'
import { Plus, WandSparkles } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import type { WishKind } from '../config/types'
import { newId } from '../data/localDb'
import { useActiveExtension } from '../extensions/useClientExtension'
import { t } from '../i18n/pt-BR'
import { formatDateTime } from '../lib/format'
import { haptic } from '../lib/haptic'
import { Dialog } from '../ui/Dialog'
import { toast } from '../ui/Toaster'
import { WishFields } from './WishFields'

/**
 * Configurações › Set-as-wish: what the ZeroX team already built only for this client, and the client's
 * requests for more (new parts, compartments, rules).
 */
export function WishesCard() {
  const { active, updateActive } = useSession()
  const extension = useActiveExtension()
  const [asking, setAsking] = useState(false)
  const [kind, setKind] = useState<WishKind>('part')
  const [text, setText] = useState('')
  if (!active) return null
  const copy = t.wishes
  const wishes = [...(active.wishes ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const ext = extension.status === 'ready' ? extension.extension : null
  const built = ext
    ? [
        ...ext.routes.map((r) => ({ kind: copy.kinds.part, name: r.label })),
        ...Object.entries(ext.moduleTabs ?? {}).flatMap(([module, tabs]) =>
          (tabs ?? []).map((tab) => ({ kind: copy.kinds.compartment, name: `${t.modules[module as keyof typeof t.modules].label} › ${tab.label}` })),
        ),
        ...(ext.ruleChapters ?? []).map((c) => ({ kind: copy.kinds.rule, name: c.title })),
        ...(ext.widgets ?? []).map((w) => ({ kind: copy.widget, name: w.title })),
      ]
    : []

  const send = () => {
    if (!text.trim()) {
      haptic('error')
      return
    }
    const wish = { id: newId('wish'), kind, text: text.trim(), createdAt: new Date().toISOString() }
    updateActive((latest) => ({ wishes: [...(latest.wishes ?? []), wish] }))
    haptic('success')
    toast(copy.sent)
    setText('')
    setAsking(false)
  }

  return (
    <section className="glass card span-12 wishes-card" aria-label={copy.title}>
      <div className="section-head">
        <div className="flex items-center gap-3">
          <span className="rulebook-card-icon" aria-hidden="true">
            <WandSparkles />
          </span>
          <div>
            <h2 className="card-title mb-0">{copy.title}</h2>
            <p className="text-2 text-[13px]">{copy.sub}</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary tactile" onClick={() => setAsking(true)}>
          <Plus />
          {copy.ask}
        </button>
      </div>

      <div className="wishes-columns">
        <div>
          <h3 className="wishes-heading">{copy.builtTitle}</h3>
          {built.length === 0 ? (
            <p className="wg-muted">{extension.status === 'loading' ? t.shell.loading : copy.builtEmpty}</p>
          ) : (
            <ul className="people-list">
              {built.map((b) => (
                <li key={`${b.kind}-${b.name}`} className="well wish-row">
                  <span className="tag tag-vacation">{b.kind}</span>
                  <span className="wish-text">{b.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="wishes-heading">{copy.requestsTitle}</h3>
          {wishes.length === 0 ? (
            <p className="wg-muted">{copy.requestsEmpty}</p>
          ) : (
            <ul className="people-list">
              {wishes.map((w) => (
                <li key={w.id} className="well wish-row">
                  <span className="tag">{copy.kinds[w.kind]}</span>
                  <span className="wish-text">
                    {w.text}
                    <span className="person-sub num">{copy.sentOn(formatDateTime(w.createdAt))}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title={copy.ask}
        footer={
          <>
            <button type="button" className="btn btn-secondary tactile" onClick={() => setAsking(false)}>
              {t.common.cancel}
            </button>
            <button type="button" className="btn btn-primary tactile" disabled={!text.trim()} onClick={send}>
              {copy.send}
            </button>
          </>
        }
      >
        <p className="text-2 mb-3">{copy.dialogSub}</p>
        <WishFields kind={kind} text={text} onKind={setKind} onText={setText} autoFocus />
      </Dialog>
    </section>
  )
}
