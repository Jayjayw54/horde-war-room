// Small display helpers.

// WoW money is stored in copper: 1 gold = 100 silver = 10,000 copper.
export function splitMoney(copper: number) {
  return { gold: Math.floor(copper / 10000), silver: Math.floor(copper / 100) % 100, copper: copper % 100 }
}

// "just now", "5 minutes ago", "3 days ago"...
export function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  const units: [number, string][] = [
    [60 * 60 * 24 * 7, 'week'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ]
  for (const [size, name] of units) {
    const n = Math.floor(seconds / size)
    if (n >= 1) return `${n} ${name}${n === 1 ? '' : 's'} ago`
  }
  return 'just now'
}
