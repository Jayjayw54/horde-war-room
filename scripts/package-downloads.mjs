// Packs the addon and the launcher into zip files the website offers for download:
//   public/downloads/HordeWarRoom.zip       (unzip into Interface\AddOns)
//   public/downloads/WarRoomLauncher.zip    (unzip anywhere)
// Runs automatically at the start of `npm run build` (so Netlify always serves the latest), or by
// hand with `npm run package`. Uses only what comes with Node: no extra packages.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = join(root, 'public', 'downloads')
mkdirSync(out, { recursive: true })

// ---- A tiny zip writer ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function zip(files) {
  const parts = []
  const central = []
  let offset = 0
  // A fixed date (1 Jan 2026) so the same files always make the same zip.
  const time = 0
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8')
    const packed = deflateRawSync(data)
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0800, 6) // names are UTF-8
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    parts.push(local, nameBuf, packed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt16LE(time, 12)
    entry.writeUInt16LE(date, 14)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(packed.length, 20)
    entry.writeUInt32LE(data.length, 24)
    entry.writeUInt16LE(nameBuf.length, 28)
    entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBuf)
    offset += local.length + nameBuf.length + packed.length
  }
  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, centralBuf, end])
}

// Windows tools (Command Prompt, Notepad) want CRLF line endings.
const crlf = (buf) => Buffer.from(buf.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8')

// ---- The addon ----
const addonDir = join(root, 'addon', 'HordeWarRoom')
const addonFiles = readdirSync(addonDir)
  .filter((f) => /\.(lua|toc)$/.test(f))
  .map((f) => ({ name: `HordeWarRoom/${f}`, data: readFileSync(join(addonDir, f)) }))
writeFileSync(join(out, 'HordeWarRoom.zip'), zip(addonFiles))

// ---- The launcher ----
// Netlify tells the build its own web address (URL), so the launcher points at the right site.
const site = (process.env.URL || '').replace(/\/$/, '')
const launcherDir = join(root, 'launcher')
const launcherFiles = readdirSync(launcherDir).map((f) => {
  let data = readFileSync(join(launcherDir, f))
  if (f === 'WarRoomLauncher.ps1' && /^https:\/\//.test(site)) {
    data = Buffer.from(data.toString('utf8').replace(/^\$DefaultSite = '.*'$/m, `$DefaultSite = '${site}'`), 'utf8')
  }
  return { name: `Horde War Room Launcher/${f}`, data: crlf(data) }
})
writeFileSync(join(out, 'WarRoomLauncher.zip'), zip(launcherFiles))

console.log(`Packed ${addonFiles.length} addon files and ${launcherFiles.length} launcher files into public/downloads${site ? ` (site: ${site})` : ''}.`)
