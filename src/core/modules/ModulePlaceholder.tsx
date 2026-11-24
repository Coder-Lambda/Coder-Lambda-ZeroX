import { useState } from 'react'
import { ChartColumn, Construction, LayoutGrid } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import { t } from '../i18n/pt-BR'
import { Segmented } from '../ui/Segmented'
import { PageHead } from '../layout/PageHead'
import type { ModuleDef } from './registry'

export function ModulePlaceholder({ module }: { module: ModuleDef }) {
  const { active } = useSession()
  const copy = t.modules[module.id]
  const [page, setPage] = useState(0)
  const { shell } = module

  return (
    <>
      <PageHead
        title={copy.label}
        sub={copy.description}
        aside={
          <span className="badge">
            <Construction size={14} /> {t.common.underConstruction}
          </span>
        }
      />

      {module.id === 'dashboard' && active && (
        <div className="glass glass-feature hero mb-[14px]">
          <p className="hero-eyebrow">{active.businessType}</p>
          <p className="hero-title">
            {t.shell.greeting} {active.userName}
          </p>
        </div>
      )}

      {shell.kind === 'widgets' && shell.pages && (
        <div className="mb-4 max-w-sm">
          <Segmented
            label={copy.label}
            options={Array.from({ length: shell.pages }, (_, i) => t.page(i + 1))}
            value={page}
            onChange={setPage}
          />
        </div>
      )}

      {shell.kind === 'widgets' ? (
        <div className="card-grid" key={page}>
          {Array.from({ length: shell.widgets }, (_, i) => (
            <div key={`w${i}`} className="glass card span-3 fade-in">
              <div className="well placeholder-well">
                <LayoutGrid />
                <span className="num">{t.widget(i + 1)}</span>
              </div>
            </div>
          ))}
          {Array.from({ length: shell.charts }, (_, i) => (
            <div key={`c${i}`} className={`glass card fade-in ${shell.charts === 1 ? 'span-12' : 'span-6'}`}>
              <div className="well placeholder-well is-chart">
                <ChartColumn />
                <span className="num">{t.chart(i + 1)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {copy.sections.map((section) => (
            <section key={section} className="glass card span-6">
              <h2 className="card-title">{section}</h2>
              <div className="well placeholder-well">{t.common.nextStep}</div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
