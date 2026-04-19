// ── Screen switching ──────────────────────────────────────────
function showScreen(id) {
  ["game-screen", "admin-screen"].forEach(s => {
    document.getElementById(s).classList.toggle("visible", s === id);
  });
}
function showGame(username) {
  document.getElementById("username-display").textContent = username;
  showScreen("game-screen");
  updateEventBanner();
}
function showAdmin(username) {
  document.getElementById("admin-username-display").textContent = username;
  showScreen("admin-screen");
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

// ── Offline receipt ───────────────────────────────────────────
document.getElementById("receipt-collect-btn").addEventListener("click", () => {
  document.getElementById("offline-receipt-modal").classList.remove("visible");
});
document.getElementById("offline-receipt-modal").addEventListener("click", e => {
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
