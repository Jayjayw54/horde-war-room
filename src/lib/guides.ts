// Icy Veins WoW: Forever spec guides (each has a gear and stat priority section).
const base = 'https://www.icy-veins.com/wow-forever/'

export const SPEC_GUIDES: Record<string, { spec: string; url: string }[]> = {
  Druid: [
    { spec: 'Balance', url: `${base}balance-druid-ranged-dps-pve-guide` },
    { spec: 'Feral', url: `${base}feral-druid-melee-dps-and-tank-pve-guide` },
    { spec: 'Restoration', url: `${base}restoration-druid-healer-pve-guide` },
  ],
  Hunter: [
    { spec: 'Beast Mastery', url: `${base}beast-mastery-hunter-ranged-dps-pve-guide` },
    { spec: 'Marksmanship', url: `${base}marksmanship-hunter-ranged-dps-pve-guide` },
    { spec: 'Survival', url: `${base}survival-hunter-melee-dps-pve-guide` },
  ],
  Mage: [
    { spec: 'Arcane', url: `${base}arcane-mage-ranged-dps-pve-guide` },
    { spec: 'Fire', url: `${base}fire-mage-ranged-dps-pve-guide` },
    { spec: 'Frost', url: `${base}frost-mage-ranged-dps-pve-guide` },
  ],
  Paladin: [
    { spec: 'Holy', url: `${base}holy-paladin-healer-pve-guide` },
    { spec: 'Protection', url: `${base}protection-paladin-tank-pve-guide` },
    { spec: 'Retribution', url: `${base}retribution-paladin-melee-dps-pve-guide` },
  ],
  Priest: [
    { spec: 'Discipline', url: `${base}discipline-priest-healer-pve-guide` },
    { spec: 'Holy', url: `${base}holy-priest-healer-pve-guide` },
    { spec: 'Shadow', url: `${base}shadow-priest-ranged-dps-pve-guide` },
  ],
  Rogue: [
    { spec: 'Assassination', url: `${base}assassination-rogue-melee-dps-pve-guide` },
    { spec: 'Combat', url: `${base}combat-rogue-melee-dps-pve-guide` },
    { spec: 'Subtlety', url: `${base}subtlety-rogue-melee-dps-pve-guide` },
  ],
  Shaman: [
    { spec: 'Elemental', url: `${base}elemental-shaman-ranged-dps-pve-guide` },
    { spec: 'Enhancement', url: `${base}enhancement-shaman-melee-dps-pve-guide` },
    { spec: 'Restoration', url: `${base}restoration-shaman-healer-pve-guide` },
  ],
  Warlock: [
    { spec: 'Affliction', url: `${base}affliction-warlock-ranged-dps-pve-guide` },
    { spec: 'Demonology', url: `${base}demonology-warlock-ranged-dps-pve-guide` },
    { spec: 'Destruction', url: `${base}destruction-warlock-ranged-dps-pve-guide` },
  ],
  Warrior: [
    { spec: 'Arms', url: `${base}arms-warrior-melee-dps-pve-guide` },
    { spec: 'Fury', url: `${base}fury-warrior-melee-dps-pve-guide` },
    { spec: 'Protection', url: `${base}protection-warrior-tank-pve-guide` },
  ],
}
