// Saves characters from the addon's file into the database. Shared by the website's
// "Import from game" button and the sync function the launcher uses, so both behave exactly the same.
// (Only type imports here, so Node can run this file directly for the companion.)
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CharacterSnapshot } from './savedVariables'

export interface ImportResult {
  error: string | null
  summary: string[] // plain-language changes, e.g. "⬆️ **Jay Mcnut** dinged **21**"
}

interface Before {
  id: string
  name: string
  level: number
  gold: number
  player_id: string
  gear: { id: number; quality: number | null }[] | null
  professions: { id: string; name: string; skill_level: number }[]
}

interface Event {
  character_id: string
  kind: 'new' | 'ding' | 'skill' | 'profession' | 'gold' | 'recipe' | 'milestone' | 'epic'
  text: string
}

const LEVEL_MILESTONES: Record<number, string> = {
  10: 'hit level 10. Talents unlocked!',
  20: 'hit level 20.',
  30: 'hit level 30.',
  40: 'hit level 40. Mount time!',
  50: 'hit level 50.',
  60: 'hit level 60. Max level!',
}
const GOLD_MILESTONES = [10, 50, 100, 250, 500, 1000] // in gold, per toon
const SKILL_MILESTONES: Record<number, string> = { 75: 'Journeyman', 150: 'Expert', 225: 'Artisan', 300: 'master' }

const crossed = (before: number, after: number, mark: number) => before < mark && after >= mark

// ownerId: the player whose file this is. Only their toons are ever read or changed, so this is safe
//   to run with the server's all-access key too (the website's sync function does).
// partyPlayerIds: everyone in the owner's war parties, for "first of the war party to get there".
export async function importSnapshots(
  db: SupabaseClient,
  snapshots: CharacterSnapshot[],
  ownerId: string,
  partyPlayerIds: string[] = [],
): Promise<ImportResult> {
  // What's already stored for this player, to work out what changed.
  const { data: beforeRows, error: loadError } = await db
    .from('characters')
    .select('id, name, level, gold, player_id, gear, professions(id, name, skill_level)')
    .eq('player_id', ownerId)
  if (loadError) return { error: loadError.message, summary: [] }
  const all = (beforeRows ?? []) as Before[]
  const myIds = all.map((c) => c.id)

  // Levels of everyone else's toons in the party, for "first to get there".
  const others = partyPlayerIds.filter((p) => p !== ownerId)
  const { data: otherRows } =
    others.length > 0 ? await db.from('characters').select('level').in('player_id', others) : { data: [] }
  const otherLevels = (otherRows ?? []).map((r) => r.level as number)

  const none = { data: [] as { character_id: string; item_id?: number; profession?: string }[] }
  const { data: epicRows } =
    myIds.length > 0 ? await db.from('items').select('character_id, item_id').in('character_id', myIds).gte('quality', 4) : none
  const { data: recipeRows } =
    myIds.length > 0 ? await db.from('recipes').select('character_id, profession').in('character_id', myIds) : none

  const summary: string[] = []
  const events: Event[] = []
  const history: Record<string, unknown>[] = []

  for (const snap of snapshots) {
    const existing = all.find((c) => c.name.toLowerCase() === snap.name.toLowerCase())
    const details: Record<string, unknown> = {
      name: snap.name,
      race: snap.race,
      class: snap.className,
      level: Math.min(60, Math.max(1, snap.level)),
    }
    // Only overwrite these when the file has them (older addon versions didn't record them).
    if (snap.gold !== null) details.gold = snap.gold
    if (snap.xp !== null) details.xp = snap.xp
    if (snap.xpMax !== null) details.xp_max = snap.xpMax
    if (snap.rested !== null) details.rested_xp = snap.rested
    if (snap.lastPlayed) details.last_played = snap.lastPlayed.toISOString()
    if (snap.bankSeen) details.bank_seen_at = snap.bankSeen.toISOString()
    if (snap.stats) details.stats = snap.stats
    if (snap.gear) details.gear = snap.gear
    if (snap.weaponSkills) details.weapon_skills = snap.weaponSkills
    if (snap.raceFile) details.race_file = snap.raceFile
    if (snap.sex) details.sex = snap.sex

    let characterId = existing?.id
    if (characterId) {
      const { error } = await db.from('characters').update(details).eq('id', characterId)
      if (error) return { error: `${snap.name}: ${error.message}`, summary }
    } else {
      const { data, error } = await db.from('characters').insert({ ...details, player_id: ownerId }).select('id').single()
      if (error) return { error: `${snap.name}: ${error.message}`, summary }
      characterId = data.id as string
    }
    const id = characterId!
    const note = (kind: Event['kind'], text: string) => {
      summary.push(text)
      events.push({ character_id: id, kind, text })
    }

    // ---- What changed (for Discord and the activity feed) ----
    if (!existing) {
      note('new', `🆕 **${snap.name}** joined the roster (level ${snap.level} ${snap.race} ${snap.className})`)
    } else {
      if (snap.level > existing.level) note('ding', `⬆️ **${snap.name}** dinged **${snap.level}** (was ${existing.level})`)
      for (const [mark, text] of Object.entries(LEVEL_MILESTONES)) {
        if (crossed(existing.level, snap.level, Number(mark))) {
          const first = !all.some((c) => c.id !== existing.id && c.level >= Number(mark)) && !otherLevels.some((l) => l >= Number(mark))
          note('milestone', `🏆 **${snap.name}** ${text}${first ? ' First of the war party to get there.' : ''}`)
        }
      }
      for (const p of snap.professions) {
        const old = existing.professions.find((x) => x.name === p.name)
        if (!old) note('profession', `📜 **${snap.name}** learned ${p.name} (${p.skill}/${p.max})`)
        else {
          if (p.skill > old.skill_level) note('skill', `⚒️ **${snap.name}** ${p.name} ${old.skill_level} → ${p.skill}`)
          for (const [mark, rank] of Object.entries(SKILL_MILESTONES)) {
            if (crossed(old.skill_level, p.skill, Number(mark))) note('milestone', `🏆 **${snap.name}** reached ${mark} ${p.name} (${rank})`)
          }
        }
      }
      if (snap.gold !== null) {
        const before = existing.gold / 10000
        const after = snap.gold / 10000
        const diff = Math.trunc(after - before)
        if (Math.abs(diff) >= 1) note('gold', `💰 **${snap.name}** ${diff > 0 ? '+' : ''}${diff}g`)
        for (const mark of GOLD_MILESTONES) {
          if (crossed(before, after, mark)) note('milestone', `🏆 **${snap.name}** is sitting on ${mark}g`)
        }
      }
    }
    // New epics (purple items) worn or carried.
    const ownedEpics = new Set([
      ...(epicRows ?? []).filter((r) => r.character_id === id).map((r) => r.item_id as number),
      ...(existing?.gear ?? []).filter((g) => (g.quality ?? 0) >= 4).map((g) => g.id),
    ])
    const nowEpics = [
      ...((snap.gear ?? []) as { id: number; name: string; quality: number | null }[]),
      ...(snap.bags ?? []),
      ...(snap.bank ?? []),
    ].filter((i) => (i.quality ?? 0) >= 4 && !ownedEpics.has(i.id))
    for (const e of new Map(nowEpics.map((i) => [i.id, i])).values()) {
      if (existing) note('epic', `🟣 **${snap.name}** got an epic: **${e.name}**`)
    }

    // ---- Save the details ----
    if (snap.professions.length > 0) {
      const { error } = await db.from('professions').upsert(
        snap.professions.map((p) => ({ character_id: id, name: p.name, skill_level: p.skill, max_skill: p.max })),
        { onConflict: 'character_id,name' },
      )
      if (error) return { error: `${snap.name} professions: ${error.message}`, summary }
    }
    const keep = snap.professions.map((p) => p.name)
    const stale = (existing?.professions ?? []).filter((p) => !keep.includes(p.name)).map((p) => p.id)
    if (stale.length > 0) await db.from('professions').delete().in('id', stale)

    // Items: replace this toon's bags (and bank, if the bank was opened) with the file's list.
    for (const [location, list] of [
      ['bags', snap.bags],
      ['bank', snap.bank],
    ] as const) {
      if (!list) continue
      const del = await db.from('items').delete().eq('character_id', id).eq('location', location)
      if (del.error) return { error: `${snap.name} ${location}: ${del.error.message}`, summary }
      if (list.length === 0) continue
      const full = list.map((i) => ({
        character_id: id,
        location,
        item_id: i.id,
        name: i.name,
        quantity: i.count,
        quality: i.quality,
        ilvl: i.ilvl,
        min_level: i.minLevel,
        equip_loc: i.equipLoc,
        item_type: i.itemType,
        sub_type: i.subType,
      }))
      let ins = await db.from('items').insert(full)
      if (ins.error && /column/.test(ins.error.message)) {
        // The upgrade-finder columns aren't set up yet (update 8 not run): save the basics.
        ins = await db.from('items').insert(full.map(({ ilvl: _a, min_level: _b, equip_loc: _c, item_type: _d, sub_type: _e, ...rest }) => rest))
      }
      if (ins.error) return { error: `${snap.name} ${location}: ${ins.error.message}`, summary }
    }

    // Recipes: replace each profession the file has (the addon only knows professions whose window you opened).
    for (const [profession, list] of Object.entries(snap.recipes ?? {})) {
      const before = (recipeRows ?? []).filter((r) => r.character_id === id && r.profession === profession).length
      const del = await db.from('recipes').delete().eq('character_id', id).eq('profession', profession)
      if (del.error) break // recipes table not set up yet: skip quietly
      const unique = [...new Map(list.map((r) => [r.name, r])).values()] // some games list a recipe twice
      if (unique.length > 0) {
        await db.from('recipes').insert(
          unique.map((r) => ({
            character_id: id,
            profession,
            recipe_id: r.id,
            name: r.name,
            item_id: r.itemId,
            makes: r.makes,
            reagents: r.reagents,
          })),
        )
      }
      if (existing && before > 0 && unique.length > before) {
        const n = unique.length - before
        note('recipe', `📖 **${snap.name}** learned ${n} new ${profession} recipe${n === 1 ? '' : 's'}`)
      }
    }

    history.push({
      character_id: id,
      level: snap.level,
      xp: snap.xp,
      xp_max: snap.xpMax,
      gold: snap.gold,
      recorded_at: (snap.updated ?? new Date()).toISOString(),
    })
  }

  // Optional extras: if these tables aren't set up yet, the import still counts.
  await db.from('character_history').insert(history)
  if (events.length > 0) await db.from('events').insert(events)

  return { error: null, summary }
}

// Posts an import summary to Discord through the live site's Netlify Function.
export async function notifyDiscord(siteUrl: string, accessToken: string, who: string, count: number, lines: string[]) {
  try {
    await fetch(`${siteUrl}/api/discord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ title: `${who} imported ${count} ${count === 1 ? 'toon' : 'toons'}`, lines }),
    })
  } catch {
    /* Discord is a nice-to-have: never let it break an import */
  }
}
