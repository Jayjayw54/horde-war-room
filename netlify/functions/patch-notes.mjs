// Netlify Function: fetches Blizzard's "WoW Forever Beta Development Notes" forum thread.
// Browsers aren't allowed to read the Blizzard forums directly from our site (a security rule
// called CORS), so this runs on Netlify's server, fetches it, and hands the result to our page.
// The page itself picks out the class changes.

const TOPIC_URL = 'https://us.forums.blizzard.com/en/wow/t/2360696.json'

export default async () => {
  try {
    const res = await fetch(TOPIC_URL, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return Response.json({ error: `Blizzard forums replied ${res.status}` }, { status: 502 })
    }
    const body = await res.text()
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        // Let Netlify keep a copy for 30 minutes so we don't ask Blizzard on every page load.
        'Cache-Control': 'public, max-age=300',
        'Netlify-CDN-Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    })
  } catch (e) {
    return Response.json({ error: `Couldn't reach the Blizzard forums: ${e.message}` }, { status: 502 })
  }
}

export const config = { path: '/api/patch-notes' }
