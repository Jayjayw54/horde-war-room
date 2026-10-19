// A small set of line icons, all drawn the same way (24px grid, 1.75 stroke, round joins), so features
// look like one family. They inherit the text colour. Decorative: always paired with a text label.
import type { ReactNode } from 'react'

function Icon({ children, className = 'h-6 w-6' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

type P = { className?: string }

// Two figures side by side: the crew roster.
export const RosterIcon = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="8.5" cy="8" r="3" />
    <circle cx="16" cy="9" r="2.5" />
    <path d="M3.5 19c.6-3.4 2.6-5.2 5-5.2s4.4 1.8 5 5.2M14 14.4c.6-.3 1.3-.4 2-.4 2 0 3.6 1.5 4.2 4.6" />
  </Icon>
)

// A list with ticks: orders.
export const OrdersIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5" />
    <path d="M11 7h9M11 13h9M11 19h6" />
  </Icon>
)

// A banded chest: the shared stores.
export const StoresIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M3.5 10a3.5 3.5 0 0 1 3.5-3.5h10a3.5 3.5 0 0 1 3.5 3.5v9h-17z" />
    <path d="M3.5 12h17M8 6.5v12.5M16 6.5v12.5" />
    <path d="M11 11h2v3h-2z" />
  </Icon>
)

// A hammer over an anvil: the profession planner.
export const PlannerIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M4 20h12M6 20l1.5-3.5h7L16 20M5 16.5h14v-2.5H5z" />
    <path d="M13.5 3.5l4 4M15.5 5.5l-6 6" />
  </Icon>
)

// A shield with a star: best-in-slot wishlists.
export const WishlistIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M12 3l7 2.5v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V5.5z" />
    <path d="M12 8.2l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" />
  </Icon>
)

// A rising line: progress.
export const ProgressIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M4 20h16M4 20V4" />
    <path d="M7 16l4-4.5 3 2.5 5-6.5" />
    <path d="M16 7.5h3v3" />
  </Icon>
)

// A scroll: the addon and the in-game window.
export const ScrollIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1z" />
    <path d="M7 16V4M17 8H7M10 11h4M10 14h4" />
  </Icon>
)

// Two arrows in a loop: sync.
export const SyncIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5" />
    <path d="M5 3.5v4h4M19 20.5v-4h-4" />
  </Icon>
)

// Chain links: invite / bond.
export const LinkIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Icon>
)

// A quill: chronicle / activity.
export const ChronicleIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M19.5 4.5c-6 0-11 4.5-12.5 12l-2.5 3" />
    <path d="M19.5 4.5c0 6-4 10-10 11.5M10 11.5l4 .5" />
  </Icon>
)

// A keep with a gate: the Stronghold.
export const StrongholdIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M4 20V9h2V6h2v3h2V6h4v3h2V6h2v3h2v11z" />
    <path d="M10 20v-4a2 2 0 0 1 4 0v4" />
  </Icon>
)

// A pennant on a pole: the crew.
export const BannerIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M6 21V3" />
    <path d="M6 4h12l-3 4 3 4H6" />
  </Icon>
)

// A cog: settings.
export const SettingsIcon = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </Icon>
)

// A magnifying glass: search.
export const SearchIcon = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icon>
)

// Three lines: open the menu.
export const MenuIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

// A cross: close.
export const CloseIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

// An open book: notes and patch notes.
export const BookIcon = ({ className }: P) => (
  <Icon className={className}>
    <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" />
    <path d="M12 6.5v13" />
  </Icon>
)
