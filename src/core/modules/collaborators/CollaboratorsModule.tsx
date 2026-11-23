import { useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { FileSpreadsheet, Plus } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { ContactDetail } from './contacts/ContactDetail'
import { ContactForm } from './contacts/ContactForm'
import { ContactsList } from './contacts/ContactsList'
import { EmployeeDetail } from './employees/EmployeeDetail'
import { EmployeeForm } from './employees/EmployeeForm'
import { EmployeesDirectory } from './employees/EmployeesDirectory'
import { ImportDialog } from './employees/ImportDialog'
import { PresenceList } from './employees/PresenceList'
import './collaborators.css'

type Section = 'employees' | 'partners' | 'suppliers'

const SECTIONS: { id: Section; path: string }[] = [
  { id: 'employees', path: 'funcionarios' },
  { id: 'partners', path: 'parceiros' },
  { id: 'suppliers', path: 'fornecedores' },
]

export default function CollaboratorsModule() {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[2]
  const section = SECTIONS.find((s) => s.path === segment)?.id ?? 'employees'
  const [dialog, setDialog] = useState<Section | 'import' | null>(null)

  return (
    <>
      <PageHead title={t.collab.title} sub={t.modules.collaborators.description} />

      <div className="collab-nav glass">
        <nav className="collab-tabs" aria-label={t.collab.title}>
          {SECTIONS.map((s) => (
            <NavLink key={s.id} to={`/colaboradores/${s.path}`} className="collab-tab tactile">
              {t.collab.tabs[s.id]}
            </NavLink>
          ))}
        </nav>
        <div className="collab-actions">
          {section === 'employees' && (
            <button
              type="button"
              className="btn btn-secondary tactile"
              aria-label={t.collab.importSheet}
              onClick={() => setDialog('import')}
            >
              <FileSpreadsheet />
              <span className="collab-action-label">{t.collab.importSheet}</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary tactile"
            aria-label={t.collab.add[section]}
            onClick={() => setDialog(section)}
          >
            <Plus />
            <span className="collab-action-label">{t.collab.add[section]}</span>
            <span className="collab-action-short">{t.collab.addShort}</span>
          </button>
        </div>
      </div>

      <Routes>
        <Route index element={<Navigate to="funcionarios" replace />} />
        <Route path="funcionarios" element={<EmployeesDirectory onAdd={() => setDialog('employees')} onImport={() => setDialog('import')} />} />
        <Route path="funcionarios/presenca" element={<PresenceList />} />
        <Route path="funcionarios/:id" element={<EmployeeDetail />} />
        <Route path="parceiros" element={<ContactsList kind="partners" onAdd={() => setDialog('partners')} />} />
        <Route path="parceiros/:id" element={<ContactDetail kind="partners" />} />
        <Route path="fornecedores" element={<ContactsList kind="suppliers" onAdd={() => setDialog('suppliers')} />} />
        <Route path="fornecedores/:id" element={<ContactDetail kind="suppliers" />} />
        <Route path="*" element={<Navigate to="funcionarios" replace />} />
      </Routes>

      <EmployeeForm open={dialog === 'employees'} onClose={() => setDialog(null)} />
      <ImportDialog open={dialog === 'import'} onClose={() => setDialog(null)} />
      <ContactForm kind="partners" open={dialog === 'partners'} onClose={() => setDialog(null)} />
      <ContactForm kind="suppliers" open={dialog === 'suppliers'} onClose={() => setDialog(null)} />
    </>
  )
}
