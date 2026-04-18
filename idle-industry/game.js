// ── Game state ───────────────────────────────────────────────
let state = {
  money:    10,
  lastSave: Date.now(),
  owned:    new Array(INDUSTRIES.length).fill(0),
};

let currentUserId   = null;
let currentUsername = null;
let currentIsAdmin  = false;
let currentRankId   = 0;
let tickInterval    = null;
let buyQty          = 1;

// ── Server time sync ─────────────────────────────────────────
let serverTimeOffset = 0;

async function syncServerTime() {
  const before = Date.now();
  const { data } = await sb.rpc("get_server_time");
  if (data) {
    const rtt = Date.now() - before;
    const serverMs = data < 1e12 ? data * 1000 : data;
    serverTimeOffset = serverMs - (before + rtt / 2);
  }
}

function now() { return Date.now() + serverTimeOffset; }

// ── Game config ───────────────────────────────────────────────
async function loadGameConfig() {
  const { data, error } = await sb.rpc("get_game_config");
  if (error || !data) { console.warn("[Config] get_game_config failed:", error?.message); return; }
  console.log("[Config] loaded:", data);
  applyGameConfig(data);
}

function applyGameConfig(cfg) {
  if (cfg.industries && Array.isArray(cfg.industries)) {
    const len = Math.max(cfg.industries.length, DEFAULT_INDUSTRIES.length);
    INDUSTRIES = Array.from({ length: len }, (_, i) => {
      const ind = cfg.industries[i];
      const def = DEFAULT_INDUSTRIES[i];
      if (!ind) return { ...def };
      return {
        id:         ind.id   ?? i,
        name:       ind.name       || def?.name   || `Industry ${i}`,
        emoji:      ind.emoji      || def?.emoji  || "🏭",
        baseCost:   Number(ind.baseCost)   || def?.baseCost   || 100,
        baseIncome: Number(ind.baseIncome) || def?.baseIncome || 1,
      };
    });
  }
  if (cfg.costScale)              COST_SCALE      = Number(cfg.costScale);
  if (cfg.maxOfflineHours)        MAX_OFFLINE     = Number(cfg.maxOfflineHours) * 3600;
  if (cfg.idleMultiplier != null) IDLE_MULTIPLIER = Number(cfg.idleMultiplier);
  if (cfg.startingMoney  != null) STARTING_MONEY  = Number(cfg.startingMoney);
  if (Array.isArray(cfg.events)) {
    GAME_EVENTS = cfg.events.map((ev, i) => ({
      id:          i,
      name:        ev.name        || "Event",
      incomeBonus: Number(ev.incomeBonus) || 0,
      startTime:   ev.startTime   || "",
      endTime:     ev.endTime     || "",
      motd:        ev.motd        || "",
    }));
  } else {
    GAME_EVENTS = [];
  }
  while (state.owned.length < INDUSTRIES.length) state.owned.push(0);
  if (cfg.ranks && Array.isArray(cfg.ranks)) {
    RANKS = cfg.ranks.map((r, i) => ({
      id:           i,
      name:         r.name         || DEFAULT_RANKS[i]?.name         || `Rank ${i}`,
      emoji:        r.emoji        || DEFAULT_RANKS[i]?.emoji        || "⭐",
      incomeBonus:  Number(r.incomeBonus)  || 0,
      offlineBonus: Number(r.offlineBonus) || 0,
    }));
  }
}

// ── Active events & MOTD ─────────────────────────────────────
function getActiveEvents() {
  const sgt   = new Date(Date.now() + 8 * 3600000);
  const today = `${sgt.getUTCFullYear()}-${String(sgt.getUTCMonth()+1).padStart(2,"0")}-${String(sgt.getUTCDate()).padStart(2,"0")}`;
  const active = GAME_EVENTS.filter(ev => {
    if (!ev.startTime || !ev.endTime) return false;
    return today >= ev.startTime && today <= ev.endTime;
  });
  console.log(`[Events] ${GAME_EVENTS.length} loaded, ${active.length} active. Today(SGT)=${today}`,
    GAME_EVENTS.map(ev => ({ name: ev.name, start: ev.startTime, end: ev.endTime, active: active.includes(ev) })));
  return active;
}

function getEventBonus() {
  return getActiveEvents().reduce((sum, ev) => sum + (ev.incomeBonus || 0), 0);
}

function getMotdDismissKey() {
  const t = new Date(now() + 8 * 3600000);
  return `idi_motd_${t.getUTCFullYear()}-${String(t.getUTCMonth()+1).padStart(2,"0")}-${String(t.getUTCDate()).padStart(2,"0")}`;
}
function isMotdDismissedToday() { return localStorage.getItem(getMotdDismissKey()) === "1"; }
function dismissMotdToday() {
  localStorage.setItem(getMotdDismissKey(), "1");
  document.getElementById("motd-banner").style.display = "none";
}
function updateEventBanner() {
  const banner    = document.getElementById("motd-banner");
  const motdEl    = document.getElementById("motd-text");
  if (!banner || !motdEl) return;
  const activeMsgs = getActiveEvents().filter(ev => ev.motd).map(ev => ev.motd);
  if (activeMsgs.length > 0 && !isMotdDismissedToday()) {
    motdEl.textContent = activeMsgs.join("  ·  ");
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }
}

// ── Formatting ───────────────────────────────────────────────
function fmt(n) {
  if (n < 1e3)  return "$" + n.toFixed(2);
  if (n < 1e6)  return "$" + (n / 1e3).toFixed(2)  + "K";
  if (n < 1e9)  return "$" + (n / 1e6).toFixed(2)  + "M";
  if (n < 1e12) return "$" + (n / 1e9).toFixed(2)  + "B";
  if (n < 1e15) return "$" + (n / 1e12).toFixed(2) + "T";
  return "$" + (n / 1e15).toFixed(2) + "Qa";
}
function fmtTime(secs) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Calculations ─────────────────────────────────────────────
function getCost(i)    { return Math.ceil(INDUSTRIES[i].baseCost * Math.pow(COST_SCALE, state.owned[i])); }
function getIncome(i)  { return INDUSTRIES[i].baseIncome * state.owned[i]; }
function totalIncome() { return INDUSTRIES.reduce((s, _, i) => s + getIncome(i), 0) * getRankMultiplier() * (1 + getEventBonus()); }

function getCostN(i, n) {
  if (n <= 0) return 0;
  const base = INDUSTRIES[i].baseCost, s = state.owned[i];
  if (n === 1) return Math.ceil(base * Math.pow(COST_SCALE, s));
  return Math.ceil(base * Math.pow(COST_SCALE, s) * (Math.pow(COST_SCALE, n) - 1) / (COST_SCALE - 1));
}

function getMaxBuy(i) {
  if (state.money < getCostN(i, 1)) return 0;
  let n = 1;
  while (getCostN(i, n * 2) <= state.money && n < 1e6) n *= 2;
  let lo = n, hi = n * 2;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (getCostN(i, mid) <= state.money) lo = mid; else hi = mid - 1;
  }
  return lo;
}

function getRankMultiplier() {
  const r = RANKS[currentRankId] || RANKS[0];
  return 1 + (r?.incomeBonus || 0);
}
function getRankOfflineCap() {
  const r = RANKS[currentRankId] || RANKS[0];
  return MAX_OFFLINE + (r?.offlineBonus || 0) * 3600;
}

// ── State helpers ─────────────────────────────────────────────
function applyPayload(saved) {
  state.money    = saved.money    ?? 10;
  state.lastSave = saved.lastSave ?? now();
  state.owned    = saved.owned    ?? new Array(INDUSTRIES.length).fill(0);
  while (state.owned.length < INDUSTRIES.length) state.owned.push(0);
}

// ── Session (localStorage) ────────────────────────────────────
function saveSession(userId, username, isAdmin = false) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, username, isAdmin }));
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ── Cache (fast reload) ───────────────────────────────────────
function cacheKey()   { return `idi_cache_${currentUserId}`; }
function writeCache() {
  state.lastSave = now();
  localStorage.setItem(cacheKey(), JSON.stringify({ money: state.money, lastSave: state.lastSave, owned: state.owned }));
}
function readCache()  {
  try { const r = localStorage.getItem(cacheKey()); return r ? JSON.parse(r) : null; } catch { return null; }
}
function clearCache() { if (currentUserId) localStorage.removeItem(cacheKey()); }

// ── Cloud save / load ─────────────────────────────────────────
function setSyncing(val) { document.getElementById("sync-dot").classList.toggle("syncing", val); }

async function saveCloud() {
  setSyncing(true);
  const { error } = await sb.rpc("save_game", { p_user_id: currentUserId, p_money: state.money, p_owned: state.owned });
  setSyncing(false);
  if (error) console.warn("Cloud save failed:", error.message);
}

async function loadCloud() {
  const { data, error } = await sb.rpc("load_game", { p_user_id: currentUserId });
  if (error) { console.warn("Cloud load failed:", error.message); return null; }
  return data;
}

function saveGame() { writeCache(); saveCloud(); }

// ── Offline / idle progress ───────────────────────────────────
function applyIdleProgress(silent = false) {
  const elapsed = Math.min((now() - state.lastSave) / 1000, getRankOfflineCap());
  if (elapsed < 2 || totalIncome() === 0) return;
  const earned = totalIncome() * elapsed * IDLE_MULTIPLIER;
  state.money += earned;
  state.lastSave = now();
  if (!silent && elapsed >= 10) {
    const toast = document.getElementById("offline-toast");
    toast.style.display = "flex";
    toast.innerHTML = `<p>While you were away for <strong>${fmtTime(elapsed)}</strong> you earned <strong>${fmt(earned)}</strong>.</p>
      <button onclick="this.parentElement.style.display='none'">✕</button>`;
    setTimeout(() => { toast.style.display = "none"; }, 7000);
  }
}

// ── Buy ───────────────────────────────────────────────────────
function buyIndustry(i) {
  const maxAffordable = getMaxBuy(i);
  const qty = buyQty === 'max' ? maxAffordable : Math.min(+buyQty, maxAffordable);
  if (qty <= 0) return;
  const cost = getCostN(i, qty);
  if (state.money < cost) return;
  state.money   -= cost;
  state.owned[i] += qty;
  render();
  saveGame();
}

document.getElementById("buy-mode-bar").addEventListener("click", e => {
  const btn = e.target.closest(".bm-btn");
  if (!btn) return;
  buyQty = btn.dataset.qty === 'max' ? 'max' : +btn.dataset.qty;
  document.querySelectorAll(".bm-btn").forEach(b => b.classList.toggle("active", b === btn));
  render();
});

// ── Render ────────────────────────────────────────────────────
let firstRender = true;

function render() {
  document.getElementById("money-display").textContent = fmt(state.money);
  const eb = getEventBonus();
  const eventTag = eb > 0 ? `<span class="event-pill">+${Math.round(eb * 100)}% EVENT</span>` : "";
  document.getElementById("income-display").innerHTML = fmt(totalIncome()) + " / sec" + eventTag;

  const rank  = RANKS[currentRankId] || RANKS[0];
  const badge = document.getElementById("rank-badge");
  if (badge) { badge.textContent = `${rank.emoji} ${rank.name}`; badge.style.display = ""; }

  const list = document.getElementById("industry-list");

  if (firstRender) {
    list.innerHTML = INDUSTRIES.map((ind, i) => `
      <div class="card" data-id="${i}">
        <div class="card-emoji">${ind.emoji}</div>
        <div class="card-info">
          <div class="card-name">${ind.name}</div>
          <div class="card-income" data-income="${i}"></div>
          <div class="card-cost"   data-cost="${i}"></div>
        </div>
        <div class="card-right">
          <div class="owned-badge" data-owned="${i}">0</div>
          <button class="buy-btn" data-buy="${i}">Buy</button>
        </div>
      </div>
    `).join("");

    list.addEventListener("click", e => {
      const btn = e.target.closest("[data-buy]");
      if (btn && !btn.disabled) buyIndustry(+btn.dataset.buy);
    });

    firstRender = false;
  }

  INDUSTRIES.forEach((ind, i) => {
    const card       = list.querySelector(`[data-id="${i}"]`);
    const isUnlocked = i === 0 || state.owned[i - 1] > 0;
    card.style.display = isUnlocked ? "" : "none";
    if (!isUnlocked) return;

    const cost1         = getCost(i);
    const income        = getIncome(i);
    const canAfford     = state.money >= cost1;
    const maxAffordable = getMaxBuy(i);
    const resolvedQty   = buyQty === 'max' ? maxAffordable : Math.min(+buyQty, maxAffordable);
    const buyCost       = resolvedQty > 0 ? getCostN(i, resolvedQty) : cost1;
    const btnDisabled   = resolvedQty === 0;

    card.querySelector("[data-income]").textContent =
      state.owned[i] > 0
        ? `${fmt(income)} / sec  (${fmt(ind.baseIncome)} each)`
        : `${fmt(ind.baseIncome)} / sec each`;

    card.querySelector("[data-cost]").textContent =
      resolvedQty > 1 ? `Cost: ${fmt(buyCost)} ×${resolvedQty}` : `Cost: ${fmt(cost1)}`;

    card.querySelector("[data-owned]").textContent = state.owned[i];
    card.querySelector("[data-buy]").disabled      = btnDisabled;
    card.classList.toggle("affordable", canAfford);
    card.classList.toggle("locked",     !canAfford);
  });
}

// ── Tick ──────────────────────────────────────────────────────
let tickCount    = 0;
let lastTickTime = 0;

function tick() {
  const current = now();
  const elapsed = lastTickTime ? Math.min((current - lastTickTime) / 1000, getRankOfflineCap()) : 1;
  lastTickTime   = current;
  state.money   += totalIncome() * elapsed;
  state.lastSave = current;
  render();
  if (++tickCount % 5 === 0) saveGame();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentUserId && !currentIsAdmin) {
    applyIdleProgress(false);
    lastTickTime = now();
    render();
  }
});

