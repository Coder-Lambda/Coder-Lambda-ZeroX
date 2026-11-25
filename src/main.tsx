import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/outfit'
import './core/styles/index.css'
import { App } from './App'

async function start() {
  // Shareable demo only (VITE_DEMO_SEED=1): fill this browser with a sample business before the app reads it.
  // A normal build drops this branch and never ships the sample data.
  if (import.meta.env.VITE_DEMO_SEED === '1') {
    const { seedDemoData } = await import('./core/data/demoSeed')
    seedDemoData()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
