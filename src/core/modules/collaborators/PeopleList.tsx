import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { normalize } from '../../lib/format'
import { Avatar } from '../../ui/Avatar'

export interface PersonItem {
  id: string
  name: string
  to: string
  sub?: ReactNode
  aside?: ReactNode
  /** Taken off the list: name in the alert color, avatar muted. */
  removed?: boolean
}

function letterOf(name: string) {
  const first = normalize(name).charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

/** Rows grouped under A, B, C… when `grouped`; otherwise one flat list in the given order. */
export function PeopleList({ items, grouped }: { items: PersonItem[]; grouped: boolean }) {
  if (!grouped) {
    return (
      <ul className="people-list">
        {items.map((item) => (
          <PersonRow key={item.id} item={item} />
        ))}
      </ul>
    )
  }

  const groups = new Map<string, PersonItem[]>()
  items.forEach((item) => {
    const letter = letterOf(item.name)
    groups.set(letter, [...(groups.get(letter) ?? []), item])
  })

  return (
    <div className="people-groups">
      {[...groups].map(([letter, rows]) => (
        <section key={letter} aria-label={letter}>
          <h3 className="people-letter">{letter}</h3>
          <ul className="people-list">
            {rows.map((item) => (
              <PersonRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PersonRow({ item }: { item: PersonItem }) {
  return (
    <li>
      <Link to={item.to} className="person-row well tactile">
        <Avatar name={item.name} muted={item.removed} />
        <span className="person-main">
          <span className={`person-name${item.removed ? ' is-removed' : ''}`}>{item.name}</span>
          {item.sub && <span className="person-sub">{item.sub}</span>}
        </span>
        {item.aside && <span className="person-aside">{item.aside}</span>}
        <ChevronRight className="person-chevron" aria-hidden="true" />
      </Link>
    </li>
  )
}
