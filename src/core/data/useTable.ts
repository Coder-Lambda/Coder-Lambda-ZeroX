import { useMemo, useSyncExternalStore } from 'react'
import { useSession } from '../auth/SessionProvider'
import { CLIENT_ID } from '../config/clientRegistry'
import { localDb, type TenantRow } from './localDb'

export interface BusinessRow extends TenantRow {
  business_id: string
}

/** Rows of a table for the active business, re-read whenever any table changes. */
export function useTable<T extends BusinessRow>(table: string): T[] {
  const businessId = useSession().active?.businessId
  const version = useSyncExternalStore(localDb.subscribe, localDb.getVersion)
  return useMemo(
    () => {
      void version
      return businessId ? localDb.list<T>(table, CLIENT_ID, (row) => row.business_id === businessId) : []
    },
    [table, businessId, version],
  )
}

/** tenant_id + business_id for new rows of the active business. */
export function useScope() {
  const businessId = useSession().active?.businessId ?? ''
  return useMemo(() => ({ tenant_id: CLIENT_ID, business_id: businessId }), [businessId])
}
