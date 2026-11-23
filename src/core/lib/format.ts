const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: number | null | undefined) {
  return value == null ? '—' : money.format(value)
}

/** "R$ 1.234,56", "1234.56", "1.234" → number. Brazilian format first. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, '')
      : cleaned
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null
}

/** Value for a money <input>: 1234.5 → "1.234,50". */
export function moneyInputValue(value: number | null | undefined) {
  return value == null ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Local calendar date as YYYY-MM-DD (never UTC-shifted). */
export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function formatDateKey(key: string | null | undefined, withYear = true) {
  if (!key) return '—'
  const [y, m, d] = key.split('-')
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function ageOn(birthday: string, on = new Date()) {
  const [y, m, d] = birthday.split('-').map(Number)
  let age = on.getFullYear() - y
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age -= 1
  return age
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Lowercase, no accents — for search and header matching. */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })
export const compareNames = (a: string, b: string) => collator.compare(a, b)
