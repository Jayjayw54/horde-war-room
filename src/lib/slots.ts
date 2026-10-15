// Equipment slot numbers, as the game numbers them.
export const SLOT_NAMES: Record<number, string> = {
  1: 'Head', 2: 'Neck', 3: 'Shoulder', 4: 'Shirt', 5: 'Chest', 6: 'Waist', 7: 'Legs', 8: 'Feet', 9: 'Wrist',
  10: 'Hands', 11: 'Ring', 12: 'Ring', 13: 'Trinket', 14: 'Trinket', 15: 'Back', 16: 'Main hand', 17: 'Off hand',
  18: 'Ranged', 19: 'Tabard',
}

// Slots worth chasing BiS for (no shirt/tabard; one entry each for ring and trinket).
export const BIS_SLOTS = [1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 13, 16, 17, 18]
