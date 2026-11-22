import path from 'node:path'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const extensionsDir = path.resolve(import.meta.dirname, 'src/extensions') + path.sep

// Enforces the core rule of the architecture: the base never imports a client extension.
// Extensions are reached only through the build alias '@client-extension'.
const baseBoundary = {
  meta: {
    type: 'problem',
    messages: {
      noExtensionImport:
        'A base nunca importa de src/extensions. Carregue extensões apenas via @client-extension.',
    },
  },
  create(context) {
    const check = (node) => {
      const spec = node.source && node.source.value
      if (typeof spec !== 'string' || !spec.startsWith('.')) return
      const target = path.resolve(path.dirname(context.filename), spec)
      if ((target + path.sep).startsWith(extensionsDir)) {
        context.report({ node: node.source, messageId: 'noExtensionImport' })
      }
    }
    return {
      ImportDeclaration: check,
      ImportExpression: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    }
  },
}

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/extensions/**'],
    plugins: { zerox: { rules: { 'base-boundary': baseBoundary } } },
    rules: { 'zerox/base-boundary': 'error' },
  },
)
