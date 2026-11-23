import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, Pencil, Plus, Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { t } from '../../../i18n/pt-BR'
import { formatMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { Avatar } from '../../../ui/Avatar'
import { ConfirmDialog, Dialog } from '../../../ui/Dialog'
import { save } from '../store'
import type { CustomSection } from '../types'
import { ContactForm } from './ContactForm'
import { CONTACT_PATH, CONTACT_TABLE, isSupplier, useContacts, type Contact, type ContactKind } from './kinds'

export function ContactDetail({ kind }: { kind: ContactKind }) {
  const { id } = useParams()
  const contact = useContacts(kind).find((c) => c.id === id)
  const copy = t.collab.contacts[kind]

  const back = (
    <Link to={CONTACT_PATH[kind]} className="back-link">
      <ArrowLeft />
      {copy.back}
    </Link>
  )

  if (!contact) {
    return (
      <div className="module-body">
        {back}
        <p className="glass empty-state">{copy.notFound}</p>
      </div>
    )
  }

  return (
    <div className="module-body">
      {back}
      <ContactCard kind={kind} contact={contact} />
    </div>
  )
}

function ContactCard({ kind, contact }: { kind: ContactKind; contact: Contact }) {
  const [editing, setEditing] = useState(false)
  const [sectionDialog, setSectionDialog] = useState<CustomSection | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CustomSection | null>(null)
  const supplier = isSupplier(contact) ? contact : null
  const longText = supplier ? supplier.supplies : 'summary' in contact ? contact.summary : ''

  const saveSections = (sections: CustomSection[]) =>
    save<Contact>(CONTACT_TABLE[kind], { ...contact, sections } as Contact)

  const fields: { label: string; value: string | null }[] = [
    { label: t.collab.widgets.phone, value: contact.phone || null },
    { label: t.collab.widgets.email, value: contact.email || null },
    { label: t.collab.widgets.pixKey, value: contact.pixKey || null },
    ...(supplier
      ? [{ label: t.collab.contacts.monthly, value: supplier.monthlyAmount == null ? null : formatMoney(supplier.monthlyAmount) }]
      : []),
  ]

  return (
    <>
      <header className="glass card employee-head">
        <Avatar name={contact.name} size={64} />
        <div className="employee-head-main">
          <h2 className="employee-name">{contact.name}</h2>
        </div>
        <div className="employee-actions">
          <button type="button" className="btn btn-secondary tactile" onClick={() => setEditing(true)}>
            <Pencil />
            {t.common.edit}
          </button>
        </div>
      </header>

      <div className="widget-grid">
        {fields.map((field) => (
          <button key={field.label} type="button" className="widget-tile glass tactile" onClick={() => setEditing(true)}>
            <span className="widget-label">{field.label}</span>
            <span className={`widget-value num${field.value ? '' : ' is-empty'}`}>{field.value ?? t.common.notInformed}</span>
          </button>
        ))}
      </div>

      <div className="card-grid">
        <section className="glass card span-12">
          <h2 className="card-title">{supplier ? t.collab.contacts.suppliesTitle : t.collab.contacts.summaryTitle}</h2>
          <p className={`note-text${longText ? '' : ' text-2'}`}>{longText || t.common.notInformed}</p>
        </section>

        {contact.sections.map((section) => (
          <section key={section.id} className="glass card span-6">
            <div className="section-head">
              <h2 className="card-title mb-0">{section.title}</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-icon btn-ghost tactile"
                  aria-label={`${t.common.edit} ${section.title}`}
                  onClick={() => setSectionDialog(section)}
                >
                  <Pencil />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost tactile"
                  aria-label={`${t.common.delete} ${section.title}`}
                  onClick={() => setDeleting(section)}
                >
                  <Trash2 />
                </button>
              </div>
            </div>
            <p className="note-text">{section.content}</p>
          </section>
        ))}
      </div>

      <div>
        <button type="button" className="btn btn-secondary tactile" onClick={() => setSectionDialog('new')}>
          <Plus />
          {t.collab.contacts.sections.add}
        </button>
      </div>

      <ContactForm kind={kind} open={editing} onClose={() => setEditing(false)} contact={contact} />

      <Dialog
        open={sectionDialog !== null}
        onClose={() => setSectionDialog(null)}
        title={sectionDialog === 'new' ? t.collab.contacts.sections.newTitle : t.collab.contacts.sections.editTitle}
      >
        <SectionForm
          section={sectionDialog === 'new' ? undefined : (sectionDialog ?? undefined)}
          onCancel={() => setSectionDialog(null)}
          onSave={(section) => {
            const exists = contact.sections.some((s) => s.id === section.id)
            saveSections(exists ? contact.sections.map((s) => (s.id === section.id ? section : s)) : [...contact.sections, section])
            setSectionDialog(null)
          }}
        />
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t.collab.contacts.sections.deleteTitle}
        message={deleting ? t.collab.contacts.sections.deleteMessage(deleting.title) : ''}
        confirmLabel={t.common.delete}
        danger
        onConfirm={() => deleting && saveSections(contact.sections.filter((s) => s.id !== deleting.id))}
      />
    </>
  )
}

function SectionForm({ section, onSave, onCancel }: { section?: CustomSection; onSave: (s: CustomSection) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(section?.title ?? '')
  const [content, setContent] = useState(section?.content ?? '')
  const [invalid, setInvalid] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setInvalid(true)
      haptic('error')
      return
    }
    haptic('success')
    onSave({ id: section?.id ?? newId('sec'), title: title.trim(), content: content.trim() })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="section-title">
          {t.collab.contacts.sections.titleLabel}
        </label>
        <input
          id="section-title"
          className="input"
          data-autofocus
          maxLength={60}
          placeholder={t.collab.contacts.sections.titlePlaceholder}
          value={title}
          aria-invalid={invalid}
          aria-describedby="section-title-error"
          onChange={(e) => {
            setTitle(e.target.value)
            setInvalid(false)
          }}
        />
        <p id="section-title-error" className="field-error" role="alert">
          {invalid && (
            <>
              <CircleAlert size={14} /> {t.collab.contacts.sections.titleRequired}
            </>
          )}
        </p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="section-content">
          {t.collab.contacts.sections.contentLabel}
        </label>
        <textarea
          id="section-content"
          className="input textarea"
          rows={5}
          maxLength={4000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary tactile" onClick={onCancel}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {t.common.save}
        </button>
      </div>
    </form>
  )
}
