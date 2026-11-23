import { normalize, parseMoney } from '../../../lib/format'
import type { EmployeeStatus } from '../types'

export type Cell = string | number | boolean | Date | null

export interface Sheet {
  headers: string[]
  rows: Cell[][]
}

export const IMPORT_FIELDS = ['name', 'phone', 'email', 'pixKey', 'birthday', 'salary', 'registered', 'status'] as const
export type ImportField = (typeof IMPORT_FIELDS)[number]
/** Column index per field, or -1 when the field isn't imported. */
export type ColumnMap = Record<ImportField, number>

export interface ImportedEmployee {
  name: string
  phone: string
  email: string
  pixKey: string
  birthday: string | null
  salary: number | null
  registered: boolean | null
  status: EmployeeStatus
}

const ALIASES: Record<ImportField, string[]> = {
  name: ['nome', 'nome completo', 'funcionario', 'colaborador', 'name'],
  phone: ['telefone', 'celular', 'fone', 'whatsapp', 'tel', 'phone', 'contato'],
  email: ['email', 'e-mail', 'e mail'],
  pixKey: ['pix', 'chave pix', 'chave'],
  birthday: ['aniversario', 'nascimento', 'data de nascimento', 'data nasc', 'dt nascimento', 'birthday'],
  salary: ['salario', 'salario base', 'remuneracao', 'vencimento', 'salary'],
  registered: ['registrado', 'registro', 'clt', 'carteira assinada', 'carteira', 'registered'],
  status: ['status', 'situacao'],
}

export async function readSheetFile(file: File): Promise<Sheet> {
  const rows: Cell[][] = /\.csv$|\.txt$/i.test(file.name) ? parseCsv(await decodeText(file)) : await readXlsx(file)
  const nonEmpty = rows.filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== ''))
  const [header = [], ...data] = nonEmpty
  return { headers: header.map((cell) => (cell == null ? '' : String(cell).trim())), rows: data }
}

async function readXlsx(file: File): Promise<Cell[][]> {
  const { readSheet } = await import('read-excel-file/browser')
  return (await readSheet(file)) as Cell[][]
}

/** Brazilian Excel saves CSV as Windows-1252 more often than UTF-8. */
async function decodeText(file: File) {
  const buffer = await file.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buffer) : utf8
}

function parseCsv(text: string): Cell[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = [';', ',', '\t'].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  )
  const rows: Cell[][] = []
  let row: Cell[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function guessColumns(headers: string[]): ColumnMap {
  const normalized = headers.map(normalize)
  const used = new Set<number>()
  const map = {} as ColumnMap
  IMPORT_FIELDS.forEach((field) => {
    const exact = normalized.findIndex((h, i) => !used.has(i) && ALIASES[field].includes(h))
    const partial =
      exact >= 0 ? exact : normalized.findIndex((h, i) => !used.has(i) && ALIASES[field].some((a) => h.includes(a)))
    map[field] = partial
    if (partial >= 0) used.add(partial)
  })
  return map
}

export function toEmployees(sheet: Sheet, map: ColumnMap): ImportedEmployee[] {
  const cell = (row: Cell[], field: ImportField) => (map[field] >= 0 ? (row[map[field]] ?? null) : null)
  return sheet.rows
    .map((row) => ({
      name: text(cell(row, 'name')),
      phone: text(cell(row, 'phone')),
      email: text(cell(row, 'email')),
      pixKey: text(cell(row, 'pixKey')),
      birthday: date(cell(row, 'birthday')),
      salary: money(cell(row, 'salary')),
      registered: yesNo(cell(row, 'registered')),
      status: status(cell(row, 'status')),
    }))
    .filter((employee) => employee.name !== '')
}

function text(value: Cell): string {
  if (value == null) return ''
  if (value instanceof Date) return utcDateKey(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  return value.trim()
}

// Spreadsheet dates carry no timezone; read them in UTC so 1990-05-12 doesn't become the 11th in Brazil.
function utcDateKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
}

function date(value: Cell): string | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : utcDateKey(value)
  if (typeof value === 'number' && value > 1 && value < 80000) {
    return utcDateKey(new Date(Date.UTC(1899, 11, 30) + value * 86_400_000))
  }
  const raw = String(value).trim()
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return validDate(+iso[1], +iso[2], +iso[3])
  const br = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (br) {
    const year = br[3].length === 2 ? (+br[3] > 30 ? 1900 : 2000) + +br[3] : +br[3]
    return validDate(year, +br[2], +br[1])
  }
  return null
}

function validDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? utcDateKey(d) : null
}

function money(value: Cell): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Math.round(value * 100) / 100
  return parseMoney(String(value))
}

function yesNo(value: Cell): boolean | null {
  if (typeof value === 'boolean') return value
  const v = normalize(String(value ?? ''))
  if (!v) return null
  if (['sim', 's', 'x', 'yes', 'y', 'true', '1', 'clt', 'registrado'].includes(v)) return true
  if (['nao', 'n', 'no', 'false', '0'].includes(v)) return false
  return null
}

function status(value: Cell): EmployeeStatus {
  const v = normalize(String(value ?? ''))
  if (/ferias/.test(v)) return 'vacation'
  if (/inativ|deslig|demit|saiu/.test(v)) return 'inactive'
  return 'active'
}
