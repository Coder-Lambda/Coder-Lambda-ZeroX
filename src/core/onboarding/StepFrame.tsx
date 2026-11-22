import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { t } from '../i18n/pt-BR'
import { Blobs } from '../ui/Blobs'
import { Logo } from '../ui/Logo'

interface StepFrameProps {
  index: number
  total: number
  onBack: () => void
  children: ReactNode
}

export function StepFrame({ index, total, onBack, children }: StepFrameProps) {
  const stepRef = useRef<HTMLDivElement>(null)

  // Move focus to the new page so keyboard and screen-reader users land on it.
  useEffect(() => {
    const step = stepRef.current
    const target = step?.querySelector<HTMLElement>('[data-autofocus]') ?? step?.querySelector<HTMLElement>('h1')
    target?.focus({ preventScroll: true })
  }, [index])

  return (
    <div className="frame ob-frame">
      <Blobs />
      <header className="ob-head">
        <Logo />
        <span className="ob-count num" aria-label={t.onboarding.progressLabel(index + 1, total)}>
          {t.onboarding.counter(index + 1, total)}
        </span>
      </header>
      <main className="ob-main">
        <div key={index} ref={stepRef} className="ob-step stagger">
          {children}
        </div>
      </main>
      <footer className="ob-foot">
        {index > 0 ? (
          <button type="button" className="btn btn-ghost tactile" onClick={onBack}>
            <ArrowLeft />
            {t.common.back}
          </button>
        ) : (
          <span />
        )}
        <div className="ob-dots" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`ob-dot${i < index ? ' is-done' : ''}${i === index ? ' is-current' : ''}`}
            />
          ))}
        </div>
      </footer>
    </div>
  )
}
