import { useState } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import type { WishKind } from '../../config/types'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { WishFields } from '../../wishes/WishFields'

type DraftWish = { kind: WishKind; text: string }

/**
 * After "Sim" on set-as-wish: the client tells what to build for their business (new parts, compartments
 * inside a module, rules). Optional; everything written here is kept with the business for the ZeroX team.
 */
export function WishStep({ initial, onDone }: { initial: DraftWish[]; onDone: (wishes: DraftWish[]) => void }) {
  const [wishes, setWishes] = useState<DraftWish[]>(initial)
  const [kind, setKind] = useState<WishKind>('part')
  const [text, setText] = useState('')
  const copy = t.wishes

  const add = () => {
    if (!text.trim()) return
    haptic('success')
    setWishes((w) => [...w, { kind, text: text.trim() }])
    setText('')
  }

  return (
    <div className="glass card ob-wish">
      <h2 className="card-title">{copy.onboardingTitle}</h2>
      <p className="text-2 mb-3 text-[13px]">{copy.onboardingSub}</p>
      <WishFields kind={kind} text={text} onKind={setKind} onText={setText} autoFocus />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary tactile" disabled={!text.trim()} onClick={add}>
          <Plus />
          {copy.addAnother}
        </button>
        <button
          type="button"
          className="btn btn-primary tactile"
          onClick={() => onDone(text.trim() ? [...wishes, { kind, text: text.trim() }] : wishes)}
        >
          {wishes.length === 0 && !text.trim() ? copy.skip : t.common.continue}
          <ArrowRight />
        </button>
      </div>
      {wishes.length > 0 && (
        <ul className="people-list mt-3">
          {wishes.map((wish, i) => (
            <li key={i} className="well wish-row">
              <span className="tag">{copy.kinds[wish.kind]}</span>
              <span className="wish-text">{wish.text}</span>
              <button
                type="button"
                className="btn btn-icon btn-ghost tactile"
                aria-label={copy.removeDraft}
                onClick={() => setWishes((w) => w.filter((_, j) => j !== i))}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
