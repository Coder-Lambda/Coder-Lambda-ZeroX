import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog, Dialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/Toaster'
import { TextInput } from '../employees/EmployeeForm'
import { removeRow, save } from '../store'
import type { Partner, Supplier } from '../types'
import { CONTACT_PATH, CONTACT_TABLE, isSupplier, type Contact, type ContactKind } from './kinds'

interface Props {
  kind: ContactKind
  open: boolean
  onClose: () => void
  contact?: Contact
}

export function ContactForm({ kind, open, onClose, contact }: Props) {
  const title =
    kind === 'partners'
      ? contact
        ? t.collab.form.editPartner
        : t.collab.form.newPartner
      : contact
        ? t.collab.form.editSupplier
        : t.collab.form.newSupplier
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <ContactFormBody kind={kind} contact={contact} onDone={onClose} />
    </Dialog>
  )
}

function ContactFormBody({ kind, contact, onDone }: { kind: ContactKind; contact?: Contact; onDone: () => void }) {
  const scope = useScope()
  const navigate = useNavigate()
  const supplier = contact && isSupplier(contact) ? contact : null
  const partner = contact && !isSupplier(contact) ? contact : null
  const [name, setName] = useState(contact?.name ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [pixKey, setPixKey] = useState(contact?.pixKey ?? '')
  const [summary, setSummary] = useState(partner?.summary ?? '')
  const [supplies, setSupplies] = useState(supplier?.supplies ?? '')
  const [monthly, setMonthly] = useState(moneyInputValue(supplier?.monthlyAmount))
  const [invalid, setInvalid] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setInvalid(true)
      haptic('error')
      return
    }
    const base = {
      id: contact?.id ?? newId(kind === 'partners' ? 'ptn' : 'sup'),
      ...scope,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pixKey: pixKey.trim(),
      sections: contact?.sections ?? [],
      createdAt: contact?.createdAt ?? new Date().toISOString(),
    }
    if (kind === 'partners') save<Partner>(CONTACT_TABLE.partners, { ...base, summary: summary.trim() })
    else save<Supplier>(CONTACT_TABLE.suppliers, { ...base, supplies: supplies.trim(), monthlyAmount: parseMoney(monthly) })
    haptic('success')
    toast(contact ? t.collab.form.saved : t.collab.form.added(base.name))
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field span-2">
        <label className="field-label" htmlFor="contact-name">
          {t.collab.form.name}
        </label>
        <input
          id="contact-name"
          className="input"
          data-autofocus
          maxLength={80}
          value={name}
          aria-invalid={invalid}
          aria-describedby="contact-name-error"
          onChange={(e) => {
            setName(e.target.value)
            setInvalid(false)
          }}
        />
        <p id="contact-name-error" className="field-error" role="alert">
          {invalid && (
            <>
              <CircleAlert size={14} /> {t.collab.form.nameRequired}
            </>
          )}
        </p>
      </div>
      <TextInput id="contact-phone" label={t.collab.form.phone} value={phone} onChange={setPhone} type="tel" />
      <TextInput id="contact-email" label={t.collab.form.email} value={email} onChange={setEmail} type="email" />
      <TextInput id="contact-pix" label={t.collab.form.pixKey} value={pixKey} onChange={setPixKey} />

      {kind === 'suppliers' ? (
        <>
          <TextInput
            id="contact-monthly"
            label={t.collab.form.monthlyAmount}
            value={monthly}
            onChange={setMonthly}
            inputMode="decimal"
            placeholder="0,00"
            prefix="R$"
          />
          <div className="field span-2">
            <label className="field-label" htmlFor="contact-supplies">
              {t.collab.form.supplies}
            </label>
            <textarea
              id="contact-supplies"
              className="input textarea"
              rows={2}
              maxLength={500}
              placeholder={t.collab.form.suppliesPlaceholder}
              value={supplies}
              onChange={(e) => setSupplies(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="field span-2">
          <label className="field-label" htmlFor="contact-summary">
            {t.collab.form.summary}
          </label>
          <textarea
            id="contact-summary"
            className="input textarea"
            rows={4}
            maxLength={2000}
            placeholder={t.collab.form.summaryPlaceholder}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
      )}

      <div className="form-actions span-2">
        {contact && (
          <button type="button" className="btn btn-ghost tactile mr-auto" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
            {t.common.delete}
          </button>
        )}
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {t.common.save}
        </button>
      </div>

      {contact && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.collab.form.deleteTitle(contact.name)}
          message={t.collab.form.deleteContactMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            removeRow(CONTACT_TABLE[kind], contact.id)
            toast(t.collab.form.deleted(contact.name))
            onDone()
            navigate(CONTACT_PATH[kind], { replace: true })
          }}
        />
      )}
    </form>
  )
}
