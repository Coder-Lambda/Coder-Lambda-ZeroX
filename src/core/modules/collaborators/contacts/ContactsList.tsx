import { useMemo, useState } from 'react'
import { Handshake, Plus, Search, Truck } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatMoney, normalize } from '../../../lib/format'
import { PeopleList, type PersonItem } from '../PeopleList'
import { StatTile } from '../StatTile'
import { CONTACT_PATH, isSupplier, useContacts, type ContactKind } from './kinds'

export function ContactsList({ kind, onAdd }: { kind: ContactKind; onAdd: () => void }) {
  const contacts = useContacts(kind)
  const copy = t.collab.contacts[kind]
  const [query, setQuery] = useState('')

  const items = useMemo<PersonItem[]>(() => {
    const q = normalize(query)
    return contacts
      .filter((c) => !q || normalize(c.name).includes(q))
      .sort((a, b) => compareNames(a.name, b.name))
      .map((c) => ({
        id: c.id,
        name: c.name,
        to: `${CONTACT_PATH[kind]}/${c.id}`,
        sub: (isSupplier(c) ? c.supplies : c.summary) || c.phone || c.email || undefined,
        aside:
          isSupplier(c) && c.monthlyAmount != null ? (
            <span className="num text-2 text-[13px]">{formatMoney(c.monthlyAmount)}</span>
          ) : undefined,
      }))
  }, [contacts, kind, query])

  if (contacts.length === 0) {
    const Icon = kind === 'partners' ? Handshake : Truck
    return (
      <div className="collab-body">
        <div className="glass empty-hero">
          <span className="empty-hero-icon">
            <Icon />
          </span>
          <h2 className="empty-hero-title">{copy.emptyTitle}</h2>
          <p className="text-2">{copy.emptySub}</p>
          <button type="button" className="btn btn-primary tactile" onClick={onAdd}>
            <Plus />
            {t.collab.add[kind]}
          </button>
        </div>
      </div>
    )
  }

  const monthlyTotal = contacts.reduce((sum, c) => sum + (isSupplier(c) ? (c.monthlyAmount ?? 0) : 0), 0)

  return (
    <div className="collab-body">
      {kind === 'suppliers' && (
        <div className="stat-row stat-row-2">
          <StatTile value={contacts.length} label={t.collab.tabs.suppliers} />
          <StatTile value={formatMoney(monthlyTotal)} label={t.collab.contacts.monthlyTotal} />
        </div>
      )}
      <div className="glass card">
        <div className="list-toolbar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {items.length === 0 ? (
          <p className="empty-state">{t.collab.contacts.noResults}</p>
        ) : (
          <PeopleList items={items} grouped />
        )}
      </div>
    </div>
  )
}
