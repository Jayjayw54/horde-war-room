// Gear upgrade finder: looks through every item either of you is carrying or has banked, and flags
// anything a toon could wear that has a higher item level than what they have on in that slot.
// Item level is a rough guide (it doesn't know your stat priorities), so these are suggestions.
import type { Character, Item } from '../types'

// Which equipment slot(s) each kind of item goes in (the game's slot numbers).
const SLOTS_FOR: Record<string, number[]> = {
  INVTYPE_HEAD: [1],
  INVTYPE_NECK: [2],
  INVTYPE_SHOULDER: [3],
  INVTYPE_CHEST: [5],
  INVTYPE_ROBE: [5],
  INVTYPE_WAIST: [6],
  INVTYPE_LEGS: [7],
  INVTYPE_FEET: [8],
  INVTYPE_WRIST: [9],
  INVTYPE_HAND: [10],
  INVTYPE_FINGER: [11, 12],
  INVTYPE_TRINKET: [13, 14],
  INVTYPE_CLOAK: [15],
  INVTYPE_WEAPON: [16, 17],
  INVTYPE_2HWEAPON: [16],
  INVTYPE_WEAPONMAINHAND: [16],
  INVTYPE_WEAPONOFFHAND: [17],
  INVTYPE_SHIELD: [17],
  INVTYPE_HOLDABLE: [17],
  INVTYPE_RANGED: [18],
  INVTYPE_RANGEDRIGHT: [18],
  INVTYPE_THROWN: [18],
  INVTYPE_RELIC: [18],
}

// Armor each class can wear (Classic rules: mail/plate unlock at level 40).
function armorAllowed(className: string, level: number): string[] {
  const heavy = level >= 40
  switch (className) {
    case 'Warrior':
    case 'Paladin':
      return heavy ? ['Cloth', 'Leather', 'Mail', 'Plate'] : ['Cloth', 'Leather', 'Mail']
    case 'Hunter':
    case 'Shaman':
      return heavy ? ['Cloth', 'Leather', 'Mail'] : ['Cloth', 'Leather']
    case 'Rogue':
    case 'Druid':
      return ['Cloth', 'Leather']
    default:
      return ['Cloth']
  }
}
const SHIELD_CLASSES = ['Warrior', 'Paladin', 'Shaman']

export interface Upgrade {
  toon: Character
  item: Item
  holder: Character // who has it now
  slotNumber: number
  current: string | null // what's equipped there now
  gain: number // item levels better
}

export function findUpgrades(characters: Character[], items: Item[]): Upgrade[] {
  const found: Upgrade[] = []
  const wearable = items.filter((i) => i.equipLoc && i.ilvl && SLOTS_FOR[i.equipLoc])

  for (const toon of characters) {
    if (!toon.gear) continue // no gear recorded yet: nothing to compare against
    const allowedArmor = armorAllowed(toon.className, toon.level)
    const best = new Map<number, Upgrade>() // best suggestion per item

    for (const item of wearable) {
      if (item.minLevel && item.minLevel > toon.level) continue
      if (item.itemType === 'Armor') {
        if (item.subType === 'Shields' && !SHIELD_CLASSES.includes(toon.className)) continue
        if (['Cloth', 'Leather', 'Mail', 'Plate'].includes(item.subType ?? '') && !allowedArmor.includes(item.subType!)) continue
      }
      for (const slot of SLOTS_FOR[item.equipLoc!]) {
        const worn = toon.gear.find((g) => g.slot === slot)
        // Weapons: only compare like with like (a dagger against a dagger), since we can't tell what
        // weapon types a toon has trained.
        if (item.itemType === 'Weapon' && (!worn || worn.subType !== item.subType)) continue
        if (worn?.id === item.itemId) continue
        const wornIlvl = worn?.ilvl ?? 0
        const gain = item.ilvl! - wornIlvl
        if (gain <= 0) continue
        const holder = characters.find((c) => c.id === item.characterId)
        if (!holder) continue
        const prev = best.get(item.itemId)
        if (!prev || gain > prev.gain) {
          best.set(item.itemId, { toon, item, holder, slotNumber: slot, current: worn?.name ?? null, gain })
        }
      }
    }
    found.push(...best.values())
  }
  return found.sort((a, b) => b.gain - a.gain)
}
