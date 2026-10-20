-- The Bloodbound: the in-game crew window (/bloodbound).
--
-- It shows what the website knows, from BloodboundData.lua in this folder. The launcher (or the website's
-- "Download in-game data" button) writes that file; the game reads it at login and on /reload.
--   Orders  : tonight's orders and the rest of the to-do list. Tick them off here.
--   Who has : search everyone's bags and banks.
--   Needs   : materials still missing for planned crafts ("Get 20 Copper Ore").
--   Crew    : everyone's toons, levels and professions.
--
-- Addons can't go online, so ticking an order off is written down in BloodboundDB.actions.
-- The next sync (on /reload or logout) carries it to the website.
--
-- The look matches the website: obsidian and iron backgrounds, blood crimson, antique gold.
-- Everything is drawn from plain coloured squares, so there are no image files to go missing,
-- except the crest (Media\Crest.tga).

local _, ns = ...
ns = ns or {}

local WIDTH, HEIGHT = 600, 500
local ROW = 24
local MEDIA = "Interface\\AddOns\\Bloodbound\\Media\\"
-- WoW's own fantasy font (the one quest titles use). Every game install has it.
local TITLE_FONT = "Fonts\\MORPHEUS.TTF"

---------------------------------------------------------------------------
-- Colours: the website's palette (src/index.css)
---------------------------------------------------------------------------

-- As hex for coloured text...
local GOLD, ASH, PARCHMENT, RED, GREEN = "c39a53", "a3a6a5", "d8c9a8", "d46a6a", "6f9a7e"
local QUALITY = { [0] = "9d9d9d", "ffffff", "1eff00", "0070dd", "a335ee", "ff8000", "e6cc80" }
local CLASS = {
  Warrior = "c69b6d", Rogue = "fff468", Mage = "3fc7eb", Priest = "ffffff", Warlock = "8788ee",
  Hunter = "aad372", Shaman = "0070dd", Druid = "ff7c0a", Paladin = "f48cba",
}
local CATEGORY = { profession = "Profession", farming = "Farming", dungeon = "Dungeon", gear = "Gear", gold = "Gold", other = "Other" }

-- ...and as numbers (0 to 1) for backgrounds and borders.
local function rgb(hex)
  return tonumber(hex:sub(1, 2), 16) / 255, tonumber(hex:sub(3, 4), 16) / 255, tonumber(hex:sub(5, 6), 16) / 255
end
local C = {
  obsidian = "111315", iron = "1c2022", raised = "25292b", forged = "383638",
  crimson = "76282e", blood = "4b1d22", gold = "c39a53", worn = "9f7a42", parchment = "d8c9a8",
}

-- A small picture for each kind of order, from the game's own icons.
local CATEGORY_ICON = {
  profession = "Interface\\Icons\\Trade_BlackSmithing",
  farming = "Interface\\Icons\\INV_Misc_Bag_08",
  dungeon = "Interface\\Icons\\INV_Misc_Bone_HumanSkull_01",
  gear = "Interface\\Icons\\INV_Chest_Chain",
  gold = "Interface\\Icons\\INV_Misc_Coin_01",
  other = "Interface\\Icons\\INV_Misc_Note_01",
}

local function color(hex, text) return "|cff" .. hex .. tostring(text) .. "|r" end

local function ago(t)
  if not t then return "never" end
  local s = time() - t
  if s < 60 then return "just now" end
  if s < 3600 then return math.floor(s / 60) .. " min ago" end
  if s < 86400 then return math.floor(s / 3600) .. " h ago" end
  return math.floor(s / 86400) .. " days ago"
end

-- Plays a game sound if this version of the game has it. Sounds are a nice extra, never worth an error.
local function sound(name)
  local id = SOUNDKIT and SOUNDKIT[name]
  if id and PlaySound then pcall(PlaySound, id) end
end

---------------------------------------------------------------------------
-- Reading the crew data
---------------------------------------------------------------------------

local state = { tab = "orders", party = 1, search = "" }

local function data() return BloodboundData end

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
  return BloodboundDB and BloodboundDB.actions and BloodboundDB.actions[id]
end

local function statusOf(order)
  local a = pendingAction(order.id)
  return (a and a.status) or order.status
end

local function setStatus(order, status)
  BloodboundDB = BloodboundDB or {}
  BloodboundDB.actions = BloodboundDB.actions or {}
  if status == order.status then
    BloodboundDB.actions[order.id] = nil -- back to how the website has it: nothing to send
  else
    BloodboundDB.actions[order.id] = { status = status, at = time() }
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

-- The game's icon for an item number.
local function itemIcon(id)
  if not id then return nil end
  if C_Item and C_Item.GetItemIconByID then
    local ok, icon = pcall(C_Item.GetItemIconByID, id)
    if ok and icon then return icon end
  end
  if GetItemIcon then
    local ok, icon = pcall(GetItemIcon, id)
    if ok and icon then return icon end
  end
  return nil
end

-- Which item an order is about, from its title: "Get 7 Bronze Bar" or "Craft 1x Minor Mana Potion".
-- Returns the item number, if the crew's bank or the game knows it.
local function orderItem(order)
  local title = order.title or ""
  local name = string.match(title, "^Get %d+ (.+)$")
    or string.match(title, "^Craft %d+x (.+)$")
    or string.match(title, "^Craft %d+\195\151 (.+)$") -- the website writes a proper times sign
  if not name then return nil end
  local item = findItemByName(name)
  if item and item.id then return item.id end
  if GetItemInfoInstant then
    local ok, id = pcall(GetItemInfoInstant, name)
    if ok and type(id) == "number" then return id end
  end
  return nil
end

---------------------------------------------------------------------------
-- Drawing helpers
---------------------------------------------------------------------------

-- A plain coloured rectangle.
local function fill(parent, hex, alpha, layer)
  local t = parent:CreateTexture(nil, layer or "BACKGROUND")
  local r, g, b = rgb(hex)
  t:SetColorTexture(r, g, b, alpha or 1)
  return t
end

-- Fades a texture from one colour (top) to another (bottom), on any game version. Plain colour if neither works.
local function gradient(tex, topHex, bottomHex)
  local r1, g1, b1 = rgb(topHex)
  local r2, g2, b2 = rgb(bottomHex)
  tex:SetColorTexture(1, 1, 1, 1)
  if CreateColor and pcall(tex.SetGradient, tex, "VERTICAL", CreateColor(r2, g2, b2, 1), CreateColor(r1, g1, b1, 1)) then return end
  if tex.SetGradientAlpha and pcall(tex.SetGradientAlpha, tex, "VERTICAL", r2, g2, b2, 1, r1, g1, b1, 1) then return end
  tex:SetColorTexture(r1, g1, b1, 1)
end

-- A thin border just inside a frame's edges.
local function border(f, hex, alpha, inset, size)
  inset, size = inset or 0, size or 1
  local edges = {}
  for i, side in ipairs({ "TOP", "BOTTOM", "LEFT", "RIGHT" }) do
    local t = fill(f, hex, alpha, "BORDER")
    if side == "TOP" or side == "BOTTOM" then
      t:SetPoint(side .. "LEFT", f, side .. "LEFT", inset, side == "TOP" and -inset or inset)
      t:SetPoint(side .. "RIGHT", f, side .. "RIGHT", -inset, side == "TOP" and -inset or inset)
      t:SetHeight(size)
    else
      t:SetPoint("TOP" .. side, f, "TOP" .. side, side == "LEFT" and inset or -inset, -inset)
      t:SetPoint("BOTTOM" .. side, f, "BOTTOM" .. side, side == "LEFT" and inset or -inset, inset)
      t:SetWidth(size)
    end
    edges[i] = t
  end
  return edges
end

-- Sets a font, keeping the game's normal one if this one won't load.
local function setFont(fs, path, size, flags)
  local before = fs:GetFont()
  local ok = pcall(fs.SetFont, fs, path, size, flags or "")
  if not ok or not fs:GetFont() then
    if before then pcall(fs.SetFont, fs, before, size, flags or "") end
  end
end

-- Try a Blizzard template, and fall back to a plain frame if this game version doesn't have it.
local function make(kind, name, parent, template)
  if template then
    local ok, f = pcall(CreateFrame, kind, name, parent, template)
    if ok and f then return f end
  end
  return CreateFrame(kind, name, parent)
end

---------------------------------------------------------------------------
-- The list
---------------------------------------------------------------------------

local frame, scroll, content, title, subtitle, partyButton, searchBox, tabs, tonightBar, emptyHint
local rows = {}

-- What the current tab wants to show. Each line can have:
--   text, right (grey text on the right), icon (a texture), item (item number: tooltip on hover),
--   order (adds a tick box), header (a gold section title), indent, dim (finished), tip (tooltip text)
local lines

local function addLine(line) lines[#lines + 1] = line end
local function addText(text, indent) addLine({ text = text, indent = indent }) end
local function addHeader(text, right) addLine({ text = text, right = right, header = true }) end

local function showTooltip(row)
  local line = row.line
  if not line or not GameTooltip then return end
  if line.item then
    GameTooltip:SetOwner(row, "ANCHOR_RIGHT")
    GameTooltip:SetHyperlink("item:" .. line.item)
    GameTooltip:Show()
  elseif line.tip then
    GameTooltip:SetOwner(row, "ANCHOR_RIGHT")
    GameTooltip:SetText(line.tip, 1, 1, 1, 1, true)
    GameTooltip:Show()
  end
end

-- Shift-clicking an item line puts its link in chat, like everywhere else in the game.
local function linkItem(row)
  local line = row.line
  if not (line and line.item and IsModifiedClick and IsModifiedClick("CHATLINK") and GetItemInfo) then return end
  local _, link = GetItemInfo(line.item)
  if link and ChatEdit_InsertLink then ChatEdit_InsertLink(link) end
end

-- One reusable line in the list.
local function getRow(i)
  if rows[i] then return rows[i] end
  local r = CreateFrame("Button", nil, content)
  r.idx = i
  r:SetSize(WIDTH - 64, ROW)
  r:SetPoint("TOPLEFT", content, "TOPLEFT", 0, -(i - 1) * ROW)

  r.hover = fill(r, "ffffff", 0.05, "BACKGROUND")
  r.hover:SetAllPoints()
  r.hover:Hide()

  r.check = make("CheckButton", nil, r, "UICheckButtonTemplate")
  r.check:SetSize(ROW, ROW)
  r.check:SetPoint("LEFT", r, "LEFT", -2, 0)

  r.icon = r:CreateTexture(nil, "ARTWORK")
  r.icon:SetSize(18, 18)
  r.icon:SetTexCoord(0.08, 0.92, 0.08, 0.92) -- trims the icon's built-in frame so it looks crisp

  r.text = r:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
  r.text:SetJustifyH("LEFT")
  r.text:SetWordWrap(false)

  r.head = r:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  setFont(r.head, TITLE_FONT, 15)
  r.head:SetJustifyH("LEFT")

  r.right = r:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  r.right:SetJustifyH("RIGHT")
  r.right:SetWordWrap(false)
  r.right:SetPoint("RIGHT", r, "RIGHT", -6, 0)

  -- The gold rule under section titles.
  r.rule = fill(r, C.gold, 0.35, "ARTWORK")
  r.rule:SetHeight(1)
  r.rule:SetPoint("BOTTOMLEFT", r, "BOTTOMLEFT", 0, 2)
  r.rule:SetPoint("BOTTOMRIGHT", r, "BOTTOMRIGHT", 0, 2)

  r:SetScript("OnEnter", function(self)
    if self.line and not self.line.header then self.hover:Show() end
    showTooltip(self)
  end)
  r:SetScript("OnLeave", function(self)
    self.hover:Hide()
    if GameTooltip then GameTooltip:Hide() end
  end)
  r:SetScript("OnClick", linkItem)
  rows[i] = r
  return r
end

local function drawRow(r, line)
  r.line = line
  local x = (line.indent or 0) * 16

  -- Tick box
  if line.order then
    local order = line.order
    r.check:Show()
    r.check:SetChecked(statusOf(order) == "done")
    r.check:SetScript("OnClick", function(self)
      local done = self:GetChecked() and true or false
      setStatus(order, done and "done" or "todo")
      sound(done and "IG_QUEST_LIST_COMPLETE" or "IG_MAINMENU_OPTION_CHECKBOX_OFF")
      ns.RefreshWindow()
    end)
    x = x + ROW
  else
    r.check:Hide()
    r.check:SetScript("OnClick", nil)
  end

  -- Icon
  if line.icon then
    r.icon:SetTexture(line.icon)
    r.icon:ClearAllPoints()
    r.icon:SetPoint("LEFT", r, "LEFT", x + 2, 0)
    if r.icon.SetDesaturated then r.icon:SetDesaturated(line.dim and true or false) end
    r.icon:SetAlpha(line.dim and 0.5 or 1)
    r.icon:Show()
    x = x + 24
  else
    r.icon:Hide()
  end

  -- Text (section titles use the fantasy font, everything else the game's normal one)
  if line.header then
    r.head:SetText(color(GOLD, line.text))
    r.head:ClearAllPoints()
    r.head:SetPoint("LEFT", r, "LEFT", x + 2, 1)
    r.head:Show()
    r.text:Hide()
    r.rule:Show()
  else
    r.text:SetText(line.text or "")
    r.text:SetAlpha(line.dim and 0.55 or 1)
    r.text:ClearAllPoints()
    r.text:SetPoint("LEFT", r, "LEFT", x + 2, 0)
    r.text:SetPoint("RIGHT", r.right, "LEFT", -8, 0)
    r.text:Show()
    r.head:Hide()
    r.rule:Hide()
  end

  r.right:SetText(line.right or "")
  r.right:SetAlpha(line.dim and 0.55 or 1)
  r:Show()
end

---------------------------------------------------------------------------
-- The tabs
---------------------------------------------------------------------------

local function orderLine(party, o)
  local s = statusOf(o)
  local done = s == "done"
  local itemId = orderItem(o)
  local label = done and color(ASH, o.title) or o.title
  if s == "doing" then label = label .. color(GOLD, "  in progress") end
  local right = color(PARCHMENT, whoLabel(party, o.who)) .. color(ASH, " · " .. (CATEGORY[o.category] or o.category or ""))
  if pendingAction(o.id) then right = color(GREEN, "syncs on /reload  ") .. right end
  addLine({
    text = label,
    right = right,
    order = o,
    item = itemId,
    icon = itemIcon(itemId) or CATEGORY_ICON[o.category] or CATEGORY_ICON.other,
    dim = done,
  })
end

local function ordersTab(party)
  local tonight, rest = {}, {}
  for _, o in ipairs(party.orders or {}) do
    if o.tonight then tonight[#tonight + 1] = o else rest[#rest + 1] = o end
  end

  addHeader("Tonight's Orders")
  if #tonight == 0 then addText(color(ASH, "Nothing planned for tonight. Flag orders for tonight on the website."), 0) end
  -- Still to do first, then the finished ones.
  for _, o in ipairs(tonight) do if statusOf(o) ~= "done" then orderLine(party, o) end end
  for _, o in ipairs(tonight) do if statusOf(o) == "done" then orderLine(party, o) end end

  addText(" ")
  addHeader("Other Orders")
  local any = false
  for _, o in ipairs(rest) do
    if statusOf(o) ~= "done" or pendingAction(o.id) then orderLine(party, o); any = true end
  end
  if not any then addText(color(ASH, "All clear.")) end
end

local function tonightProgress(party)
  local total, done = 0, 0
  for _, o in ipairs(party.orders or {}) do
    if o.tonight then
      total = total + 1
      if statusOf(o) == "done" then done = done + 1 end
    end
  end
  return done, total
end

local function whoHasTab(party)
  local query = string.lower(strtrim and strtrim(state.search) or state.search)
  if query == "" then
    addText(color(ASH, "Type an item name above, e.g. copper or linen."))
    addText(color(ASH, "Tip: shift-click an item in your bags while the box has focus to search for it."))
    return
  end
  local d, found = data(), 0
  for _, item in ipairs((d and d.items) or {}) do
    if string.find(string.lower(item.name or ""), query, 1, true) then
      local total, parts = holdings(party, item)
      if total > 0 then
        found = found + 1
        if found > 60 then
          addText(color(ASH, "...and more. Try a longer search."))
          return
        end
        addLine({
          text = color(QUALITY[item.quality or 1] or "ffffff", item.name),
          right = color(GOLD, "x" .. total),
          icon = itemIcon(item.id),
          item = item.id,
        })
        addText(color(ASH, table.concat(parts, ", ")), 1.5)
      end
    end
  end
  if found == 0 then addText(color(ASH, "Nobody in " .. (party.name or "the crew") .. " has anything matching that.")) end
end

-- Orders like "Get 20 Copper Ore" (the website's Planner makes these): how close are we?
local function needsTab(party)
  addHeader("Still Needed")
  local any = false
  for _, o in ipairs(party.orders or {}) do
    if statusOf(o) ~= "done" and (o.category == "farming" or o.category == "profession") then
      any = true
      local want, name = string.match(o.title or "", "^Get (%d+) (.+)$")
      local item = name and findItemByName(name)
      local itemId = (item and item.id) or orderItem(o)
      if want then
        want = tonumber(want)
        local have = item and holdings(party, item) or 0
        local mark = have >= want and color(GREEN, "ready") or color(RED, (want - have) .. " to go")
        local q = item and QUALITY[item.quality or 1] or "ffffff"
        addLine({
          text = color(q, (item and item.name) or name),
          right = color(GOLD, have .. "/" .. want) .. "   " .. mark,
          icon = itemIcon(itemId) or CATEGORY_ICON.farming,
          item = itemId,
        })
      else
        addLine({
          text = o.title,
          right = color(PARCHMENT, whoLabel(party, o.who)),
          icon = itemIcon(itemId) or CATEGORY_ICON[o.category] or CATEGORY_ICON.other,
          item = itemId,
        })
      end
    end
  end
  if not any then
    addText(color(ASH, "No gathering or crafting orders open."))
    addText(color(ASH, "On the website, the Planner's \"Add to objectives\" fills this in."))
  end
end

-- The round class icon, if this game version has the picture's map.
local function classIcon(class)
  local coords = CLASS_ICON_TCOORDS and class and CLASS_ICON_TCOORDS[string.upper(class)]
  if not coords then return nil end
  return "Interface\\TargetingFrame\\UI-Classes-Circles", coords
end

local function partyTab(party)
  local d = data()
  for _, member in ipairs(party.members or {}) do
    local name = playerName(member)
    addHeader(name, d and member == d.me and color(ASH, "you") or nil)
    local count = 0
    for _, t in ipairs(partyToons(party)) do
      if t.player == member then
        count = count + 1
        local profs = {}
        for _, p in ipairs(t.professions or {}) do profs[#profs + 1] = p.name .. " " .. p.skill .. "/" .. p.max end
        local icon, coords = classIcon(t.class)
        addLine({
          text = color(CLASS[t.class] or "ffffff", t.name) .. color(GOLD, "  " .. (t.level or "?"))
            .. color(ASH, "  " .. (t.race or "") .. " " .. (t.class or "")),
          right = color(ASH, ago(t.lastPlayed)),
          icon = icon,
          coords = coords,
          tip = #profs > 0 and table.concat(profs, "\n") or "No professions synced yet.",
        })
        if #profs > 0 then addText(color(ASH, table.concat(profs, "   ")), 1.5) end
      end
    end
    if count == 0 then addText(color(ASH, "No toons synced yet."), 1) end
    addText(" ")
  end
end

---------------------------------------------------------------------------
-- Drawing the window
---------------------------------------------------------------------------

local function styleTab(b, active)
  local r, g, bl
  if active then r, g, bl = rgb(C.crimson) elseif b.hovered then r, g, bl = rgb("2e3335") else r, g, bl = rgb(C.raised) end
  b.bg:SetColorTexture(r, g, bl, 1)
  local er, eg, eb = rgb(active and C.gold or C.forged)
  for _, e in ipairs(b.edges) do e:SetColorTexture(er, eg, eb, active and 0.8 or 1) end
  local tr, tg, tb = rgb((active or b.hovered) and C.gold or C.worn)
  if active then tr, tg, tb = rgb(C.parchment) end
  b.label:SetTextColor(tr, tg, tb)
end

local function refresh()
  if not frame then return end
  lines = {}
  local d, party = data(), currentParty()

  if not d then
    subtitle:SetText(color(ASH, "No crew data yet"))
    addHeader("Getting Started")
    addText("This window shows your crew: orders, who has what, and everyone's toons.")
    addText(" ")
    addText("To fill it in, either:")
    addText("- start WoW with the Bloodbound launcher, or", 1)
    addText("- on the website, open Crew > Download in-game data, put BloodboundData.lua", 1)
    addText("  in Interface\\AddOns\\Bloodbound, then type /reload.", 1)
  elseif not party then
    subtitle:SetText(color(ASH, "Not in a crew yet"))
    addText(color(ASH, "Join or start a crew on the website, then /reload."))
  else
    subtitle:SetText(color(PARCHMENT, party.name or "?") .. color(ASH, "   synced " .. ago(d.generatedAt) .. ", /reload for newer"))
    if state.tab == "orders" then ordersTab(party)
    elseif state.tab == "whohas" then whoHasTab(party)
    elseif state.tab == "needs" then needsTab(party)
    else partyTab(party) end
  end

  -- The strip under the tabs: tonight's progress on Orders, the search box on Who has.
  if party and state.tab == "orders" then
    local done, total = tonightProgress(party)
    tonightBar:SetMinMaxValues(0, math.max(total, 1))
    tonightBar:SetValue(done)
    local r, g, b = rgb(total > 0 and done == total and C.gold or C.crimson)
    tonightBar:SetStatusBarColor(r, g, b)
    if total == 0 then
      tonightBar.text:SetText(color(ASH, "No orders for tonight"))
    elseif done == total then
      tonightBar.text:SetText("Tonight: all " .. total .. " done. Victory!")
    else
      tonightBar.text:SetText("Tonight: " .. done .. " of " .. total .. " done")
    end
    tonightBar:Show()
  else
    tonightBar:Hide()
  end
  if party and state.tab == "whohas" then searchBox:Show() else searchBox:Hide() end
  if not (party and (state.tab == "orders" or state.tab == "whohas")) then
    emptyHint:SetText(party and color(ASH, state.tab == "needs" and "Materials for planned crafts, counted across the crew's bags and banks." or "Everyone in the crew and their toons. Hover a toon for its professions.") or "")
    emptyHint:Show()
  else
    emptyHint:Hide()
  end

  if d and d.parties and #d.parties > 1 then partyButton:Show() else partyButton:Hide() end
  for id, b in pairs(tabs) do styleTab(b, id == state.tab) end

  for i, line in ipairs(lines) do
    local r = getRow(i)
    drawRow(r, line)
    if line.coords then r.icon:SetTexCoord(unpack(line.coords)) else r.icon:SetTexCoord(0.08, 0.92, 0.08, 0.92) end
  end
  for i = #lines + 1, #rows do rows[i]:Hide() end
  content:SetHeight(math.max(1, #lines * ROW))
end

-- A tab: an iron plate that turns crimson when it's the one showing.
local function makeTab(id, label, width)
  local b = CreateFrame("Button", nil, frame)
  b:SetSize(width, 26)
  b.bg = fill(b, C.raised, 1, "BACKGROUND")
  b.bg:SetAllPoints()
  b.edges = border(b, C.forged, 1)
  b.label = b:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  setFont(b.label, TITLE_FONT, 14)
  b.label:SetPoint("CENTER", b, "CENTER", 0, 0)
  b.label:SetText(label)
  b:SetScript("OnEnter", function(self) self.hovered = true; styleTab(self, state.tab == id) end)
  b:SetScript("OnLeave", function(self) self.hovered = false; styleTab(self, state.tab == id) end)
  return b
end

local function build()
  frame = CreateFrame("Frame", "BloodboundFrame", UIParent)
  frame:SetSize(WIDTH, HEIGHT)
  frame:SetPoint("CENTER")
  frame:SetFrameStrata("HIGH")
  frame:SetToplevel(true)
  frame:SetMovable(true)
  frame:EnableMouse(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", frame.StartMoving)
  frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
  frame:SetClampedToScreen(true)
  -- Escape closes it, like other game windows.
  if UISpecialFrames then table.insert(UISpecialFrames, "BloodboundFrame") end
  frame:SetScript("OnShow", function() sound("IG_QUEST_LOG_OPEN") end)
  frame:SetScript("OnHide", function() sound("IG_QUEST_LOG_CLOSE") end)

  -- Obsidian body, a forged-iron edge and a fine gold line just inside it.
  local body = fill(frame, C.obsidian, 0.97, "BACKGROUND")
  body:SetAllPoints()
  border(frame, "000000", 0.9, 0, 1)
  border(frame, C.forged, 1, 1, 2)
  border(frame, C.worn, 0.45, 4, 1)

  -- The header: a band of deep blood, fading down to black.
  local header = frame:CreateTexture(nil, "BACKGROUND", nil, 1)
  header:SetPoint("TOPLEFT", frame, "TOPLEFT", 5, -5)
  header:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -5, -5)
  header:SetHeight(60)
  gradient(header, C.blood, "160c0e")
  local rule = fill(frame, C.gold, 0.7, "ARTWORK")
  rule:SetPoint("TOPLEFT", frame, "TOPLEFT", 5, -65)
  rule:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -5, -65)
  rule:SetHeight(1)

  local crest = frame:CreateTexture(nil, "ARTWORK")
  crest:SetSize(52, 52)
  crest:SetPoint("TOPLEFT", frame, "TOPLEFT", 12, -8)
  crest:SetTexture(MEDIA .. "Crest")

  title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
  setFont(title, TITLE_FONT, 22)
  title:SetPoint("TOPLEFT", frame, "TOPLEFT", 72, -14)
  title:SetText(color(GOLD, "The Bloodbound"))
  if title.SetShadowOffset then title:SetShadowOffset(1, -1) end

  subtitle = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  subtitle:SetPoint("TOPLEFT", title, "BOTTOMLEFT", 1, -4)

  local close = make("Button", nil, frame, "UIPanelCloseButton")
  close:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -6, -6)
  close:SetScript("OnClick", function() frame:Hide() end)

  -- Tabs along the top.
  tabs = {}
  local list = { { "orders", "Orders" }, { "whohas", "Who Has" }, { "needs", "Needs" }, { "party", "Crew" } }
  for i, t in ipairs(list) do
    local b = makeTab(t[1], t[2], 112)
    b:SetPoint("TOPLEFT", frame, "TOPLEFT", 14 + (i - 1) * 116, -76)
    b:SetScript("OnClick", function()
      state.tab = t[1]
      sound("IG_CHARACTER_INFO_TAB")
      if scroll.SetVerticalScroll then scroll:SetVerticalScroll(0) end
      refresh()
    end)
    tabs[t[1]] = b
  end

  -- Switch between crews, if you're in more than one.
  partyButton = makeTab("next", "Next Crew", 100)
  partyButton:SetPoint("TOPRIGHT", frame, "TOPRIGHT", -14, -76)
  partyButton:SetScript("OnClick", function()
    local d = data()
    state.party = (state.party % #d.parties) + 1
    sound("IG_CHARACTER_INFO_TAB")
    refresh()
  end)
  styleTab(partyButton, false)

  -- Tonight's progress (Orders tab).
  tonightBar = CreateFrame("StatusBar", nil, frame)
  tonightBar:SetSize(WIDTH - 32, 16)
  tonightBar:SetPoint("TOPLEFT", frame, "TOPLEFT", 16, -114)
  tonightBar:SetStatusBarTexture("Interface\\TargetingFrame\\UI-StatusBar")
  local barBg = fill(tonightBar, C.iron, 1, "BACKGROUND")
  barBg:SetAllPoints()
  border(tonightBar, C.forged, 1)
  tonightBar.text = tonightBar:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  tonightBar.text:SetPoint("CENTER", tonightBar, "CENTER", 0, 0)

  -- The search box (Who has tab).
  searchBox = make("EditBox", "BloodboundSearch", frame, "InputBoxTemplate")
  searchBox:SetSize(260, 20)
  searchBox:SetPoint("TOPLEFT", frame, "TOPLEFT", 22, -112)
  searchBox:SetAutoFocus(false)
  searchBox:SetScript("OnTextChanged", function(self)
    state.search = self:GetText() or ""
    refresh()
  end)
  searchBox:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
  searchBox:SetScript("OnEnterPressed", function(self) self:ClearFocus() end)

  -- A one-line explanation for the tabs that don't use the strip.
  emptyHint = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
  emptyHint:SetPoint("TOPLEFT", frame, "TOPLEFT", 18, -116)

  scroll = make("ScrollFrame", "BloodboundScroll", frame, "UIPanelScrollFrameTemplate")
  scroll:SetPoint("TOPLEFT", frame, "TOPLEFT", 16, -142)
  scroll:SetPoint("BOTTOMRIGHT", frame, "BOTTOMRIGHT", -34, 14)
  content = CreateFrame("Frame", nil, scroll)
  content:SetSize(WIDTH - 64, 1)
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
  if not (d and d.generatedAt and BloodboundDB and BloodboundDB.actions) then return end
  for id, a in pairs(BloodboundDB.actions) do
    if (a.at or 0) <= d.generatedAt then BloodboundDB.actions[id] = nil end
  end
end

ns.RefreshWindow = refresh
