import { useRef, useState } from 'react'
import { t } from '../i18n/pt-BR'
import { Logo } from '../ui/Logo'

interface IntroVideoProps {
  onDone: () => void
  caption?: string
  sub?: string
  counter?: string
}

/** The ZeroX animation, full screen. Under reduced motion it shows the still logo instead. */
export function IntroVideo({ onDone, caption, sub, counter }: IntroVideoProps) {
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDone()
  }

  return (
    <div className="intro">
      {counter && <span className="intro-count num">{counter}</span>}
      {reduceMotion ? (
        <Logo className="intro-logo" />
      ) : (
        <video
          className="intro-video"
          src="/intro/zerox-intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={finish}
          onError={finish}
        />
      )}
      <div className="intro-overlay">
        {caption && (
          <div className="stagger flex flex-col items-center gap-1">
            <p className="intro-caption">{caption}</p>
            {sub && <p className="text-white/60">{sub}</p>}
          </div>
        )}
        <button type="button" className="btn btn-secondary tactile" onClick={finish}>
          {reduceMotion ? t.common.continue : t.common.skip}
        </button>
      </div>
    </div>
  )
}
