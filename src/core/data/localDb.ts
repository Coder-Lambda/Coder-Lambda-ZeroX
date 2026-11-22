/** Placeholder for Supabase: tables in localStorage, every row scoped by tenant_id. */

export interface TenantRow {
  id: string
  tenant_id: string
}

const memory = new Map<string, unknown[]>()
const storageKey = (table: string) => `zerox:db:${table}`

function readTable<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey(table))
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // Storage blocked or corrupt: fall through to the in-memory copy.
  }
  return (memory.get(table) as T[] | undefined) ?? []
}

function writeTable<T>(table: string, rows: T[]) {
  memory.set(table, rows)
  try {
    localStorage.setItem(storageKey(table), JSON.stringify(rows))
  } catch {
    // Storage blocked: data lives in memory for this session only.
  }
}

export const localDb = {
  list<T extends TenantRow>(table: string, tenantId: string, where?: (row: T) => boolean): T[] {
    return readTable<T>(table).filter((row) => row.tenant_id === tenantId && (!where || where(row)))
  },

  get<T extends TenantRow>(table: string, tenantId: string, id: string): T | undefined {
    return readTable<T>(table).find((row) => row.tenant_id === tenantId && row.id === id)
  },

  upsert<T extends TenantRow>(table: string, row: T): T {
    const rows = readTable<T>(table)
    const index = rows.findIndex((r) => r.id === row.id && r.tenant_id === row.tenant_id)
    if (index >= 0) rows[index] = row
    else rows.push(row)
    writeTable(table, rows)
    return row
  },
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`zerox:${key}`)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(`zerox:${key}`)
    else localStorage.setItem(`zerox:${key}`, value)
  } catch {
    // Preferences are conveniences; losing them is fine.
  }
}
