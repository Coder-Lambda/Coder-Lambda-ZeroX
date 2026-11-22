import { Check, LogOut, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

  return (
    <>
      <PageHead title={t.settings.title} sub={t.settings.sub} />
      <div className="card-grid">
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
