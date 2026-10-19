// The title at the top of every page: Cinzel heading, a short line of context, and optional actions.
import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-semibold text-gold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-ash">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
