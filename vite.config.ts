import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = import.meta.dirname
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, 'VITE_')
  const clientId = env.VITE_CLIENT_ID || 'demo'
  if (!/^[a-z0-9-]+$/.test(clientId)) {
    throw new Error(`VITE_CLIENT_ID inválido: "${clientId}" (use letras minúsculas, números e hífen)`)
  }

  // Each build only ever sees its own client's extension and registry file.
  const extensionEntry = resolve(root, `src/extensions/${clientId}/index.ts`)
  const registryFile = resolve(root, `clients/${clientId}.json`)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@client-extension': existsSync(extensionEntry)
          ? extensionEntry
          : resolve(root, 'src/core/extensions/empty.ts'),
        '@client-registry': existsSync(registryFile)
          ? registryFile
          : resolve(root, 'clients/_template.json'),
      },
    },
    define: {
      __BASE_VERSION__: JSON.stringify(pkg.version),
      __CLIENT_ID__: JSON.stringify(clientId),
    },
  }
})
