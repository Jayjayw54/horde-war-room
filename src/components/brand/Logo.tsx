// The WARCALL logo: a war horn on a weathered crimson banner, inside a forged-iron crest.
// Drawn in SVG so it stays sharp at any size. public/favicon.svg is the same drawing.

// The war horn on its own (gold), for the hanging banner and other crimson backgrounds.
export function HornGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="16 12 36 30" className={className} aria-hidden>
      <path
        d="M50.2 14.6c1.2 2.6.1 5.7-2.4 6.9l-.9.4C41 29.6 32.4 35.9 21.4 39.4c-1.8.6-3.2-1.5-2-2.9l.4-.4C29 32 36.4 25.3 40.6 17.5l.3-.8c1.2-2.6 4.2-3.8 6.8-2.6z"
        fill="#c39a53"
      />
      <ellipse cx="46.6" cy="17" rx="4.4" ry="2.6" transform="rotate(48 46.6 17)" fill="#e0c58a" />
      <ellipse cx="46.9" cy="16.7" rx="3" ry="1.6" transform="rotate(48 46.9 16.7)" fill="#2a1d14" />
      <path d="M37.2 23.6l3.8 2.6M30.6 29.7l3 2.4" stroke="#7a5c2c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// The full crest: the standalone symbol (favicon, app icon, small screens).
export function WarcallMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M9 4h46v30c0 14-10.5 22.5-23 26C19.5 56.5 9 48 9 34z"
        fill="#1c2022"
        stroke="#7a8083"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M17 9h30v36l-15-8-15 8z" fill="#762f32" />
      <path d="M17 9h30v3.5H17z" fill="#552124" />
      <path
        d="M50.2 14.6c1.2 2.6.1 5.7-2.4 6.9l-.9.4C41 29.6 32.4 35.9 21.4 39.4c-1.8.6-3.2-1.5-2-2.9l.4-.4C29 32 36.4 25.3 40.6 17.5l.3-.8c1.2-2.6 4.2-3.8 6.8-2.6z"
        fill="#c39a53"
      />
      <ellipse cx="46.6" cy="17" rx="4.4" ry="2.6" transform="rotate(48 46.6 17)" fill="#e0c58a" />
      <ellipse cx="46.9" cy="16.7" rx="3" ry="1.6" transform="rotate(48 46.9 16.7)" fill="#2a1d14" />
      <path d="M37.2 23.6l3.8 2.6M30.6 29.7l3 2.4" stroke="#7a5c2c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// The wordmark. Cinzel, widely tracked, in parchment so it reads on dark iron and crimson alike.
export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-display font-bold tracking-[0.16em] ${className}`}>WARCALL</span>
}

// Horizontal lockup: crest + wordmark, for headers and the login screen.
export function LogoLockup({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const mark = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }[size]
  const word = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' }[size]
  return (
    <span className="inline-flex items-center gap-3">
      <WarcallMark className={`${mark} shrink-0`} />
      <Wordmark className={`${word} text-parchment`} />
    </span>
  )
}
