// Hands the browser a file to save, e.g. WarRoomData.lua for the addon folder.
export function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
}

export function downloadGameData(lua: string) {
  if (lua) downloadText('WarRoomData.lua', lua)
}
