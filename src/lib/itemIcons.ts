// Fetches item icon pictures (via our /api/item-icon function) and remembers them,
// so each icon is only looked up once per browser.
import { useEffect, useState } from 'react'

const CACHE_KEY = 'hwr-item-icons'
const memory: Record<number, string | null> = loadCache()
const inFlight: Record<number, Promise<string | null | undefined>> = {}

function loadCache(): Record<number, string | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memory))
  } catch {
    /* storage full or blocked: icons just get looked up again next time */
  }
}

// Returns the icon URL, null if Wowhead has no icon for it, or undefined if the lookup failed (try again later).
async function lookup(itemId: number): Promise<string | null | undefined> {
  const res = await fetch(`/api/item-icon/${itemId}`)
  if (res.status === 404) return null
  if (!res.ok) return undefined
  const data = await res.json()
  // The live site's function returns a full URL; the local dev proxy returns Wowhead's raw data with an icon name.
  if (data.icon?.startsWith('http')) return data.icon
  return data.icon ? `https://wow.zamimg.com/images/wow/icons/medium/${data.icon}.jpg` : null
}

export function useItemIcon(itemId: number): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(memory[itemId])
  useEffect(() => {
    if (itemId in memory) return setUrl(memory[itemId])
    inFlight[itemId] ??= lookup(itemId).catch(() => undefined)
    let alive = true
    inFlight[itemId].then((result) => {
      if (result === undefined) {
        delete inFlight[itemId] // failed: allow a retry on the next visit
        if (alive) setUrl(null)
        return
      }
      memory[itemId] = result
      saveCache()
      if (alive) setUrl(result)
    })
    return () => {
      alive = false
    }
  }, [itemId])
  return url
}
