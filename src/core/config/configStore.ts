import { localDb, type TenantRow } from '../data/localDb'
import { CLIENT_ID } from './clientRegistry'
import type { ClientConfig } from './types'

const TABLE = 'client_configs'

interface ConfigRow extends TenantRow {
  business_id: string
  owner_account_id: string
  config: ClientConfig
}

export function listBusinesses(accountId: string): ClientConfig[] {
  return localDb
    .list<ConfigRow>(TABLE, CLIENT_ID, (row) => row.owner_account_id === accountId)
    .map((row) => row.config)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function saveConfig(config: ClientConfig) {
  localDb.upsert<ConfigRow>(TABLE, {
    id: config.businessId,
    tenant_id: CLIENT_ID,
    business_id: config.businessId,
    owner_account_id: config.ownerAccountId,
    config,
  })
}
