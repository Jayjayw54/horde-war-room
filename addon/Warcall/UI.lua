-- Warcall: the in-game window (/warcall).
--
-- It shows what the website knows, from WarcallData.lua in this folder. The launcher (or the website's
-- "Download in-game data" button) writes that file; the game reads it at login and on /reload.
--   Orders  : tonight's orders and the rest of the to-do list. Tick them off here.
--   Who has : search everyone's bags and banks.
--   Needs   : materials still missing for planned crafts ("Get 20 Copper Ore").
--   Party   : everyone's toons, levels and professions.
--
-- Addons can't go online, so ticking an order off is written down in WarcallDB.actions.
-- The next sync (on /reload or logout) carries it to the website.

local _, ns = ...
ns = ns or {}

local WIDTH, HEIGHT = 560, 440
local ROW = 18

-- Colours (hex without the leading "ff").
local GOLD, ASH, RED, GREEN = "c8a04f", "9a8f80", "d0412f", "1eff00"
local QUALITY = { [0] = "9d9d9d", "ffffff", "1eff00", "0070dd", "a335ee", "ff8000", "e6cc80" }
local CLASS = {
  Warrior = "c69b6d", Rogue = "fff468", Mage = "3fc7eb", Priest = "ffffff", Warlock = "8788ee",
  Hunter = "aad372", Shaman = "0070dd", Druid = "ff7c0a", Paladin = "f48cba",
}
local CATEGORY = { profession = "Profession", farming = "Farming", dungeon = "Dungeon", gear = "Gear", gold = "Gold", other = "Other" }

local function color(hex, text) return "|cff" .. hex .. tostring(text) .. "|r" end

local function ago(t)
  if not t then return "never" end
  local s = time() - t
  if s < 60 then return "just now" end
  if s < 3600 then return math.floor(s / 60) .. " min ago" end
  if s < 86400 then return math.floor(s / 3600) .. " h ago" end
  return math.floor(s / 86400) .. " days ago"
end

---------------------------------------------------------------------------
-- Reading the Warcall data
---------------------------------------------------------------------------

local state = { tab = "orders", party = 1, search = "" }

local function data() return WarcallData end

local function currentParty()
  local d = data()
  if not d or not d.parties or #d.parties == 0 then return nil end
  if state.party > #d.parties then state.party = 1 end
  return d.parties[state.party]
end

local function playerName(id)
  local d = data()
  return (d and d.players and d.players[id]) or id or "?"
end

local function isMember(party, playerId)
  for _, m in ipairs(party.members or {}) do
    if m == playerId then return true end
  end
  return false
end

-- Toons belonging to the party's members.
local function partyToons(party)
  local list, d = {}, data()
  for _, t in ipairs((d and d.toons) or {}) do
    if isMember(party, t.player) then list[#list + 1] = t end
  end
  return list
end

local function whoLabel(party, who)
  if who == "everyone" then return #(party.members or {}) == 2 and "Both" or "Everyone" end
  return playerName(who)
end

-- An order's status, counting anything ticked here that hasn't synced yet.
local function pendingAction(id)
  return WarcallDB and WarcallDB.actions and WarcallDB.actions[id]
end

local function statusOf(order)
  local a = pendingAction(order.id)
  return (a and a.status) or order.status
end

local function setStatus(order, status)
  WarcallDB = WarcallDB or {}
  WarcallDB.actions = WarcallDB.actions or {}
  if status == order.status then
    WarcallDB.actions[order.id] = nil -- back to how the website has it: nothing to send
  else
    WarcallDB.actions[order.id] = { status = status, at = time() }
  end
end

-- Totals of one item across the party: total count, and "Toon 5 (bags)" pieces.
local function holdings(party, item)
  local toons = {}
  for _, t in ipairs(partyToons(party)) do toons[t.name] = true end
  local total, parts = 0, {}
  for _, h in ipairs(item.holders or {}) do
    if toons[h.toon] then
      total = total + (h.n or 0)
      parts[#parts + 1] = h.toon .. " " .. (h.n or 0) .. " (" .. (h.where or "?") .. ")"
    end
  end
  return total, parts
end

local function findItemByName(name)
  local d = data()
  local lower = string.lower(name)
  for _, item in ipairs((d and d.items) or {}) do
    if string.lower(item.name or "") == lower then return item end
  end
  return nil
end

---------------------------------------------------------------------------
-- Building the window
---------------------------------------------------------------------------

local frame, scroll, content, title, statusLine, partyButton, searchBox, tabs
local rows = {}

-- Try a Blizzard template, and fall back to a plain frame if this game version doesn't have it.
local function make(kind, name, parent, template)
  if template then
    local ok, f = pcall(CreateFrame, kind, name, parent, template)
    if ok and f then return f end
  end
  return CreateFrame(kind, name, parent)
end

-- One reusable line in the list: an optional tick box and a line of text.
local function getRow(i)
  if rows[i] then return rows[i] end
  local r = CreateFrame("Frame", nil, content)
  r:SetSize(WIDTH - 60, ROW)
  r:SetPoint("TOPLEFT", content, "TOPLEFT", 0, -(i - 1) * ROW)
  r.check = make("CheckButton", nil, r, "UICheckButtonTemplate")
  r.check:SetSize(ROW + 2, ROW + 2)
  r.check:SetPoint("LEFT", r, "LEFT", -2, 0)
  r.text = r:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  r.text:SetJustifyH("LEFT")
  r.text:SetWordWrap(false)
  r.text:SetPoint("LEFT", r, "LEFT", 22, 0)
  r.text:SetPoint("RIGHT", r, "RIGHT", 0, 0)
  rows[i] = r
  return r
end

local lines -- what the current tab wants to show: { { text =, check = order or nil, indent = n }, ... }

local function addLine(text, order, indent)
  lines[#lines + 1] = { text = text, order = order, indent = indent or 0 }
end

---------------------------------------------------------------------------
-- The tabs
---------------------------------------------------------------------------

local function ordersTab(party)
  local tonight, rest, done = {}, {}, 0
  for _, o in ipairs(party.orders or {}) do
    if o.tonight then tonight[#tonight + 1] = o else rest[#rest + 1] = o end
    if statusOf(o) == "done" then done = done + 1 end
  end

  local function show(o)
    local s = statusOf(o)
    local label = o.title
    if s == "done" then label = color(ASH, label) end
    local extra = color(ASH, "  " .. whoLabel(party, o.who) .. " · " .. (CATEGORY[o.category] or o.category or ""))
    if s == "doing" then extra = extra .. color(GOLD, " · in progress") end
    if pendingAction(o.id) then extra = extra .. color(GREEN, " · syncs on /reload") end
    addLine(label .. extra, o, 0)
  end

  addLine(color(GOLD, "Tonight's orders") .. color(ASH, "  (" .. done .. " ticked off)"))
  if #tonight == 0 then addLine(color(ASH, "Nothing planned for tonight."), nil, 1) end
  for _, o in ipairs(tonight) do show(o) end
  addLine(" ")
  addLine(color(GOLD, "Other orders"))
  local any = false
  for _, o in ipairs(rest) do
    if statusOf(o) ~= "done" or pendingAction(o.id) then show(o); any = true end
  end
  if not any then addLine(color(ASH, "All clear."), nil, 1) end
end

local function whoHasTab(party)
  local query = string.lower(strtrim and strtrim(state.search) or state.search)
  if query == "" then
    addLine(color(ASH, "Type an item name above, e.g. copper or linen."))
    addLine(color(ASH, "Tip: shift-click an item while the box has focus to search for it."))
    return
  end
  local d, found = data(), 0
  for _, item in ipairs((d and d.items) or {}) do
    if string.find(string.lower(item.name or ""), query, 1, true) then
      local total, parts = holdings(party, item)
      if total > 0 then
        found = found + 1
        if found > 60 then
          addLine(color(ASH, "...and more. Try a longer search."))
          return
        end
        addLine(color(QUALITY[item.quality or 1] or "ffffff", item.name) .. color(GOLD, "  ×" .. total))
        addLine(color(ASH, table.concat(parts, ", ")), nil, 1)
      end
    end
  end
  if found == 0 then addLine(color(ASH, "Nobody in " .. (party.name or "the party") .. " has anything matching that.")) end
end

-- Orders like "Get 20 Copper Ore" (the website's Planner makes these): how close are we?
local function needsTab(party)
  local any = false
  for _, o in ipairs(party.orders or {}) do
    if statusOf(o) ~= "done" and (o.category == "farming" or o.category == "profession") then
      any = true
      local want, name = string.match(o.title or "", "^Get (%d+) (.+)$")
      local item = name and findItemByName(name)
      if want and item then
        local have = holdings(party, item)
        want = tonumber(want)
        local mark = have >= want and color(GREEN, "ready") or color(RED, (want - have) .. " to go")
        addLine(color(QUALITY[item.quality or 1] or "ffffff", item.name) .. "  " .. have .. "/" .. want .. "  " .. mark)
      elseif want then
        addLine(name .. "  0/" .. want .. "  " .. color(RED, want .. " to go"))
      else
        addLine(o.title .. color(ASH, "  " .. whoLabel(party, o.who)))
      end
    end
  end
  if not any then
    addLine(color(ASH, "No gathering or crafting orders open."))
    addLine(color(ASH, "On the website, the Planner's \"Add to objectives\" fills this in."))
  end
end

local function partyTab(party)
  local d = data()
  for _, member in ipairs(party.members or {}) do
    local name = playerName(member)
    if d and member == d.me then name = name .. color(ASH, " (you)") end
    addLine(color(GOLD, name))
    local count = 0
    for _, t in ipairs(partyToons(party)) do
      if t.player == member then
        count = count + 1
        local profs = {}
        for _, p in ipairs(t.professions or {}) do profs[#profs + 1] = p.name .. " " .. p.skill .. "/" .. p.max end
        addLine(
          color(CLASS[t.class] or "ffffff", t.name) .. "  " .. t.level .. " " .. (t.race or "") .. " " .. (t.class or "")
            .. color(ASH, "  · " .. ago(t.lastPlayed) .. (#profs > 0 and ("  · " .. table.concat(profs, ", ")) or "")),
          nil,
          1
        )
      end
    end
    if count == 0 then addLine(color(ASH, "No toons synced yet."), nil, 1) end
  end
end

---------------------------------------------------------------------------
-- Drawing
---------------------------------------------------------------------------

local function refresh()
  if not frame then return end
  lines = {}
  local d, party = data(), currentParty()

  if not d then
    title:SetText("Warcall")
    statusLine:SetText(color(ASH, "No Warcall data yet."))
    addLine("This window shows your war party: orders, who has what, and everyone's toons.")
    addLine(" ")
    addLine("To fill it in, either:")
    addLine("- start WoW with the Warcall launcher, or", nil, 1)
    addLine("- on the website, open War party > Download in-game data, put WarcallData.lua", nil, 1)
    addLine("  in Interface\\AddOns\\Warcall, then type /reload.", nil, 1)
  elseif not party then
    title:SetText("Warcall")
    statusLine:SetText(color(ASH, "You're not in a war party yet. Join or start one on the website."))
  else
    title:SetText("Warcall · " .. (party.name or "?"))
    statusLine:SetText(color(ASH, "Synced " .. ago(d.generatedAt) .. ". /reload picks up newer data."))
    if state.tab == "orders" then ordersTab(party)
    elseif state.tab == "whohas" then whoHasTab(party)
    elseif state.tab == "needs" then needsTab(party)
    else partyTab(party) end
  end

  if partyButton then
    if d and d.parties and #d.parties > 1 then partyButton:Show() else partyButton:Hide() end
  end
  if searchBox then
    if state.tab == "whohas" and party then searchBox:Show() else searchBox:Hide() end
  end
  for id, b in pairs(tabs or {}) do
    if id == state.tab then b:LockHighlight() else b:UnlockHighlight() end
  end

  for i, line in ipairs(lines) do
    local r = getRow(i)
    r.text:SetText(line.text)
    r.text:SetPoint("LEFT", r, "LEFT", 22 + line.indent * 14, 0)
    if line.order then
      local order = line.order
      r.check:Show()
      r.check:SetChecked(statusOf(order) == "done")
      r.check:SetScript("OnClick", function(self)
        setStatus(order, self:GetChecked() and "done" or "todo")
        refresh()
      end)
    else
      r.check:Hide()
      r.check:SetScript("OnClick", nil)
    end
    r:Show()
  end
  for i = #lines + 1, #rows do rows[i]:Hide() end
  content:SetHeight(math.max(1, #lines * ROW))
end

local function build()
  frame = make("Frame", "WarcallFrame", UIParent, "BasicFrameTemplateWithInset")
  frame:SetSize(WIDTH, HEIGHT)
  frame:SetPoint("CENTER")
  frame:SetFrameStrata("HIGH")
  frame:SetMovable(true)
  frame:EnableMouse(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", frame.StartMoving)
  frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
  frame:SetClampedToScreen(true)
  -- Escape closes it, like other game windows.
  if UISpecialFrames then table.insert(UISpecialFrames, "WarcallFrame") end
  if not frame.CloseButton then
    local close = make("Button", nil, frame, "UIPanelCloseButton")
    close:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -2, -2)
  end

  -- The window template comes with a title line; make our own if it doesn't.
  title = frame.TitleText
  if not title then
    title = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
    title:SetPoint("TOP", frame, "TOP", 0, -6)
  end

  statusLine = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  statusLine:SetPoint("TOPLEFT", frame, "TOPLEFT", 16, -32)

  -- Tabs along the top.
  tabs = {}
  local order = { { "orders", "Orders" }, { "whohas", "Who has" }, { "needs", "Needs" }, { "party", "Party" } }
  for i, t in ipairs(order) do
    local b = make("Button", nil, frame, "UIPanelButtonTemplate")
    b:SetSize(96, 22)
    b:SetPoint("TOPLEFT", frame, "TOPLEFT", 14 + (i - 1) * 100, -50)
    b:SetText(t[2])
    b:SetScript("OnClick", function()
      state.tab = t[1]
      if scroll.SetVerticalScroll then scroll:SetVerticalScroll(0) end
      refresh()
    end)
    tabs[t[1]] = b
  end

  -- Switch between war parties, if you're in more than one.
  partyButton = make("Button", nil, frame, "UIPanelButtonTemplate")
  partyButton:SetSize(110, 22)
  partyButton:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -14, -50)
  partyButton:SetText("Next party")
  partyButton:SetScript("OnClick", function()
    local d = data()
    state.party = (state.party % #d.parties) + 1
    refresh()
  end)

  searchBox = make("EditBox", "WarcallSearch", frame, "InputBoxTemplate")
  searchBox:SetSize(220, 20)
  searchBox:SetPoint("TOPLEFT", frame, "TOPLEFT", 22, -78)
  searchBox:SetAutoFocus(false)
  searchBox:SetScript("OnTextChanged", function(self)
    state.search = self:GetText() or ""
    refresh()
  end)
  searchBox:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
  searchBox:SetScript("OnEnterPressed", function(self) self:ClearFocus() end)

  scroll = make("ScrollFrame", "WarcallScroll", frame, "UIPanelScrollFrameTemplate")
  scroll:SetPoint("TOPLEFT", frame, "TOPLEFT", 16, -104)
  scroll:SetPoint("BOTTOMRIGHT", frame, "BOTTOMRIGHT", -34, 14)
  content = CreateFrame("Frame", nil, scroll)
  content:SetSize(WIDTH - 60, 1)
  scroll:SetScrollChild(content)
  frame:Hide() -- new frames start out shown; ToggleWindow shows it
end

function ns.ToggleWindow()
  if not frame then build() end
  if frame:IsShown() then
    frame:Hide()
  else
    frame:Show()
    refresh()
  end
end

-- Shift-clicking an item while the search box has focus searches for it (like the auction house).
if hooksecurefunc and ChatEdit_InsertLink then
  hooksecurefunc("ChatEdit_InsertLink", function(link)
    if searchBox and searchBox:IsVisible() and searchBox:HasFocus() and link then
      local name = string.match(link, "%[(.-)%]")
      if name then searchBox:SetText(name) end
    end
  end)
end

-- Once the website has caught up with a tick-off, there's no need to keep sending it.
-- (The data file is made right after each sync, so anything older than it has been handled.)
function ns.ForgetSyncedActions()
  local d = data()
  if not (d and d.generatedAt and WarcallDB and WarcallDB.actions) then return end
  for id, a in pairs(WarcallDB.actions) do
    if (a.at or 0) <= d.generatedAt then WarcallDB.actions[id] = nil end
  end
end

ns.RefreshWindow = refresh
