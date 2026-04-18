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
  if (!tickInterval) tickInterval = setInterval(tick, 1000);

  if (configRefreshInterval) clearInterval(configRefreshInterval);
  configRefreshInterval = setInterval(async () => {
    await loadGameConfig();
    updateEventBanner();
  }, 5 * 60 * 1000);

  const cloudSave = await loadCloud();
  if (cloudSave) {
    if (!cached || cloudSave.last_save >= (cached.lastSave ?? 0)) {
      applyPayload({ money: cloudSave.money, owned: cloudSave.owned, lastSave: cloudSave.last_save });
    }
    if (cloudSave.rank_id != null) currentRankId = cloudSave.rank_id;
    applyIdleProgress();
    writeCache();
    render();
  } else {
    applyIdleProgress();
    await saveCloud();
  }
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
