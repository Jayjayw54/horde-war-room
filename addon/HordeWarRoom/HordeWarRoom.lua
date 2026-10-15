-- Horde War Room exporter (v0.3.1).
-- Addons can't talk to websites. Instead, this records each character's details into
-- HordeWarRoomDB, which the game writes to a file (SavedVariables) when you log out or /reload.
-- The dashboard then imports that file.

local VERSION = "0.3.1"

---------------------------------------------------------------------------
-- Reading things from the game
---------------------------------------------------------------------------

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

-- Works with both the modern (C_Container) and older bag functions.
local function slotCount(bag)
  if C_Container and C_Container.GetContainerNumSlots then return C_Container.GetContainerNumSlots(bag) or 0 end
  if GetContainerNumSlots then return GetContainerNumSlots(bag) or 0 end
  return 0
end

local function slotItem(bag, slot)
  if C_Container and C_Container.GetContainerItemInfo then
    local info = C_Container.GetContainerItemInfo(bag, slot)
    if info then return info.itemID, info.stackCount, info.hyperlink, info.quality, info.iconFileID end
  elseif GetContainerItemInfo then
    local icon, count, _, quality, _, _, link, _, _, itemID = GetContainerItemInfo(bag, slot)
    return itemID, count, link, quality, icon
  end
end

-- Adds up every item in the given bags, e.g. { [2770] = { name = "Copper Ore", count = 23 } }.
local function readBags(bagIds)
  local items, slotsSeen = {}, 0
  for _, bag in ipairs(bagIds) do
    for slot = 1, slotCount(bag) do
      slotsSeen = slotsSeen + 1
      local id, count, link, quality, icon = slotItem(bag, slot)
      if id then
        local entry = items[id] or {
          name = link and link:match("%[(.-)%]") or ("Item " .. id), count = 0, quality = quality, icon = icon,
        }
        entry.count = entry.count + (count or 1)
        items[id] = entry
      end
    end
  end
  -- Save as a list (simpler for the dashboard to read).
  local list = {}
  for id, e in pairs(items) do
    table.insert(list, { id = id, name = e.name, count = e.count, quality = e.quality, icon = e.icon })
  end
  return list, slotsSeen
end

local function carriedBagIds()
  local ids = {}
  local last = NUM_TOTAL_EQUIPPED_BAG_SLOTS or NUM_BAG_SLOTS or 4
  for bag = 0, last do table.insert(ids, bag) end
  return ids
end

-- The bank can only be read while it's open. Classic and modern WoW number bank bags
-- differently, so we try both and read whichever exist.
local function bankBagIds()
  local ids = { BANK_CONTAINER or -1 }
  local first = (NUM_BAG_SLOTS or 4) + 1
  for bag = first, first + (NUM_BANKBAGSLOTS or 6) - 1 do table.insert(ids, bag) end
  if Enum and Enum.BagIndex then
    for i = 1, 6 do
      local tab = Enum.BagIndex["CharacterBankTab_" .. i]
      if tab then table.insert(ids, tab) end
    end
  end
  return ids
end

---------------------------------------------------------------------------
-- Saving a snapshot of the current character
---------------------------------------------------------------------------

local function currentCharacter()
  HordeWarRoomDB = HordeWarRoomDB or {}
  -- Data saved by the very first test version used the wrong name format, so start fresh.
  if HordeWarRoomDB.version ~= 2 then HordeWarRoomDB.characters = nil end
  HordeWarRoomDB.version = 2
  HordeWarRoomDB.addonVersion = VERSION
  HordeWarRoomDB.characters = HordeWarRoomDB.characters or {}

  -- Forever has no realms. UnitName gives the first name and the surname separately,
  -- and GetUnitName(..., true) joins them ("Jay Mcnut"). The full name is the key the dashboard matches on.
  local firstName, surname = UnitName("player")
  local fullName = GetUnitName("player", true) or firstName
  local c = HordeWarRoomDB.characters[fullName] or {}
  HordeWarRoomDB.characters[fullName] = c

  c.name = fullName
  c.firstName = firstName
  c.surname = surname
  c.race = (UnitRace("player"))
  c.class = (UnitClass("player"))
  c.classFile = select(2, UnitClass("player"))
  c.faction = (UnitFactionGroup("player"))
  return c
end

local function snapshot()
  local c = currentCharacter()
  c.level = UnitLevel("player")
  c.money = GetMoney() -- in copper: 1g = 10000
  c.xp = UnitXP("player")
  c.xpMax = UnitXPMax("player")
  c.rested = GetXPExhaustion() or 0
  c.updated = time()

  -- While logging in, the game can briefly report no professions.
  -- Never let an empty reading wipe out professions we already recorded.
  local professions = readProfessions()
  if #professions > 0 or not c.professions then c.professions = professions end

  local bags, slotsSeen = readBags(carriedBagIds())
  if slotsSeen > 0 then c.bags = bags end -- 0 slots means the bags hadn't loaded yet
  return c
end

local function snapshotBank()
  local c = currentCharacter()
  local bank, slotsSeen = readBags(bankBagIds())
  if slotsSeen > 0 then
    c.bank = bank
    c.bankUpdated = time()
  end
end

---------------------------------------------------------------------------
-- When to take readings
---------------------------------------------------------------------------

local frame = CreateFrame("Frame")
local pending = false

-- Many events can fire at once (e.g. looting fires several), so wait a second and take one reading.
local function snapshotSoon()
  if pending then return end
  pending = true
  C_Timer.After(1, function()
    pending = false
    snapshot()
  end)
end

-- pcall = "try it, and don't crash if this game version doesn't have that event".
for _, event in ipairs({
  "PLAYER_LOGIN", "PLAYER_LEVEL_UP", "SKILL_LINES_CHANGED", "TRADE_SKILL_LIST_UPDATE",
  "PLAYER_MONEY", "PLAYER_XP_UPDATE", "UPDATE_EXHAUSTION", "BAG_UPDATE_DELAYED",
  "BANKFRAME_OPENED", "PLAYERBANKSLOTS_CHANGED", "PLAYER_LOGOUT",
}) do
  pcall(frame.RegisterEvent, frame, event)
end

local bankOpen = false
frame:SetScript("OnEvent", function(_, event)
  if event == "PLAYER_LOGIN" then
    -- Profession and bag data load a few seconds after login, so take another reading once they're there.
    snapshot()
    C_Timer.After(5, snapshot)
  elseif event == "PLAYER_LOGOUT" then
    -- Only note the time: by now the game has already unloaded professions and bags.
    if HordeWarRoomDB and HordeWarRoomDB.characters then
      local c = HordeWarRoomDB.characters[GetUnitName("player", true) or UnitName("player")]
      if c then c.lastPlayed = time() end
    end
  elseif event == "BANKFRAME_OPENED" then
    bankOpen = true
    C_Timer.After(0.5, snapshotBank)
  elseif event == "PLAYERBANKSLOTS_CHANGED" then
    snapshotBank()
  elseif event == "BAG_UPDATE_DELAYED" and bankOpen then
    snapshotBank()
    snapshotSoon()
  else
    snapshotSoon()
  end
end)

-- Bank closes: stop treating bag changes as bank changes.
pcall(frame.RegisterEvent, frame, "BANKFRAME_CLOSED")
frame:HookScript("OnEvent", function(_, event)
  if event == "BANKFRAME_CLOSED" then bankOpen = false end
end)

---------------------------------------------------------------------------
-- Chat commands
---------------------------------------------------------------------------

local function formatMoney(copper)
  copper = copper or 0
  return string.format("%dg %ds %dc", math.floor(copper / 10000), math.floor(copper / 100) % 100, copper % 100)
end

-- /hwr shows what the addon has recorded for this character, so you can check it's working.
SLASH_HORDEWARROOM1 = "/hwr"
SlashCmdList.HORDEWARROOM = function()
  local c = snapshot()
  print("|cffc8a04fHorde War Room v" .. VERSION .. "|r recorded: " .. c.name .. ", level " .. c.level .. " " .. c.race .. " " .. c.class)
  print("  Gold: " .. formatMoney(c.money) .. "   XP: " .. c.xp .. "/" .. c.xpMax .. "   Rested: " .. c.rested)
  if #c.professions == 0 then
    print("  No professions found.")
  else
    for _, p in ipairs(c.professions) do
      print("  " .. p.name .. " " .. p.skill .. "/" .. p.max)
    end
  end
  print("  Bags: " .. #(c.bags or {}) .. " different items.   Bank: " ..
    (c.bank and (#c.bank .. " different items") or "not seen yet (open your bank once)"))
  print("  Type /reload to save it to the file the dashboard reads.")
end

-- /hwrdebug: an investigation tool, for when something in Forever works differently than expected.
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

  print("|cffc8a04f--- Horde War Room debug ---|r")
  try("GetUnitName", function() return GetUnitName("player", true) end)
  try("GetProfessions", function() return GetProfessions() end)
  try("Money / XP / XPMax / Rested", function() return GetMoney(), UnitXP("player"), UnitXPMax("player"), GetXPExhaustion() end)
  try("C_Container", function() return C_Container ~= nil, C_Container and C_Container.GetContainerNumSlots ~= nil end)
  try("Bag slots 0-5", function() return slotCount(0), slotCount(1), slotCount(2), slotCount(3), slotCount(4), slotCount(5) end)
  local ids = bankBagIds()
  local parts = {}
  for _, id in ipairs(ids) do parts[#parts + 1] = id .. "=" .. slotCount(id) end
  print("|cffc8a04fBank bags (open bank first)|r = " .. table.concat(parts, ", "))
end
