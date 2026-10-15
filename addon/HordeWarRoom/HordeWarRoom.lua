-- Horde War Room exporter.
-- Addons can't talk to websites. Instead, this records each character's details into
-- HordeWarRoomDB, which the game writes to a file (SavedVariables) when you log out or /reload.
-- The dashboard then imports that file.

-- Forever uses the modern professions system: GetProfessions() gives a list of slots
-- (some empty), and GetProfessionInfo(slot) gives each profession's name and skill.
local function readProfessions()
  local list = {}
  if not GetProfessions then return list end
  local slots = { GetProfessions() }
  for i = 1, select("#", GetProfessions()) do
    local slot = slots[i]
    if slot then
      local name, _, rank, maxRank = GetProfessionInfo(slot)
      if name then
        table.insert(list, { name = name, skill = rank, max = maxRank })
      end
    end
  end
  return list
end

local function snapshot()
  HordeWarRoomDB = HordeWarRoomDB or {}
  -- Data saved by the first test version used the wrong name format, so start fresh.
  if HordeWarRoomDB.version ~= 2 then HordeWarRoomDB.characters = nil end
  HordeWarRoomDB.characters = HordeWarRoomDB.characters or {}

  -- Forever has no realms. UnitName gives the first name and the surname separately,
  -- and GetUnitName(..., true) joins them ("Jay Mcnut"). The full name is the key the dashboard matches on.
  local firstName, surname = UnitName("player")
  local fullName = GetUnitName("player", true) or firstName

  -- While logging in or out, the game can briefly report no professions at all.
  -- Never let one of those empty readings wipe out professions we already recorded.
  local previous = HordeWarRoomDB.characters[fullName]
  local professions = readProfessions()
  if #professions == 0 and previous and previous.professions and #previous.professions > 0 then
    professions = previous.professions
  end

  HordeWarRoomDB.characters[fullName] = {
    name = fullName,
    firstName = firstName,
    surname = surname,
    race = (UnitRace("player")),
    class = (UnitClass("player")),
    classFile = select(2, UnitClass("player")),
    level = UnitLevel("player"),
    faction = (UnitFactionGroup("player")),
    professions = professions,
    updated = time(),
  }
  HordeWarRoomDB.version = 2
  return HordeWarRoomDB.characters[fullName]
end

-- Take a fresh snapshot whenever something we track might have changed.
local frame = CreateFrame("Frame")
-- pcall = "try it, and don't crash if this game version doesn't have that event".
for _, event in ipairs({ "PLAYER_LOGIN", "PLAYER_LEVEL_UP", "SKILL_LINES_CHANGED", "TRADE_SKILL_LIST_UPDATE", "PLAYER_LOGOUT" }) do
  pcall(frame.RegisterEvent, frame, event)
end
frame:SetScript("OnEvent", function(_, event)
  if event == "PLAYER_LEVEL_UP" then
    -- Level-up fires before UnitLevel updates, so wait a moment.
    C_Timer.After(1, snapshot)
  elseif event == "PLAYER_LOGIN" then
    -- Profession data loads a few seconds after login, so take another reading once it's there.
    snapshot()
    C_Timer.After(5, snapshot)
  else
    snapshot()
  end
end)

-- /hwr shows what the addon has recorded for this character, so you can check it's working.
SLASH_HORDEWARROOM1 = "/hwr"
SlashCmdList.HORDEWARROOM = function()
  local c = snapshot()
  print("|cffc8a04fHorde War Room|r recorded: " .. c.name .. ", level " .. c.level .. " " .. c.race .. " " .. c.class)
  if #c.professions == 0 then
    print("  No professions found.")
  else
    for _, p in ipairs(c.professions) do
      print("  " .. p.name .. " " .. p.skill .. "/" .. p.max)
    end
  end
  print("  Type /reload to save it to the file the dashboard reads.")
end

-- /hwrdebug: a one-off investigation tool. Forever is new, so we print everything the game
-- might use to store the surname and professions, and see which ones have the data.
SLASH_HORDEWARROOMDEBUG1 = "/hwrdebug"
SlashCmdList.HORDEWARROOMDEBUG = function()
  local function show(label, ...)
    local parts = {}
    for i = 1, select("#", ...) do parts[#parts + 1] = tostring((select(i, ...))) end
    print("|cffc8a04f" .. label .. "|r = " .. table.concat(parts, " | "))
  end
  local function try(label, fn)
    local results = { pcall(fn) }
    if results[1] then show(label, unpack(results, 2)) else print(label .. " not available") end
  end

  print("|cffc8a04f--- Horde War Room debug: names ---|r")
  try("UnitName", function() return UnitName("player") end)
  try("UnitFullName", function() return UnitFullName("player") end)
  try("GetUnitName", function() return GetUnitName("player", true) end)
  try("UnitPVPName", function() return UnitPVPName("player") end)
  try("CharacterName text", function() return CharacterNameText and CharacterNameText:GetText() end)
  try("CharacterFrame title", function() return CharacterFrameTitleText and CharacterFrameTitleText:GetText() end)

  print("|cffc8a04f--- skills ---|r")
  try("GetNumSkillLines", function() return GetNumSkillLines() end)
  if GetNumSkillLines then
    for i = 1, math.min(GetNumSkillLines(), 25) do
      local name, isHeader, _, rank, _, _, maxRank = GetSkillLineInfo(i)
      print("  " .. i .. ": " .. tostring(name) .. (isHeader and " [header]" or (" " .. tostring(rank) .. "/" .. tostring(maxRank))))
    end
  end
  try("GetProfessions", function() return GetProfessions() end)
  if GetProfessions then
    local slots = { GetProfessions() }
    for i = 1, select("#", GetProfessions()) do
      if slots[i] then
        try("  slot " .. i .. " (" .. slots[i] .. ")", function() return GetProfessionInfo(slots[i]) end)
      end
    end
  end
end
