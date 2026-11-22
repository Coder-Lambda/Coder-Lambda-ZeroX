/// <reference types="vite/client" />

declare const __BASE_VERSION__: string
declare const __CLIENT_ID__: string

declare module '@client-registry' {
  const entry: import('./core/config/types').ClientRegistryEntry
  export default entry
}

declare module '@client-extension' {
  const extension: import('./core/extensions/types').ClientExtension
  export default extension
}
