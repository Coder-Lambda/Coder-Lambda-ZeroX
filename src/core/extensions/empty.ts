import type { ClientExtension } from './types'

/** Used when the client being built has no folder in src/extensions. */
const emptyExtension: ClientExtension = { clientId: null, routes: [], labels: {} }

export default emptyExtension
