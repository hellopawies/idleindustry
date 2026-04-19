// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
    if (target === "tab-accounts") loadUsersTable();
    if (target === "tab-ranks")    renderRankEditor();
    if (target === "tab-server")   renderServerTab();
  });
});

// ── Industry editor ───────────────────────────────────────────
let editorInds = [];

function getEditorValues() {
  return editorInds.map((ind, i) => ({
    id:         i,
    name:       document.getElementById(`ie-name-${i}`)?.value.trim()        || ind.name       || "Building",
    emoji:      document.getElementById(`ie-emoji-${i}`)?.value.trim()       || ind.emoji      || "🏭",
    baseCost:   parseFloat(document.getElementById(`ie-cost-${i}`)?.value)   || ind.baseCost   || 100,
    baseIncome: parseFloat(document.getElementById(`ie-income-${i}`)?.value) || ind.baseIncome || 1,
  }));
}

function renderEditorRows() {
  document.getElementById("industry-editor").innerHTML = editorInds.map((ind, i) => `
    <div class="ind-editor-row">
      <div class="ind-row-num" style="align-self:end;margin-bottom:2px;">#${i + 1}</div>
      <div class="ef">
        <label>Name</label>
        <input type="text" id="ie-name-${i}" value="${escHtml(ind.name)}" maxlength="30">
      </div>
      <div class="ef">
        <label>Emoji</label>
        <button type="button" class="emoji-btn" id="ie-emoji-btn-${i}"
          onclick="toggleEmojiPicker('ie-emoji-btn-${i}','ie-emoji-${i}')">
          <span class="ep-emoji">${ind.emoji}</span><span class="ep-arrow">▾</span>
        </button>
        <input type="hidden" id="ie-emoji-${i}" value="${ind.emoji}">
      </div>
      <div class="ef">
        <label>Base Cost ($)</label>
        <input type="number" id="ie-cost-${i}" value="${ind.baseCost}" min="1" step="1">
      </div>
      <div class="ef">
        <label>Income ($/s)</label>
        <input type="number" id="ie-income-${i}" value="${ind.baseIncome}" min="0.01" step="0.01">
      </div>
      <div style="display:flex;align-items:flex-end;">
        <button class="ie-del-btn" onclick="removeEditorRow(${i})" title="Remove building"
          ${editorInds.length <= 1 ? "disabled" : ""}>✕</button>
      </div>
    </div>
  `).join("");
}

function addEditorRow() {
  editorInds = getEditorValues();
  editorInds.push({ id: editorInds.length, name: "New Building", emoji: "🏗️", baseCost: 100, baseIncome: 1.0 });
  renderEditorRows();
  const last = document.getElementById(`ie-name-${editorInds.length - 1}`);
  if (last) { last.scrollIntoView({ behavior: "smooth", block: "center" }); last.focus(); }
}

function removeEditorRow(i) {
  if (editorInds.length <= 1) return;
  editorInds = getEditorValues();
  editorInds.splice(i, 1);
  editorInds = editorInds.map((ind, idx) => ({ ...ind, id: idx }));
  renderEditorRows();
}

async function renderIndustryEditor() {
  const { data } = await sb.rpc("get_game_config");
  if (data) applyGameConfig(data);

  const cfg    = data || {};
  const scale  = cfg.costScale       || COST_SCALE;
  const maxH   = cfg.maxOfflineHours || (MAX_OFFLINE / 3600);
  const idleMult = cfg.idleMultiplier ?? IDLE_MULTIPLIER;

  document.getElementById("cfg-cost-scale").value      = scale;
  document.getElementById("cfg-max-offline").value     = maxH;
  document.getElementById("cfg-starting-money").value  = cfg.startingMoney ?? STARTING_MONEY;
  document.getElementById("cfg-idle-multiplier").value = idleMult;

  editorInds = INDUSTRIES.map(x => ({ ...x }));
  renderEditorRows();
}

document.getElementById("add-building-btn").addEventListener("click", addEditorRow);

document.getElementById("cfg-save-btn").addEventListener("click", async () => {
  const btn      = document.getElementById("cfg-save-btn");
  const statusEl = document.getElementById("cfg-status");
  btn.disabled = true;
  statusEl.className = "status-msg";
  statusEl.textContent = "Saving…";

  const industries      = getEditorValues();
  const costScale       = parseFloat(document.getElementById("cfg-cost-scale").value)       || DEFAULT_COST_SCALE;
  const maxOfflineHours = parseFloat(document.getElementById("cfg-max-offline").value)      || DEFAULT_MAX_OFFLINE_H;
  const startingMoney   = parseFloat(document.getElementById("cfg-starting-money").value)   || 10;
  const idleMultiplier  = parseFloat(document.getElementById("cfg-idle-multiplier").value)  || DEFAULT_IDLE_MULTIPLIER;

  const { data: cfgData } = await sb.rpc("get_game_config");
  const newCfg = { ...(cfgData || {}), industries, costScale, maxOfflineHours, startingMoney, idleMultiplier };

  const { data, error } = await sb.rpc("set_game_config", { p_user_id: currentUserId, p_config: newCfg });
  btn.disabled = false;

  if (error || data?.error) {
    statusEl.className   = "status-msg err";
    statusEl.textContent = error?.message || data?.error || "Failed to save.";
  } else {
    applyGameConfig(newCfg);
    editorInds = INDUSTRIES.map(x => ({ ...x }));
    statusEl.className   = "status-msg ok";
    statusEl.textContent = "Saved! Changes are live for all players.";
    setTimeout(() => { statusEl.textContent = ""; }, 4000);
  }
});

document.getElementById("cfg-reset-btn").addEventListener("click", async () => {
  if (!confirm("Reset industry config to original defaults? This will remove any custom buildings.")) return;
  const btn      = document.getElementById("cfg-save-btn");
  const statusEl = document.getElementById("cfg-status");
  btn.disabled = true;

  const defaultCfg = {
    industries:      DEFAULT_INDUSTRIES.map(x => ({ ...x })),
    costScale:       DEFAULT_COST_SCALE,
    maxOfflineHours: DEFAULT_MAX_OFFLINE_H,
    idleMultiplier:  DEFAULT_IDLE_MULTIPLIER,
  };

  const { data, error } = await sb.rpc("set_game_config", { p_user_id: currentUserId, p_config: defaultCfg });
  btn.disabled = false;

  if (error || data?.error) {
    statusEl.className   = "status-msg err";
    statusEl.textContent = error?.message || data?.error || "Failed.";
  } else {
    applyGameConfig(defaultCfg);
    await renderIndustryEditor();
    statusEl.className   = "status-msg ok";
    statusEl.textContent = "Reset to defaults.";
    setTimeout(() => { statusEl.textContent = ""; }, 3000);
  }
});

// ── Rank editor ───────────────────────────────────────────────
let editorRanks = [];

function getRankEditorValues() {
  return editorRanks.map((r, i) => ({
    id:           i,
    name:         document.getElementById(`re-name-${i}`)?.value.trim()         || r.name    || "Rank",
    emoji:        document.getElementById(`re-emoji-${i}`)?.value.trim()        || r.emoji   || "⭐",
    incomeBonus:  (parseFloat(document.getElementById(`re-income-${i}`)?.value) || 0) / 100,
    offlineBonus: parseFloat(document.getElementById(`re-offline-${i}`)?.value) || 0,
  }));
}

function renderRankEditorRows() {
  document.getElementById("rank-editor").innerHTML = editorRanks.map((r, i) => `
    <div class="rank-editor-row">
      <div class="ind-row-num" style="align-self:end;margin-bottom:2px;">#${i + 1}</div>
      <div class="ef">
        <label>Rank Name</label>
        <input type="text" id="re-name-${i}" value="${escHtml(r.name)}" maxlength="20">
      </div>
      <div class="ef">
        <label>Emoji</label>
        <button type="button" class="emoji-btn" id="re-emoji-btn-${i}"
          onclick="toggleEmojiPicker('re-emoji-btn-${i}','re-emoji-${i}')">
          <span class="ep-emoji">${r.emoji}</span><span class="ep-arrow">▾</span>
        </button>
        <input type="hidden" id="re-emoji-${i}" value="${r.emoji}">
      </div>
      <div class="ef">
        <label>Income Bonus (%)</label>
        <input type="number" id="re-income-${i}" value="${Math.round((r.incomeBonus || 0) * 100)}" min="0" step="1" max="500">
      </div>
      <div class="ef">
        <label>Offline Bonus (hrs)</label>
        <input type="number" id="re-offline-${i}" value="${r.offlineBonus || 0}" min="0" step="0.5" max="24">
      </div>
      <div style="display:flex;align-items:flex-end;">
        <button class="ie-del-btn" onclick="removeRankRow(${i})" title="Remove rank"
          ${editorRanks.length <= 1 ? "disabled" : ""}>✕</button>
      </div>
    </div>
  `).join("");
}

function addRankRow() {
  editorRanks = getRankEditorValues();
  editorRanks.push({ id: editorRanks.length, name: "New Rank", emoji: "⭐", incomeBonus: 0, offlineBonus: 0 });
  renderRankEditorRows();
  const last = document.getElementById(`re-name-${editorRanks.length - 1}`);
  if (last) { last.scrollIntoView({ behavior: "smooth", block: "center" }); last.focus(); }
}

function removeRankRow(i) {
  if (editorRanks.length <= 1) return;
  editorRanks = getRankEditorValues();
  editorRanks.splice(i, 1);
  editorRanks = editorRanks.map((r, idx) => ({ ...r, id: idx }));
  renderRankEditorRows();
}

async function renderRankEditor() {
  const { data } = await sb.rpc("get_game_config");
  if (data) applyGameConfig(data);
  editorRanks = RANKS.map(x => ({ ...x }));
  renderRankEditorRows();
}

document.getElementById("add-rank-btn").addEventListener("click", addRankRow);

document.getElementById("rank-save-btn").addEventListener("click", async () => {
  const btn      = document.getElementById("rank-save-btn");
  const statusEl = document.getElementById("rank-status");
  btn.disabled = true;
  statusEl.className = "status-msg";
  statusEl.textContent = "Saving…";

  const ranks = getRankEditorValues();
  const { data: cfgData } = await sb.rpc("get_game_config");
  const newCfg = { ...(cfgData || {}), ranks };

  const { data, error } = await sb.rpc("set_game_config", { p_user_id: currentUserId, p_config: newCfg });
  btn.disabled = false;

  if (error || data?.error) {
    statusEl.className   = "status-msg err";
    statusEl.textContent = error?.message || data?.error || "Failed to save.";
  } else {
    applyGameConfig(newCfg);
    editorRanks = RANKS.map(x => ({ ...x }));
    statusEl.className   = "status-msg ok";
    statusEl.textContent = "Ranks saved! Live for all players on next login.";
    setTimeout(() => { statusEl.textContent = ""; }, 4000);
  }
});

document.getElementById("rank-reset-btn").addEventListener("click", () => {
  if (!confirm("Reset ranks to defaults? Any custom ranks will be lost from this editor.")) return;
  editorRanks = DEFAULT_RANKS.map(x => ({ ...x }));
  renderRankEditorRows();
  const s = document.getElementById("rank-status");
  s.className  = "status-msg ok";
  s.textContent = "Defaults loaded — click Save Ranks to apply.";
  setTimeout(() => { s.textContent = ""; }, 3500);
});

// ── Events editor (Server tab) ────────────────────────────────
let editorEvents = [];

function getEditorEventValues() {
  return editorEvents.map((ev, i) => ({
    id:          i,
    name:        document.getElementById(`ev-name-${i}`)?.value.trim()  || ev.name  || "Event",
    incomeBonus: (parseFloat(document.getElementById(`ev-bonus-${i}`)?.value) || 0) / 100,
    startTime:   document.getElementById(`ev-start-${i}`)?.value || ev.startTime || "",
    endTime:     document.getElementById(`ev-end-${i}`)?.value   || ev.endTime   || "",
    motd:        document.getElementById(`ev-motd-${i}`)?.value.trim() || "",
  }));
}

function getEventEditorStatus(ev) {
  if (!ev.startTime || !ev.endTime) return null;
  const sgt   = new Date(Date.now() + 8 * 3600000);
  const today = `${sgt.getUTCFullYear()}-${String(sgt.getUTCMonth()+1).padStart(2,"0")}-${String(sgt.getUTCDate()).padStart(2,"0")}`;
  if (today >= ev.startTime && today <= ev.endTime) return { label: "🟢 Active",    cls: "active"    };
  if (today < ev.startTime)                         return { label: "⏳ Scheduled", cls: "scheduled" };
  return                                                   { label: "Expired",      cls: "expired"   };
}

function renderEventEditorRows() {
  const container = document.getElementById("event-editor");
  if (editorEvents.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:24px;">No events yet. Click + Add Event to create one.</div>`;
    return;
  }
  container.innerHTML = editorEvents.map((ev, i) => {
    const st = getEventEditorStatus(ev);
    return `
    <div class="event-editor-row">
      <div class="event-editor-top">
        <div class="ef">
          <label>Event Name${st ? ` <span class="ev-status-badge ${st.cls}">${st.label}</span>` : ""}</label>
          <input type="text" id="ev-name-${i}" value="${escHtml(ev.name)}" maxlength="40" placeholder="e.g. Weekend Bonus">
        </div>
        <div class="ef">
          <label>Bonus (%)</label>
          <input type="number" id="ev-bonus-${i}" value="${Math.round((ev.incomeBonus||0)*100)}" min="0" step="1" max="1000" placeholder="0">
        </div>
        <div class="ef">
          <label>Start Date (SGT)</label>
          <input type="date" id="ev-start-${i}" value="${ev.startTime||''}">
        </div>
        <div class="ef">
          <label>End Date (SGT)</label>
          <input type="date" id="ev-end-${i}" value="${ev.endTime||''}">
        </div>
        <div style="display:flex;align-items:flex-end;">
          <button class="ie-del-btn" onclick="removeEventRow(${i})" title="Remove event">✕</button>
        </div>
      </div>
      <div class="ef">
        <label>MOTD — message shown to players while this event is active (optional)</label>
        <input type="text" id="ev-motd-${i}" value="${escHtml(ev.motd||'')}" maxlength="200"
          placeholder="e.g. 🎉 Weekend event! Earn ${Math.round((ev.incomeBonus||0)*100)}% more income!">
      </div>
    </div>`;
  }).join("");
}

function addEventRow() {
  editorEvents = getEditorEventValues();
  editorEvents.push({ id: editorEvents.length, name: "New Event", incomeBonus: 0.5, startTime: "", endTime: "", motd: "" });
  renderEventEditorRows();
  const last = document.getElementById(`ev-name-${editorEvents.length - 1}`);
  if (last) { last.scrollIntoView({ behavior: "smooth", block: "center" }); last.focus(); }
}

function removeEventRow(i) {
  editorEvents = getEditorEventValues();
  editorEvents.splice(i, 1);
  editorEvents = editorEvents.map((ev, idx) => ({ ...ev, id: idx }));
  renderEventEditorRows();
}

async function renderServerTab() {
  const { data } = await sb.rpc("get_game_config");
  if (data) applyGameConfig(data);
  editorEvents = GAME_EVENTS.map(x => ({ ...x }));
  renderEventEditorRows();
  renderEventLivePreview();
}

function renderEventLivePreview() {
  const el = document.getElementById("event-live-preview");
  if (!el) return;

  const now8    = new Date(Date.now() + 8 * 3600000);
  const timeStr = `${now8.getUTCFullYear()}-${String(now8.getUTCMonth()+1).padStart(2,"0")}-${String(now8.getUTCDate()).padStart(2,"0")} (SGT)`;

  if (GAME_EVENTS.length === 0) {
    el.innerHTML = `<div style="color:var(--muted);font-size:0.82rem;">No events configured. Add one below.</div>`;
    return;
  }

  const active   = getActiveEvents();
  const bonusPct = getEventBonus() * 100;

  const rows = GAME_EVENTS.map(ev => {
    const isActive = active.includes(ev);
    const st    = getEventEditorStatus(ev);
    const badge = st ? `<span class="ev-status-badge ${st.cls}" style="margin-left:6px">${st.label}</span>` : "";
    const bonus = ev.incomeBonus ? `+${(ev.incomeBonus * 100).toFixed(0)}% income` : "no income bonus";
    const motd  = ev.motd ? `<span style="color:var(--muted);font-size:0.8rem;"> · MOTD: "${ev.motd}"</span>` : "";
    return `<div style="padding:4px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
      <strong>${escHtml(ev.name)}</strong>${badge}
      <span style="color:var(--muted);margin-left:8px;">${bonus}</span>${motd}
    </div>`;
  }).join("");

  const activeSummary = active.length > 0
    ? `<div style="color:var(--green);font-weight:600;margin-bottom:6px;">🟢 ${active.length} event${active.length !== 1 ? "s" : ""} active now — total income bonus: +${bonusPct.toFixed(0)}%</div>`
    : `<div style="color:var(--muted);font-size:0.82rem;margin-bottom:6px;">No events active right now.</div>`;

  el.innerHTML = `
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px;">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;">Server time: ${escHtml(timeStr)}</div>
      ${activeSummary}${rows}
    </div>`;
}

document.getElementById("add-event-btn").addEventListener("click", addEventRow);

document.getElementById("event-save-btn").addEventListener("click", async () => {
  const btn      = document.getElementById("event-save-btn");
  const statusEl = document.getElementById("event-status");
  btn.disabled = true;
  statusEl.className = "status-msg";
  statusEl.textContent = "Saving…";

  const events = getEditorEventValues();
  const { data: cfgData } = await sb.rpc("get_game_config");
  const newCfg = { ...(cfgData || {}), events };

  const { data, error } = await sb.rpc("set_game_config", { p_user_id: currentUserId, p_config: newCfg });
  btn.disabled = false;

  if (error || data?.error) {
    statusEl.className   = "status-msg err";
    statusEl.textContent = error?.message || data?.error || "Failed.";
  } else {
    applyGameConfig(newCfg);
    editorEvents = GAME_EVENTS.map(x => ({ ...x }));
    renderEventEditorRows();
    renderEventLivePreview();
    statusEl.className   = "status-msg ok";
    statusEl.textContent = `${events.length} event${events.length !== 1 ? "s" : ""} saved — active events are live now.`;
    setTimeout(() => { statusEl.textContent = ""; }, 4000);
  }
});

// ── Accounts management ───────────────────────────────────────
async function loadUsersTable() {
  document.getElementById("user-count").textContent        = "Loading…";
  document.getElementById("users-container").innerHTML = '<div class="empty-state">Loading…</div>';

  const { data, error } = await sb.rpc("list_users", { p_user_id: currentUserId });

  if (error || data?.error) {
    document.getElementById("users-container").innerHTML =
      `<div class="empty-state" style="color:var(--red)">Error: ${error?.message || data?.error}</div>`;
    document.getElementById("user-count").textContent = "Error";
    return;
  }

  const users   = Array.isArray(data) ? data : [];
  const players = users.filter(u => !u.is_admin);
  const admins  = users.filter(u =>  u.is_admin);
  document.getElementById("user-count").textContent =
    `${players.length} player${players.length !== 1 ? "s" : ""}${admins.length ? `, ${admins.length} admin${admins.length !== 1 ? "s" : ""}` : ""}`;

  if (users.length === 0) {
    document.getElementById("users-container").innerHTML = '<div class="empty-state">No accounts yet.</div>';
    return;
  }

  function renderRow(u) {
    const isSelf = u.user_id === currentUserId;
    const rid    = u.rank_id ?? 0;
    const opts   = RANKS.map((r, i) =>
      `<option value="${i}" ${i === rid ? "selected" : ""}>${r.emoji} ${escHtml(r.name)}</option>`
    ).join("");
    const adminBadge = u.is_admin ? `<span class="admin-badge">ADMIN</span>` : "";
    const actions = `
      <button class="btn-del" style="border-color:var(--green);color:var(--green);" onclick="openSetMoney('${u.user_id}','${escHtml(u.username)}',${u.money ?? 0})">Set $</button>
      <button class="btn-del" style="border-color:var(--yellow);color:var(--yellow);" onclick="confirmResetSave('${u.user_id}','${escHtml(u.username)}')">Reset Save</button>
      <button class="btn-del" style="border-color:var(--accent);color:var(--accent-hover);" onclick="openResetPw('${u.user_id}','${escHtml(u.username)}')">Reset PW</button>
      ${!isSelf && u.is_admin  ? `<button class="btn-del" style="border-color:var(--yellow);color:var(--yellow);" onclick="toggleAdminStatus('${u.user_id}','${escHtml(u.username)}',false)">Revoke Admin</button>` : ""}
      ${!isSelf && !u.is_admin ? `<button class="btn-del" style="border-color:var(--muted);color:var(--muted);" onclick="toggleAdminStatus('${u.user_id}','${escHtml(u.username)}',true)">Make Admin</button>` : ""}
      ${!isSelf               ? `<button class="btn-del" onclick="confirmDeleteUser('${u.user_id}','${escHtml(u.username)}')">Delete</button>` : ""}
    `;
    return `<tr${isSelf ? ' style="background:rgba(108,99,255,0.07)"' : ""}>
      <td><strong>${escHtml(u.username)}</strong>${adminBadge}${isSelf ? '<span style="font-size:0.7rem;color:var(--muted);margin-left:4px;">(you)</span>' : ""}</td>
      <td><select class="rank-select" data-uid="${u.user_id}">${opts}</select></td>
      <td class="money-cell">${u.money != null ? fmt(u.money) : "—"}</td>
      <td class="time-cell">${u.last_save ? new Date(u.last_save).toLocaleString() : "Never"}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap;">${actions}</td>
    </tr>`;
  }

  document.getElementById("users-container").innerHTML = `
    <table class="users-tbl">
      <thead><tr><th>Username</th><th>Rank</th><th>Money</th><th>Last Active</th><th>Actions</th></tr></thead>
      <tbody>${users.map(renderRow).join("")}</tbody>
    </table>
  `;
}

document.getElementById("users-container").addEventListener("change", async e => {
  const sel = e.target.closest(".rank-select");
  if (!sel) return;
  const uid    = sel.dataset.uid;
  const rankId = parseInt(sel.value);
  sel.style.borderColor = "";
  const { data, error } = await sb.rpc("admin_set_rank", {
    p_admin_id: currentUserId, p_target_id: uid, p_rank_id: rankId,
  });
  if (error || data?.error) {
    alert("Failed to set rank: " + (error?.message || data?.error));
    await loadUsersTable();
  } else {
    sel.style.borderColor = "var(--green)";
    setTimeout(() => { if (sel) sel.style.borderColor = ""; }, 1500);
  }
});

document.getElementById("refresh-users-btn").addEventListener("click", loadUsersTable);

async function confirmDeleteUser(targetId, targetName) {
  if (!confirm(`Delete account "${targetName}"?\n\nThis will permanently remove their account and all save data.`)) return;
  const { data, error } = await sb.rpc("admin_delete_user", { p_admin_id: currentUserId, p_target_id: targetId });
  if (error || data?.error) { alert("Error: " + (error?.message || data?.error)); }
  else { await loadUsersTable(); }
}

// ── Reset password modal ──────────────────────────────────────
let modalTargetId = null;

function openResetPw(targetId, targetName) {
  modalTargetId = targetId;
  document.getElementById("modal-target-name").textContent = targetName;
  document.getElementById("modal-new-pw").value = "";
  document.getElementById("modal-error").textContent = "";
  document.getElementById("reset-pw-modal").classList.add("visible");
  setTimeout(() => document.getElementById("modal-new-pw").focus(), 50);
}

document.getElementById("modal-cancel-btn").addEventListener("click", () => {
  document.getElementById("reset-pw-modal").classList.remove("visible");
  modalTargetId = null;
});

document.getElementById("modal-confirm-btn").addEventListener("click", async () => {
  const pw  = document.getElementById("modal-new-pw").value;
  const btn = document.getElementById("modal-confirm-btn");
  if (!pw || pw.length < 6) { document.getElementById("modal-error").textContent = "Password must be at least 6 characters."; return; }
  btn.disabled = true;
  const { data, error } = await sb.rpc("admin_reset_password", {
    p_admin_id: currentUserId, p_target_id: modalTargetId, p_new_password: pw,
  });
  btn.disabled = false;
  if (error || data?.error) {
    document.getElementById("modal-error").textContent = error?.message || data?.error;
  } else {
    document.getElementById("reset-pw-modal").classList.remove("visible");
    modalTargetId = null;
  }
});

// ── Set player money modal ────────────────────────────────────
let smTargetId = null;

function openSetMoney(targetId, targetName, currentMoney) {
  smTargetId = targetId;
  document.getElementById("sm-target-name").textContent = targetName;
  document.getElementById("sm-amount").value = Math.floor(currentMoney);
  document.getElementById("sm-error").textContent = "";
  document.getElementById("set-money-modal").classList.add("visible");
  setTimeout(() => document.getElementById("sm-amount").focus(), 50);
}

document.getElementById("sm-cancel-btn").addEventListener("click", () => {
  document.getElementById("set-money-modal").classList.remove("visible");
  smTargetId = null;
});

document.getElementById("sm-confirm-btn").addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("sm-amount").value);
  const btn    = document.getElementById("sm-confirm-btn");
  if (isNaN(amount) || amount < 0) { document.getElementById("sm-error").textContent = "Enter a valid amount (0 or more)."; return; }
  btn.disabled = true;
  const { data, error } = await sb.rpc("admin_set_money", {
    p_admin_id: currentUserId, p_target_id: smTargetId, p_money: amount,
  });
  btn.disabled = false;
  if (error || data?.error) {
    document.getElementById("sm-error").textContent = error?.message || data?.error;
  } else {
    document.getElementById("set-money-modal").classList.remove("visible");
    smTargetId = null;
    await loadUsersTable();
  }
});

// ── Reset player save ─────────────────────────────────────────
async function confirmResetSave(targetId, targetName) {
  if (!confirm(`Reset save for "${targetName}"?\n\nThis clears all their buildings and money. Their account stays active.`)) return;
  const { data, error } = await sb.rpc("admin_reset_save", { p_admin_id: currentUserId, p_target_id: targetId });
  if (error || data?.error) { alert("Error: " + (error?.message || data?.error)); }
  else { await loadUsersTable(); }
}

// ── Toggle admin status ───────────────────────────────────────
async function toggleAdminStatus(targetId, targetName, makeAdmin) {
  const warn = makeAdmin
    ? `Make "${targetName}" an admin?\n\nThey will have full access to the admin console on next login.`
    : `Revoke admin for "${targetName}"?\n\nThey will be treated as a regular player on next login.`;
  if (!confirm(warn)) return;
  const { data, error } = await sb.rpc("admin_set_admin", {
    p_admin_id: currentUserId, p_target_id: targetId, p_is_admin: makeAdmin,
  });
  if (error || data?.error) {
    alert("Error: " + (error?.message || data?.error));
  } else {
    const msg = makeAdmin
      ? `✅ "${targetName}" is now an admin. They'll have admin access on next login.`
      : `✅ Admin access revoked for "${targetName}".`;
    showAdminToast(msg);
    await loadUsersTable();
  }
}

function showAdminToast(msg) {
  let toast = document.getElementById("admin-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "admin-toast";
    toast.style.cssText = "position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;padding:10px 20px;border-radius:8px;font-weight:600;font-size:0.9rem;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:opacity .3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._to);
  toast._to = setTimeout(() => { toast.style.opacity = "0"; }, 3500);
}
