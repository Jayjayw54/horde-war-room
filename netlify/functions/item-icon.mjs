// Netlify Function: looks up an item's icon on Wowhead by its item number.
// The game only tells addons a number for each icon, but Wowhead's tooltip data has the icon's name,
// which we turn into a picture URL. Results are cached for 30 days, since icons don't change.

export default async (_req, context) => {
  const id = Number(context.params.id)
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'bad item id' }, { status: 400 })
  try {
    const res = await fetch(`https://nether.wowhead.com/classic/tooltip/item/${id}`)
    const data = res.ok ? await res.json() : null
    const icon = data?.icon ?? null
    return Response.json(
      { icon: icon ? `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg` : null, quality: data?.quality ?? null },
      { headers: { 'Cache-Control': 'public, max-age=86400', 'Netlify-CDN-Cache-Control': 'public, max-age=2592000' } },
    )
  } catch {
    return Response.json({ icon: null }, { status: 502 })
  }
}

export const config = { path: '/api/item-icon/:id' }
