// THE BLOODBOUND logo: a weathered crimson banner hanging from a blackened iron crest, carrying the
// oath mark (a blood drop bound inside a ring). Drawn in SVG so it stays sharp at any size.
// public/favicon.svg is the same drawing as BloodboundMark.

// The oath mark on its own (antique gold), for crimson backgrounds like the hanging banner.
export function OathGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="21 17 22 22" className={className} aria-hidden>
      <circle cx="32" cy="28" r="9.5" fill="none" stroke="#c39a53" strokeWidth="2.4" />
      <path d="M32 20.5c2.8 4 5.2 7 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-2.8 2.4-5.8 5.2-9.8z" fill="#c39a53" />
      <path d="M30.2 29.6a2.2 2.2 0 0 0 1.4 2.5" stroke="#e6cf9a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// The full crest: the standalone symbol (favicon, app icon, small screens).
export function BloodboundMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M8 8h48v26c0 13-10 21-24 26C18 55 8 47 8 34z"
        fill="#1c2022"
        stroke="#4a4648"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="6" y="6" width="52" height="5" rx="1.5" fill="#2e2b2d" stroke="#5a5557" strokeWidth="1" />
      <circle cx="7.5" cy="8.5" r="2.6" fill="#9f7a42" />
      <circle cx="56.5" cy="8.5" r="2.6" fill="#9f7a42" />
      <path d="M17 11h30v37l-15-8-15 8z" fill="#76282e" />
      <path d="M17 11h30v3H17z" fill="#4b1d22" />
      <path d="M20 14v31M44 14v31" stroke="#4b1d22" strokeWidth="1" opacity=".8" />
      <circle cx="32" cy="28" r="9.5" fill="none" stroke="#c39a53" strokeWidth="2.4" />
      <path d="M32 20.5c2.8 4 5.2 7 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-2.8 2.4-5.8 5.2-9.8z" fill="#c39a53" />
      <path d="M30.2 29.6a2.2 2.2 0 0 0 1.4 2.5" stroke="#e6cf9a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// The wordmark: a small gold THE over BLOODBOUND in Cinzel. `compact` drops the THE.
export function Wordmark({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      {!compact && <span className="mb-1 font-display text-[0.42em] font-semibold tracking-[0.42em] text-gold">THE</span>}
      <span className="font-display font-bold tracking-[0.1em]">BLOODBOUND</span>
    </span>
  )
}

// Horizontal lockup: crest + wordmark, for the landing page and sign-in.
export function LogoLockup({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const mark = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16 sm:h-20 sm:w-20' }[size]
  const word = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl sm:text-5xl' }[size]
  return (
    <span className="inline-flex items-center gap-3 sm:gap-4">
      <BloodboundMark className={`${mark} shrink-0`} />
      <Wordmark className={`${word} items-start! text-parchment`} />
    </span>
  )
}
