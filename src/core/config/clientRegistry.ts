import registry from '@client-registry'

export const CLIENT_ID = __CLIENT_ID__
export const BASE_VERSION = __BASE_VERSION__
export const clientRegistry = registry

if (import.meta.env.DEV) {
  if (registry.clientId !== CLIENT_ID) {
    console.warn(`[ZeroX] clients/${CLIENT_ID}.json não existe — usando clients/_template.json.`)
  } else if (registry.baseVersion !== BASE_VERSION) {
    console.warn(
      `[ZeroX] Cliente "${CLIENT_ID}" espera a base ${registry.baseVersion}, mas esta é a ${BASE_VERSION}.`,
    )
  }
}
