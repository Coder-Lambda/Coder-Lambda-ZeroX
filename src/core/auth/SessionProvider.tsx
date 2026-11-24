import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CLIENT_ID } from '../config/clientRegistry'
import { listBusinesses, saveConfig } from '../config/configStore'
import type { ClientConfig } from '../config/types'
import { localDb, newId, readPref, writePref, type TenantRow } from '../data/localDb'

export interface Account extends TenantRow {
  displayName: string
  provider: 'google-mock'
  createdAt: string
}

interface SessionValue {
  account: Account | null
  businesses: ClientConfig[]
  active: ClientConfig | null
  signIn: () => void
  signOut: () => void
  addBusiness: (config: ClientConfig) => void
  selectBusiness: (businessId: string) => void
  /** A patch, or a function that builds it from the latest saved config (safe for quick successive changes). */
  updateActive: (patch: ActivePatch | ((latest: ClientConfig) => ActivePatch)) => void
}

type ActivePatch = Partial<Pick<ClientConfig, 'theme' | 'layout' | 'labels' | 'rules'>>

const SessionContext = createContext<SessionValue | null>(null)

const ACCOUNTS = 'accounts'
const sessionKey = `session:${CLIENT_ID}`
const activeKey = (accountId: string) => `active-business:${CLIENT_ID}:${accountId}`

function loadAccount(): Account | null {
  const id = readPref(sessionKey)
  return id ? (localDb.get<Account>(ACCOUNTS, CLIENT_ID, id) ?? null) : null
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(loadAccount)
  const [businesses, setBusinesses] = useState<ClientConfig[]>(() =>
    account ? listBusinesses(account.id) : [],
  )
  const [activeId, setActiveId] = useState<string | null>(() =>
    account ? readPref(activeKey(account.id)) : null,
  )

  const signIn = useCallback(() => {
    // Mock of Google sign-in: one demo Google account per client, reused on every sign-in.
    const existing = localDb.list<Account>(ACCOUNTS, CLIENT_ID, (a) => a.provider === 'google-mock')[0]
    const next =
      existing ??
      localDb.upsert<Account>(ACCOUNTS, {
        id: newId('acc'),
        tenant_id: CLIENT_ID,
        displayName: 'Conta Google (demonstração)',
        provider: 'google-mock',
        createdAt: new Date().toISOString(),
      })
    writePref(sessionKey, next.id)
    setAccount(next)
    setBusinesses(listBusinesses(next.id))
    setActiveId(readPref(activeKey(next.id)))
  }, [])

  const signOut = useCallback(() => {
    writePref(sessionKey, null)
    setAccount(null)
    setBusinesses([])
    setActiveId(null)
  }, [])

  const selectBusiness = useCallback(
    (businessId: string) => {
      if (!account) return
      writePref(activeKey(account.id), businessId)
      setActiveId(businessId)
    },
    [account],
  )

  const addBusiness = useCallback(
    (config: ClientConfig) => {
      saveConfig(config)
      setBusinesses(listBusinesses(config.ownerAccountId))
      writePref(activeKey(config.ownerAccountId), config.businessId)
      setActiveId(config.businessId)
    },
    [],
  )

  const active = useMemo(
    () => businesses.find((b) => b.businessId === activeId) ?? businesses[0] ?? null,
    [businesses, activeId],
  )

  const updateActive = useCallback<SessionValue['updateActive']>(
    (patch) => {
      if (!active) return
      const latest = listBusinesses(active.ownerAccountId).find((b) => b.businessId === active.businessId) ?? active
      saveConfig({ ...latest, ...(typeof patch === 'function' ? patch(latest) : patch) })
      setBusinesses(listBusinesses(active.ownerAccountId))
    },
    [active],
  )

  const value = useMemo<SessionValue>(
    () => ({ account, businesses, active, signIn, signOut, addBusiness, selectBusiness, updateActive }),
    [account, businesses, active, signIn, signOut, addBusiness, selectBusiness, updateActive],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession precisa estar dentro de <SessionProvider>')
  return value
}
