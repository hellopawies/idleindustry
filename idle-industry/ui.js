// ── Screen switching ──────────────────────────────────────────
function showScreen(id) {
  ["auth-screen", "game-screen", "admin-screen"].forEach(s => {
    document.getElementById(s).classList.toggle("visible", s === id);
  });
}
function showGame(username) {
  stopLoginStats();
  document.getElementById("username-display").textContent = username;
  showScreen("game-screen");
  updateEventBanner();
}
function showAdmin(username) {
  stopLoginStats();
  document.getElementById("admin-username-display").textContent = username;
  showScreen("admin-screen");
}
function showAuth() {
  showScreen("auth-screen");
  startLoginStats();
  setTimeout(() => document.getElementById("auth-username").focus(), 50);
}

// ── Login page live stats ─────────────────────────────────────
let loginStatsInterval = null;

function stopLoginStats() {
  if (loginStatsInterval) { clearInterval(loginStatsInterval); loginStatsInterval = null; }
}

async function startLoginStats() {
  stopLoginStats();

  function tick() {
    const t  = new Date(now() + 8 * 3600000);
    const hh = String(t.getUTCHours()).padStart(2, "0");
    const mm = String(t.getUTCMinutes()).padStart(2, "0");
    const ss = String(t.getUTCSeconds()).padStart(2, "0");
    const el = document.getElementById("ls-time");
    if (el) el.textContent = `${hh}:${mm}:${ss} SGT`;
  }
  tick();
  loginStatsInterval = setInterval(tick, 1000);

  document.getElementById("ls-multiplier").textContent = COST_SCALE + "×";
  document.getElementById("ls-idle").textContent       = (MAX_OFFLINE / 3600).toFixed(1) + "h";
  document.getElementById("ls-idle-mult").textContent  = IDLE_MULTIPLIER + "×";

  const { data } = await sb.rpc("get_public_stats");
  if (data) {
    const el = document.getElementById("ls-accounts");
    if (el) el.textContent = data.player_count ?? "—";
    if (data.cost_scale)        { document.getElementById("ls-multiplier").textContent = data.cost_scale + "×"; }
    if (data.max_offline_hours) { document.getElementById("ls-idle").textContent       = data.max_offline_hours + "h"; }
    if (data.idle_multiplier)   { document.getElementById("ls-idle-mult").textContent  = data.idle_multiplier + "×"; }
  }
}

// ── Animated background canvas ────────────────────────────────
function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  let t = 0;

  const charts = [
    { baseY: 0.22, amp: 55, freq: 0.011, speed: 0.38, phase: 0.0, color: "108,99,255"  },
    { baseY: 0.50, amp: 38, freq: 0.008, speed: 0.24, phase: 2.1, color: "133,125,248" },
    { baseY: 0.75, amp: 42, freq: 0.014, speed: 0.31, phase: 4.5, color: "76,175,138"  },
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const gC = 14, gR = 9;
    for (let c = 0; c <= gC; c++) {
      ctx.strokeStyle = "rgba(108,99,255,0.055)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo((c / gC) * W, 0); ctx.lineTo((c / gC) * W, H); ctx.stroke();
    }
    for (let r = 0; r <= gR; r++) {
      ctx.strokeStyle = r === gR ? "rgba(108,99,255,0.10)" : "rgba(108,99,255,0.045)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, (r / gR) * H); ctx.lineTo(W, (r / gR) * H); ctx.stroke();
    }

    const bars = 22, bw = W / bars;
    for (let b = 0; b < bars; b++) {
      const bh = (0.25 + 0.75 * Math.abs(Math.sin(b * 0.61 + t * 0.0006))) * H * 0.22;
      const x  = b * bw;
      const g  = ctx.createLinearGradient(x, H - bh, x, H);
      g.addColorStop(0, "rgba(108,99,255,0.08)"); g.addColorStop(1, "rgba(108,99,255,0.0)");
      ctx.fillStyle = g;
      ctx.fillRect(x + 2, H - bh, bw - 4, bh);
    }

    charts.forEach(ch => {
      const by = ch.baseY * H;
      function yAt(x) {
        return by + Math.sin(x * ch.freq + t * ch.speed * 0.001) * ch.amp
                  + Math.sin(x * ch.freq * 2.3 + t * ch.speed * 0.00065) * ch.amp * 0.35;
      }

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) ctx.lineTo(x, yAt(x));
      ctx.lineTo(W, H); ctx.closePath();
      const ag = ctx.createLinearGradient(0, by - ch.amp, 0, by + ch.amp + 30);
      ag.addColorStop(0, `rgba(${ch.color},0.055)`); ag.addColorStop(1, `rgba(${ch.color},0.0)`);
      ctx.fillStyle = ag; ctx.fill();

      ctx.beginPath(); ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${ch.color},0.22)`;
      const pts = [];
      for (let x = 0; x <= W; x += 4) {
        const y = yAt(x);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        if (x % 72 < 4) pts.push({ x, y });
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(${ch.color},0.5)`;
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill(); });
    });

    ctx.strokeStyle = "rgba(108,99,255,0.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W - 70, 18); ctx.lineTo(W - 18, 18); ctx.lineTo(W - 18, 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, H - 18); ctx.lineTo(18, H - 18); ctx.lineTo(18, H - 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, 18); ctx.lineTo(18, 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, 18); ctx.lineTo(70, 18); ctx.stroke();

    t++;
    requestAnimationFrame(draw);
  }

  draw();
}

// ── Emoji picker ──────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { label: "Rank & Awards",  emojis: ["🪪","💼","📊","🏢","🎯","👑","⭐","🌟","💫","🏅","🥇","🥈","🥉","🎖️","🏆","🎗️","🔰","💎","👔","🤴","👸","🧑‍💼","🥋","🎓"] },
  { label: "Business",       emojis: ["💰","💵","💴","💶","💷","💸","🏦","📈","📉","📋","📌","📎","🖊️","📝","🗂️","🗃️","📂","🗓️","🤝","📣","📢","🔔","🧾","💹","🪙"] },
  { label: "Technology",     emojis: ["💻","🖥️","📱","⌨️","🖱️","💾","💿","📡","🔌","🔋","⚡","🤖","🛰️","📟","📠","🖨️","📷","📸","🎮","🕹️"] },
  { label: "Buildings",      emojis: ["🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🏗️","🏘️","⛪","🕌","🛖"] },
  { label: "Transport",      emojis: ["🚀","🛸","✈️","🚂","🚗","🛳️","🚁","🚢","🛥️","🚤","🏎️","🛶","🚀","🛺","🚌","🚎","🏍️","🚲","⛵","🛩️"] },
  { label: "Industry",       emojis: ["⚙️","🔧","🔨","🪛","🔩","⛏️","🪚","🔑","🗝️","🔒","🛡️","⚔️","🪓","🛢️","⛽","⚗️","🧪","🔬","🔭","🪝","🧲","🪤"] },
  { label: "Nature",         emojis: ["🌱","🌿","🍀","🌺","🌸","🌻","🌙","☀️","🌊","🔥","💧","🌍","🌋","⛰️","🏔️","🌾","🌵","🌴","❄️","🌈","⛅","🌪️"] },
  { label: "Food & Economy", emojis: ["🍋","🥐","🍕","☕","🍺","🍾","🎂","🛢️","⛽","🌾","🐄","🐖","🐟","🦐","🌽","🍯","🥩","🧀","🍷","🥂"] },
  { label: "Symbols",        emojis: ["❤️","💜","💙","💚","💛","🧡","❤️‍🔥","✨","💥","🎆","🎇","🎉","🎊","🎁","🎀","🎈","🔮","💡","🗺️","📍","🚩","🏁"] },
];

let pickerBtnId = null;
let pickerInpId = null;

(function initEmojiPicker() {
  const panel = document.getElementById("emoji-picker-panel");
  panel.innerHTML = EMOJI_CATEGORIES.map(cat => `
    <span class="ep-cat-label">${cat.label}</span>
    <div class="ep-cat-grid">
      ${cat.emojis.map(e => `<button type="button" class="ep-item" data-emoji="${e}">${e}</button>`).join("")}
    </div>
  `).join("");

  panel.addEventListener("click", e => {
    const btn = e.target.closest(".ep-item");
    if (btn) selectEmoji(btn.dataset.emoji);
  });

  document.addEventListener("click", e => {
    if (!pickerBtnId) return;
    if (!panel.contains(e.target) && !e.target.closest(".emoji-btn")) closeEmojiPicker();
  });
})();

function toggleEmojiPicker(btnId, inpId) {
  const panel = document.getElementById("emoji-picker-panel");
  if (pickerBtnId === btnId && panel.style.display !== "none") { closeEmojiPicker(); return; }
  if (pickerBtnId) document.getElementById(pickerBtnId)?.classList.remove("ep-active");
  pickerBtnId = btnId;
  pickerInpId = inpId;
  const btn = document.getElementById(btnId);
  btn.classList.add("ep-active");
  panel.style.display = "block";
  const rect = btn.getBoundingClientRect();
  let top = rect.bottom + 6, left = rect.left;
  if (left + 280 > window.innerWidth)  left = window.innerWidth  - 280;
  if (top  + 278 > window.innerHeight) top  = rect.top - 278;
  panel.style.top  = top  + "px";
  panel.style.left = left + "px";
}

function closeEmojiPicker() {
  document.getElementById("emoji-picker-panel").style.display = "none";
  if (pickerBtnId) document.getElementById(pickerBtnId)?.classList.remove("ep-active");
  pickerBtnId = null;
  pickerInpId = null;
}

function selectEmoji(emoji) {
  if (!pickerBtnId) return;
  const inp = document.getElementById(pickerInpId);
  if (inp) inp.value = emoji;
  const btn = document.getElementById(pickerBtnId);
  if (btn) { const span = btn.querySelector(".ep-emoji"); if (span) span.textContent = emoji; }
  closeEmojiPicker();
}

// ── Changelog ─────────────────────────────────────────────────
const CHANGELOG = [
  {
    version: "v0.8.0", date: "2026-03-23",
    changes: [
      "Version tag on login screen is now a label (not a button)",
      "Username placeholder changed from 'your_username' to 'Username'",
      "Admin can now set a global Idle Income Multiplier — scales how much players earn while offline",
      "Login stats now shows the Idle Bonus multiplier",
      "New buildings from v0.7.0 now always appear even if the server config predates them",
    ],
  },
  {
    version: "v0.7.0", date: "2026-03-23",
    changes: [
      "Version number now shown on the login screen next to the game title",
      "Buy ×10/×100 now uses 'buy up to N' — buys however many you can afford, up to the selected amount",
      "5 new late-game buildings: Quantum Nexus, Neural Galaxy, Dark Matter Engine, Time Forge, Entropy Vault",
      "New buildings have very tough balance — payback times range from ~7 hours to ~77 hours per unit",
    ],
  },
  {
    version: "v0.6.0", date: "2026-03-23",
    changes: [
      "Buildings unlock progressively — buy at least one of each before the next is revealed",
      "Buy quantity selector: ×1, ×10, ×100, and Max above the industry list",
      "App favicon and Apple touch icon (add to home screen on iOS for the game icon)",
    ],
  },
  {
    version: "v0.5.0", date: "2026-03-23",
    changes: [
      "Full mobile layout: header stacks stats below title, industry cards and buttons are touch-friendly",
      "Admin editor rows reflow to multi-line on narrow screens",
      "Login stats bar switches to 2×2 grid on mobile",
    ],
  },
  {
    version: "v0.4.0", date: "2026-03-23",
    changes: [
      "Added 4 new late-game buildings: Megacorp, AI Conglomerate, Dyson Sphere, and Galactic Empire",
      "Payback times scale ~1.8× per tier at the high end — Galactic Empire takes ~4 hours per unit to break even",
    ],
  },
  {
    version: "v0.3.0", date: "2026-03-23",
    changes: [
      "Added animated business-theme background across all screens",
      "Added live server stats on login page (SGT server time, active accounts, cost multiplier, idle cap)",
      "Added leaderboard — see the top 20 richest players on the server",
      "Added version number and this changelog",
    ],
  },
  {
    version: "v0.2.0", date: "2026-03-22",
    changes: [
      "Added player rank system: Intern → Associate → Manager → Director → VP → CEO",
      "Each rank provides an income multiplier bonus and extra offline earning hours",
      "Your current rank badge is now shown in the game header",
    ],
  },
  {
    version: "v0.1.0", date: "2026-03-21",
    changes: [
      "Initial launch — build industries and earn money passively",
      "Cloud save syncs your progress automatically every 5 ticks",
      "Offline income accrues while you're away, up to the idle cap",
      "Reset game option available at the bottom of the screen",
    ],
  },
];

function openChangelog() {
  document.getElementById("changelog-content").innerHTML = CHANGELOG.map(entry => `
    <div class="cl-entry">
      <div class="cl-header">
        <span class="cl-ver-tag">${entry.version}</span>
        <span class="cl-date">${entry.date}</span>
      </div>
      <ul class="cl-items">
        ${entry.changes.map(c => `<li>${escHtml(c)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
  document.getElementById("changelog-modal").classList.add("visible");
}

document.getElementById("changelog-close-btn").addEventListener("click", () => {
  document.getElementById("changelog-modal").classList.remove("visible");
});
document.getElementById("changelog-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("visible");
});

// ── Leaderboard ───────────────────────────────────────────────
async function loadLeaderboard() {
  const content = document.getElementById("leaderboard-content");
  content.innerHTML = '<div class="lb-empty">Loading…</div>';

  const { data, error } = await sb.rpc("get_leaderboard");
  const rows = Array.isArray(data) ? data : [];

  if (error || rows.length === 0) {
    content.innerHTML = '<div class="lb-empty">No data yet — be the first on the board!</div>';
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const myName = currentUsername?.toLowerCase();
  const inTop  = rows.some(r => r.username?.toLowerCase() === myName);

  content.innerHTML = `
    <table class="lb-table">
      <thead>
        <tr>
          <th class="lb-pos">#</th><th>Player</th><th>Rank</th><th class="lb-money">Net Worth</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => {
          const rank = RANKS[row.rank_id] || RANKS[0];
          const pos  = medals[i] ?? (i + 1);
          const isMe = row.username?.toLowerCase() === myName;
          return `<tr class="${isMe ? "lb-you" : ""}">
            <td class="lb-pos">${pos}</td>
            <td><strong>${escHtml(row.username)}</strong>${isMe ? '<span class="lb-you-tag">You</span>' : ""}</td>
            <td>${rank.emoji} ${escHtml(rank.name)}</td>
            <td class="lb-money">${fmt(row.money ?? 0)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    ${!inTop && myName ? `<div class="lb-not-ranked">You are not in the top 20 yet — keep earning!</div>` : ""}
  `;
}

function openLeaderboard() {
  document.getElementById("leaderboard-modal").classList.add("visible");
  loadLeaderboard();
}

document.getElementById("lb-close-btn").addEventListener("click", () => {
  document.getElementById("leaderboard-modal").classList.remove("visible");
});
document.getElementById("lb-refresh-btn").addEventListener("click", loadLeaderboard);
document.getElementById("leaderboard-btn").addEventListener("click", openLeaderboard);
document.getElementById("leaderboard-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("visible");
});

// ── Utility ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
