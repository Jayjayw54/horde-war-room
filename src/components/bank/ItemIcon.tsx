import { useItemIcon } from '../../lib/itemIcons'

// WoW item rarity colours: poor, common, uncommon, rare, epic, legendary.
export const qualityColors = ['#9d9d9d', '#ffffff', '#1eff00', '#0070dd', '#a335ee', '#ff8000']
export const qualityColor = (q: number | null) => (q !== null && qualityColors[q]) || '#eadcb8'

export function ItemIcon({ itemId, name, quality, size }: { itemId: number; name: string; quality: number | null; size: number }) {
  const url = useItemIcon(itemId)
  const border = qualityColor(quality)
  return url ? (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded border-2 bg-ink"
      style={{ borderColor: border, width: size, height: size }}
    />
  ) : (
    // No picture (still loading, or Wowhead doesn't know this item): show its first letter instead.
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded border-2 bg-ink font-display font-bold"
      style={{ borderColor: border, color: border, width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0)}
    </span>
  )
}
