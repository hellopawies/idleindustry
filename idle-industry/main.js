// ── App icon (Apple touch icon via canvas) ────────────────
function initIcons() {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 180;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0f0f13";
    ctx.beginPath();
    const r = 36;
    ctx.moveTo(r, 0); ctx.arcTo(180, 0, 180, 180, r); ctx.arcTo(180, 180, 0, 180, r);
    ctx.arcTo(0, 180, 0, 0, r); ctx.arcTo(0, 0, 180, 0, r); ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "#6c63ff";
    ctx.shadowBlur  = 18;
    ctx.fillStyle      = "#6c63ff";
    ctx.font           = "bold 86px system-ui, -apple-system, sans-serif";
    ctx.textAlign      = "center";
    ctx.textBaseline   = "middle";
    ctx.fillText("II", 90, 96);
    const link = document.createElement("link");
    link.rel   = "apple-touch-icon";
    link.sizes = "180x180";
    link.href  = c.toDataURL("image/png");
    document.head.appendChild(link);
  } catch (e) { /* canvas blocked, skip */ }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  initIcons();
  await syncServerTime();

  const session = loadSession();
  if (!session?.userId || !session?.username) {
    window.location.href = '../';
    return;
  }

  const adminFlag = sessionStorage.getItem("pg_admin_mode") === "1";
  sessionStorage.removeItem("pg_admin_mode");
  const isAdminMode = session.isAdmin && adminFlag;
  if (isAdminMode) {
    await onAdminLogin(session.userId, session.username);
  } else {
    await onLogin(session.userId, session.username);
  }
}

init();
