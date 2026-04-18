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
  state       = { money: STARTING_MONEY, lastSave: now(), owned: new Array(INDUSTRIES.length).fill(0) };
  firstRender = true;
  document.getElementById("industry-list").innerHTML = "";
  showAuth();
}

// ── Auth form ─────────────────────────────────────────────────
let isSignUp = false;

function setAuthMode(signup) {
  isSignUp = signup;
  document.getElementById("auth-title").textContent  = signup ? "Create account" : "Sign in";
  document.getElementById("auth-submit").textContent = signup ? "Sign up" : "Sign in";
  document.getElementById("auth-switch").textContent = signup ? "Sign in" : "Sign up";
  document.getElementById("auth-toggle").firstChild.textContent =
    signup ? "Already have an account? " : "No account? ";
  const e = document.getElementById("auth-error"); e.className = ""; e.textContent = "";
}

function setAuthError(msg) { const e = document.getElementById("auth-error"); e.className = "err"; e.textContent = msg; }
function setAuthOk(msg)    { const e = document.getElementById("auth-error"); e.className = "ok";  e.textContent = msg; }

function validateUsername(u) {
  if (!u)             return "Username is required.";
  if (u.length < 3)  return "Username must be at least 3 characters.";
  if (u.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return "Only letters, numbers, and underscores.";
  return null;
}

document.getElementById("auth-switch").addEventListener("click", () => setAuthMode(!isSignUp));

document.getElementById("auth-submit").addEventListener("click", async () => {
  const username = document.getElementById("auth-username").value.trim();
  const password = document.getElementById("auth-password").value;
  const btn      = document.getElementById("auth-submit");

  const err = validateUsername(username);
  if (err)       { setAuthError(err); return; }
  if (!password) { setAuthError("Password is required."); return; }

  btn.disabled    = true;
  btn.textContent = isSignUp ? "Creating account…" : "Signing in…";
  document.getElementById("auth-error").textContent = "";

  const rpc = isSignUp ? "signup" : "signin";
  const { data, error } = await sb.rpc(rpc, { p_username: username, p_password: password });

  btn.disabled    = false;
  btn.textContent = isSignUp ? "Sign up" : "Sign in";

  if (error)       { setAuthError(error.message); return; }
  if (data?.error) { setAuthError(data.error);    return; }

  if (isSignUp) {
    setAuthOk("Account created! You can now sign in.");
    setAuthMode(false);
    document.getElementById("auth-password").value = "";
  } else {
    const uid   = data.user_id;
    const uname = username.toLowerCase();
    const admin = !!data.is_admin;
    saveSession(uid, uname, admin);
    if (admin) {
      await onAdminLogin(uid, uname);
    } else {
      await onLogin(uid, uname);
    }
  }
});

document.getElementById("auth-password").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("auth-submit").click();
});

document.getElementById("signout-btn").addEventListener("click", onLogout);
document.getElementById("admin-signout-btn").addEventListener("click", onLogout);
