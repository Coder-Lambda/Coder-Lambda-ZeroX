import type { WishKind } from '../config/types'
import { t } from '../i18n/pt-BR'

export const WISH_KINDS: WishKind[] = ['part', 'compartment', 'rule']

/** What kind of thing the client wants built, and the words to describe it. */
export function WishFields({
  kind,
  text,
  onKind,
  onText,
  autoFocus,
}: {
  kind: WishKind
  text: string
  onKind: (kind: WishKind) => void
  onText: (text: string) => void
  autoFocus?: boolean
}) {
  const copy = t.wishes
  return (
    <div className="flex flex-col gap-3">
      <div className="ob-chips" role="group" aria-label={copy.kindLabel}>
        {WISH_KINDS.map((k) => (
          <button key={k} type="button" className="chip tactile" aria-pressed={kind === k} onClick={() => onKind(k)}>
            {copy.kinds[k]}
          </button>
        ))}
      </div>
      <p className="text-2 text-[13px]">{copy.kindHints[kind]}</p>
      <label className="field">
        <span className="field-label">{copy.textLabel}</span>
        <textarea
          className="input textarea"
          rows={4}
          maxLength={1000}
          placeholder={copy.placeholders[kind]}
          data-autofocus={autoFocus || undefined}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
      </label>
    </div>
  )
}
