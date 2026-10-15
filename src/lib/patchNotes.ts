// Turns Blizzard's beta development notes (forum posts) into per-class change lists.

export const CLASSES = ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior']

export interface Note {
  text: string
  children: Note[]
}

export interface PatchUpdate {
  id: number
  date: Date
  url: string
  classes: Record<string, Note[]>
}

interface ForumPost {
  id: number
  post_number: number
  post_type: number
  staff: boolean
  created_at: string
  cooked: string
}

// Reads a <ul> into plain text items (never inserting the forum's HTML into our page).
function readList(ul: Element): Note[] {
  return Array.from(ul.children)
    .filter((el) => el.tagName === 'LI')
    .map((li) => {
      const nested = Array.from(li.children).filter((el) => el.tagName === 'UL')
      const clone = li.cloneNode(true) as Element
      clone.querySelectorAll('ul').forEach((n) => n.remove())
      return { text: (clone.textContent ?? '').replace(/\s+/g, ' ').trim(), children: nested.flatMap(readList) }
    })
    .filter((n) => n.text || n.children.length)
}

// In the notes, each class is a list item that starts with the class name in bold,
// followed by a nested list of its changes.
function readClasses(html: string): Record<string, Note[]> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const result: Record<string, Note[]> = {}
  for (const li of Array.from(doc.querySelectorAll('li'))) {
    const label = li.querySelector(':scope > strong, :scope > p > strong')
    const name = label?.textContent?.trim()
    if (!name || !CLASSES.includes(name)) continue
    const lists = Array.from(li.children).filter((el) => el.tagName === 'UL')
    if (lists.length) result[name] = [...(result[name] ?? []), ...lists.flatMap(readList)]
  }
  return result
}

export async function fetchPatchUpdates(): Promise<PatchUpdate[]> {
  const res = await fetch('/api/patch-notes')
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.post_stream) throw new Error(data?.error ?? `Couldn't load the notes (${res.status})`)
  const posts: ForumPost[] = data.post_stream.posts
  return posts
    .filter((p) => p.staff && p.post_type === 1)
    .map((p) => ({
      id: p.id,
      date: new Date(p.created_at),
      url: `https://us.forums.blizzard.com/en/wow/t/2360696/${p.post_number}`,
      classes: readClasses(p.cooked),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
