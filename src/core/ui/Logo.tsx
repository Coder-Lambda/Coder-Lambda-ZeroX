/** The ZeroX wordmark, or only its stylish X (`mark`), used in the sidebar. */
export function Logo({ className = 'logo', mark = false }: { className?: string; mark?: boolean }) {
  return mark ? (
    <img src="/brand/zerox-mark.png" alt="ZeroX" className={className} width={497} height={388} />
  ) : (
    <img src="/brand/zerox-logo.png" alt="ZeroX" className={className} width={1600} height={424} />
  )
}
