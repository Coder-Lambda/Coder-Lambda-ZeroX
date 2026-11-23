import { jsPDF } from 'jspdf'
import { t } from '../../../i18n/pt-BR'
import { ageOn, formatBytes, formatDateKey, formatMoney } from '../../../lib/format'
import type { Employee, EmployeeFile, EmployeeNote } from '../types'

interface PdfInput {
  employee: Employee
  businessName: string
  absences: { month: number; total: number }
  notes: EmployeeNote[]
  files: EmployeeFile[]
}

const MARGIN = 18
const WIDTH = 210 - MARGIN * 2
const BOTTOM = 297 - 18

/** Employee card as a downloadable A4 PDF (black on white, theme-independent). */
export async function exportEmployeePdf({ employee, businessName, absences, notes, files }: PdfInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 22

  const ensure = (space: number) => {
    if (y + space > BOTTOM) {
      doc.addPage()
      y = 22
    }
  }
  const heading = (text: string) => {
    ensure(14)
    y += 4
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(20)
    doc.text(text, MARGIN, y)
    y += 2
    doc.setDrawColor(210).line(MARGIN, y, MARGIN + WIDTH, y)
    y += 6
  }
  const paragraph = (text: string, size = 10, color = 40) => {
    doc.setFont('helvetica', 'normal').setFontSize(size).setTextColor(color)
    const lines = doc.splitTextToSize(text, WIDTH) as string[]
    lines.forEach((line) => {
      ensure(6)
      doc.text(line, MARGIN, y)
      y += size * 0.45
    })
    y += 2
  }

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(110)
  doc.text(`${t.collab.pdf.title} · ${businessName}`, MARGIN, y)
  doc.text(t.collab.pdf.generatedOn(new Date().toLocaleDateString('pt-BR')), MARGIN + WIDTH, y, { align: 'right' })
  y += 12

  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(15)
  doc.text(employee.name, MARGIN, y)
  y += 7
  const statusLine = [
    t.collab.employees.status[employee.status],
    employee.removedOn ? t.collab.card.takenOff(formatDateKey(employee.removedOn)) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  paragraph(statusLine, 10, 90)

  heading(t.collab.pdf.data)
  const none = t.common.notInformed
  const rows: [string, string][] = [
    [t.collab.widgets.phone, employee.phone || none],
    [t.collab.widgets.email, employee.email || none],
    [t.collab.widgets.pixKey, employee.pixKey || none],
    [
      t.collab.widgets.birthday,
      employee.birthday ? `${formatDateKey(employee.birthday)} (${t.collab.card.age(ageOn(employee.birthday))})` : none,
    ],
    [t.collab.widgets.salary, employee.salary == null ? none : formatMoney(employee.salary)],
    [
      t.collab.widgets.registered,
      employee.registered == null ? none : employee.registered ? t.collab.card.registeredYes : t.collab.card.registeredNo,
    ],
  ]
  rows.forEach(([label, value]) => {
    ensure(7)
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(110)
    doc.text(label, MARGIN, y)
    doc.setTextColor(25)
    doc.text(doc.splitTextToSize(value, WIDTH - 50) as string[], MARGIN + 50, y)
    y += 7
  })

  heading(t.collab.pdf.absences)
  paragraph(t.collab.pdf.absencesLine(absences.month, absences.total))

  heading(t.collab.pdf.notes)
  if (notes.length === 0) paragraph(t.collab.pdf.none, 10, 110)
  ;[...notes]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((note) => {
      ensure(12)
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(25)
      doc.text(`${formatDateKey(note.date)} · ${t.collab.notes.kind[note.kind]}`, MARGIN, y)
      y += 5
      paragraph(note.text)
    })

  heading(t.collab.pdf.files)
  if (files.length === 0) paragraph(t.collab.pdf.none, 10, 110)
  files.forEach((file) => paragraph(`${file.name} (${formatBytes(file.size)})`))

  doc.save(`Ficha - ${employee.name}.pdf`)
}
