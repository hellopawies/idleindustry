// ── Player login ──────────────────────────────────────────────
let configRefreshInterval = null;

async function onLogin(userId, username) {
  currentUserId   = userId;
  currentUsername = username;
  currentIsAdmin  = false;
  currentRankId   = 0;

  await loadGameConfig();

  const cached = readCache();
  if (cached) { applyPayload(cached); render(); }
  showGame(username);

  if (configRefreshInterval) clearInterval(configRefreshInterval);
  configRefreshInterval = setInterval(async () => {
    await loadGameConfig();
    updateEventBanner();
  }, 5 * 60 * 1000);

  const result = await loadCloud();

  if (result.networkError) {
    // Network failure — keep cache, don't touch cloud
    applyIdleProgress();
  } else if (result.data) {
    // Cloud save found — server wins on conflict
    const cloudSave = result.data;
    if (!cached || cloudSave.last_save >= (cached.lastSave ?? 0)) {
      applyPayload({ money: cloudSave.money, owned: cloudSave.owned, lastSave: cloudSave.last_save });
    }
    if (cloudSave.rank_id != null) currentRankId = cloudSave.rank_id;
    applyIdleProgress();
    writeCache();
    render();
  } else {
    // No save in DB (new player or intentional reset) — start fresh, clear cache
    clearCache();
    applyPayload({ money: STARTING_MONEY, owned: new Array(INDUSTRIES.length).fill(0), lastSave: now() });
    render();
    await saveCloud();
    writeCache();
  }

  // Start tick only after cloud state is resolved
  if (!tickInterval) tickInterval = setInterval(tick, 1000);
}

// ── Admin login ───────────────────────────────────────────────
async function onAdminLogin(userId, username) {
  currentUserId   = userId;
  currentUsername = username;
  currentIsAdmin  = true;
  showAdmin(username);
  await renderIndustryEditor();
  await loadUsersTable();
}

// ── Logout ────────────────────────────────────────────────────
function onLogout() {
  clearSession();
  currentUserId   = null;
  currentUsername = null;
  currentIsAdmin  = false;
  currentRankId   = 0;
  if (tickInterval)          { clearInterval(tickInterval);          tickInterval          = null; }
  if (configRefreshInterval) { clearInterval(configRefreshInterval); configRefreshInterval = null; }
  window.location.href = '../';
}

document.getElementById("signout-btn").addEventListener("click", onLogout);
document.getElementById("admin-signout-btn").addEventListener("click", onLogout);
