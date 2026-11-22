import { Navigate } from 'react-router-dom'
import { t } from '../i18n/pt-BR'
import { Blobs } from '../ui/Blobs'
import { Logo } from '../ui/Logo'
import { useSession } from './SessionProvider'

/** Shell of the Google sign-in. Real OAuth arrives with Supabase Auth. */
export function SignInPage() {
  const { account, signIn } = useSession()
  if (account) return <Navigate to="/" replace />

  return (
    <div className="frame signin">
      <Blobs />
      <div className="glass signin-card stagger">
        <Logo />
        <div>
          <h1 className="text-[26px] font-medium tracking-tight">{t.signIn.title}</h1>
          <p className="text-2 mt-2">{t.signIn.sub}</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg tactile w-full" onClick={signIn}>
          <GoogleMark />
          {t.signIn.google}
        </button>
        <p className="text-2 text-[12.5px]">{t.signIn.mockNote}</p>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
