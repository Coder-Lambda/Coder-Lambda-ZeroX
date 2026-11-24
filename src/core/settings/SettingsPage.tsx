import { BookOpen, Check, ChevronRight, LayoutGrid, LogOut, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionProvider'
import { BASE_VERSION, CLIENT_ID } from '../config/clientRegistry'
import { MODULE_IDS } from '../config/types'
import { t } from '../i18n/pt-BR'
import { PageHead } from '../layout/PageHead'
import { applyTheme } from '../theme/applyTheme'
import { ThemeCard } from '../theme/ThemeCard'
import { THEMES } from '../theme/themes'

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export function SettingsPage() {
  const { account, active, businesses, updateActive, selectBusiness, signOut } = useSession()
  const navigate = useNavigate()
  if (!active || !account) return null
  // One chapter of the rule book per base module chosen in the onboarding.
  const chapters = MODULE_IDS.filter((id) => id !== 'setAsWish' && active.modules[id]).length

  return (
    <>
      <PageHead title={t.settings.title} sub={t.settings.sub} />
      <div className="card-grid">
        <Link to="/configuracoes/regras" className="glass card span-6 rulebook-card tactile">
          <span className="rulebook-card-icon" aria-hidden="true">
            <BookOpen />
          </span>
          <span className="rulebook-card-main">
            <span className="rulebook-card-title">{t.settings.rulebook}</span>
            <span className="text-2 text-[13px]">{t.settings.rulebookSub}</span>
            <span className="badge num mt-1 self-start">{t.settings.rulebookChapters(chapters)}</span>
          </span>
          <ChevronRight className="person-chevron" aria-hidden="true" />
        </Link>

        <section className="glass card span-6 rulebook-card" aria-label={t.settings.widgets}>
          <span className="rulebook-card-icon" aria-hidden="true">
            <LayoutGrid />
          </span>
          <span className="rulebook-card-main">
            <span className="rulebook-card-title">{t.settings.widgets}</span>
            <span className="text-2 text-[13px]">{t.settings.widgetsSub}</span>
            <span className="mt-2 flex flex-wrap gap-2">
              <Link to="/configuracoes/widgets?criar=1" className="btn btn-primary tactile">
                <Plus />
                {t.settings.widgetsCreate}
              </Link>
              <Link to="/configuracoes/widgets" className="btn btn-secondary tactile">
                {t.settings.widgetsOpen}
              </Link>
            </span>
          </span>
        </section>

        <section className="glass card span-12">
          <h2 className="card-title">{t.settings.theme}</h2>
          <div className="theme-grid lg:grid-cols-4">
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={active.theme === theme.id}
                onSelect={() =>
                  applyTheme(theme.id, { animate: true, update: () => updateActive({ theme: theme.id }) })
                }
              />
            ))}
          </div>
        </section>

        <section className="glass card span-8">
          <h2 className="card-title">{t.settings.businesses}</h2>
          <p className="text-2 mb-3 text-[13px]">{t.settings.businessesSub}</p>
          {businesses.map((business) => {
            const isActive = business.businessId === active.businessId
            const modules = MODULE_IDS.filter((id) => business.modules[id]).length
            return (
              <div key={business.businessId} className="well row">
                <div className="row-main">
                  <div className="row-title">{business.businessType}</div>
                  <div className="row-sub num">
                    {t.settings.createdOn(formatDate(business.createdAt))} · {t.settings.modulesCount(modules)}
                  </div>
                </div>
                {isActive ? (
                  <span className="badge">
                    <Check size={14} /> {t.settings.active}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary tactile"
                    onClick={() =>
                      applyTheme(business.theme, {
                        animate: true,
                        update: () => selectBusiness(business.businessId),
                      })
                    }
                  >
                    {t.settings.use}
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className="btn btn-primary tactile mt-4"
            onClick={() => navigate('/onboarding?novo=1')}
          >
            <Plus />
            {t.settings.addBusiness}
          </button>
        </section>

        <section className="glass card span-4 flex flex-col gap-3">
          <h2 className="card-title">{t.settings.account}</h2>
          <p className="text-2">{account.displayName}</p>
          <div>
            <button type="button" className="btn btn-secondary tactile" onClick={signOut}>
              <LogOut />
              {t.settings.signOut}
            </button>
          </div>
          <h2 className="card-title mt-4">{t.settings.about}</h2>
          <p className="text-2 num text-[13px]">{t.settings.version(BASE_VERSION, CLIENT_ID)}</p>
        </section>
      </div>
    </>
  )
}
