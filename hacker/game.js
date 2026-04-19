const G = {
  missionIdx:      0,
  missionsDone:    [],
  tools:           ['basic_cracker'],
  crypto:          0,
  notoriety:       0,

  // Session-only
  connected:       null,
  trace:           0,
  downloadedFiles: [],
};

async function init() {
  let session;
  try { session = JSON.parse(localStorage.getItem('pg_session')); } catch {}
  if (!session?.userId) { window.location.href = '../'; return; }

  const username = session.username || 'ghost';
  document.getElementById('hud-user').textContent   = username;
  document.getElementById('prompt').textContent     = `${username}@terminal:~$`;

  const saved = await loadCloud();
  if (saved) applyPayload(saved);

  updateHUD();
  updateSidebar();

  if (!localStorage.getItem('hacker_intro_seen')) {
    showIntro(username);
  } else {
    document.getElementById('intro-overlay').hidden = true;
    startMission();
  }
}

function applyPayload(saved) {
  G.missionIdx   = saved.missionIdx   ?? 0;
  G.missionsDone = saved.missionsDone ?? [];
  G.tools        = saved.tools        ?? ['basic_cracker'];
  G.crypto       = saved.crypto       ?? 0;
  G.notoriety    = saved.notoriety    ?? 0;
}

function saveState() {
  saveCloud({ missionIdx: G.missionIdx, missionsDone: G.missionsDone, tools: G.tools, crypto: G.crypto, notoriety: G.notoriety });
}

// ── Intro ─────────────────────────────────────────────────────

function showIntro(username) {
  const overlay = document.getElementById('intro-overlay');
  const textEl  = document.getElementById('intro-text');
  overlay.hidden = false;

  const msg = `Welcome, ${username}.\n\nYour mentor is gone.\nThe system thinks it covered its tracks.\n\nFind the truth. Leave no trace.`;
  let i = 0;
  textEl.textContent = '';
  const iv = setInterval(() => {
    textEl.textContent += msg[i++];
    if (i >= msg.length) clearInterval(iv);
  }, 35);

  document.getElementById('intro-btn').addEventListener('click', () => {
    clearInterval(iv);
    overlay.hidden = true;
    localStorage.setItem('hacker_intro_seen', '1');
    startMission();
  }, { once: true });
}

// ── Mission ───────────────────────────────────────────────────

function getCurrentMission() { return MISSIONS[G.missionIdx] ?? null; }

async function startMission() {
  const mission = getCurrentMission();

  G.connected       = null;
  G.trace           = 0;
  G.downloadedFiles = [];
  updateHUD();
  updateSidebar();

  if (!mission) {
    await printLines([
      { type: 'sys',  text: '[ END OF CURRENT CONTENT ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'You\'ve completed all available missions.' },
      { type: 'dim',  text: 'More chapters coming soon...' },
    ]);
    return;
  }

  await printLines(mission.briefing, 60);
  printEmpty();
}

// ── Command router ────────────────────────────────────────────

async function handleCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1);

  setBusy(true);
  try {
    switch (cmd) {
      case 'help':       await cmdHelp();                    break;
      case 'whoami':     await cmdWhoami();                  break;
      case 'status':     await cmdStatus();                  break;
      case 'clear':      clearOutput();                      break;
      case 'scan':       await cmdScan(args[0]);             break;
      case 'connect':    await cmdConnect(args[0], args[1]); break;
      case 'disconnect': await cmdDisconnect();              break;
      case 'crack':      await cmdCrack();                   break;
      case 'inject':     await cmdInject();                  break;
      case 'ls':         await cmdLs();                      break;
      case 'cat':        await cmdCat(args[0]);              break;
      case 'download':   await cmdDownload(args[0]);         break;
      case 'crypto':     printLine(`Wallet: ${G.crypto} CRYPTO`, 'out-ok'); break;
      default:
        printLine(`Command not found: ${cmd}  — type "help"`, 'out-err');
    }
  } finally {
    setBusy(false);
    printEmpty();
  }

  checkMissionComplete();
}

async function cmdHelp() {
  const mission = getCurrentMission();
  const showInject = G.tools.includes('sqli_kit') || mission?.id === 'a1m2';
  const lines = [
    { type: 'sys',  text: '[ AVAILABLE COMMANDS ]' },
    { type: 'info', text: '  help                — this message' },
    { type: 'info', text: '  whoami              — your profile' },
    { type: 'info', text: '  status              — current mission & connection' },
    { type: 'info', text: '  scan <ip>           — find open ports on a target' },
    { type: 'info', text: '  connect <ip> <port> — connect to a service' },
    { type: 'info', text: '  disconnect          — end current connection' },
    { type: 'info', text: '  crack               — brute-force SSH password' },
  ];
  if (showInject) lines.push({ type: 'info', text: '  inject              — SQL injection on web form' });
  lines.push(
    { type: 'info', text: '  ls                  — list files on connected server' },
    { type: 'info', text: '  cat <file>          — read a file' },
    { type: 'info', text: '  download <file>     — download a file' },
    { type: 'info', text: '  crypto              — crypto balance' },
    { type: 'info', text: '  clear               — clear terminal' },
  );
  await printLines(lines, 18);
}

async function cmdWhoami() {
  let session;
  try { session = JSON.parse(localStorage.getItem('pg_session')); } catch {}
  await printLines([
    { type: 'ok',   text: `User:       ${session?.username || 'ghost'}` },
    { type: 'info', text: `Crypto:     ${G.crypto}` },
    { type: 'info', text: `Heat:       ${G.notoriety}%` },
    { type: 'info', text: `Tools:      ${G.tools.join(', ')}` },
    { type: 'info', text: `Completed:  ${G.missionsDone.length} mission(s)` },
  ], 20);
}

async function cmdStatus() {
  const mission = getCurrentMission();
  const conn    = G.connected;
  await printLines([
    { type: 'sys',  text: mission ? `[ ACT ${mission.act} — ${mission.title.toUpperCase()} ]` : '[ NO ACTIVE MISSION ]' },
    { type: 'info', text: `Objective:  ${mission?.objective ?? '—'}` },
    { type: conn ? 'ok' : 'dim', text: `Connection: ${conn ? `${conn.ip}:${conn.port} (${conn.service})${conn.authed ? ' ✓' : ' — not authenticated'}` : 'Offline'}` },
    { type: G.trace > 60 ? 'warn' : 'info', text: `Trace:      ${Math.round(G.trace)}%` },
  ], 20);
}

async function cmdScan(ip) {
  if (!ip) { printLine('Usage: scan <ip>', 'out-err'); return; }
  const mission = getCurrentMission();
  if (!mission?.target) { printLine('[!] No target in scope.', 'out-err'); return; }
  if (ip !== mission.target.ip) {
    addTrace(10);
    printLine(`[!] ${ip}: Host unreachable or not in scope.`, 'out-err');
    return;
  }
  printLine(`[*] Scanning ${ip}...`, 'out-info');
  await printProgress('[*] Port scan', 1200);
  printLine(`[+] Host: ${mission.target.hostname} (${ip})`, 'out-ok');
  printEmpty();
  for (const [port, info] of Object.entries(mission.target.ports)) {
    await delay(80);
    printLine(`    ${String(port).padEnd(6)} [OPEN]  ${info.service.padEnd(6)}  ${info.banner}`, 'out-info');
  }
}

async function cmdConnect(ip, portStr) {
  if (!ip || !portStr) { printLine('Usage: connect <ip> <port>', 'out-err'); return; }
  const mission = getCurrentMission();
  if (!mission?.target) { printLine('[!] No target in scope.', 'out-err'); return; }
  if (ip !== mission.target.ip) { addTrace(5); printLine(`[!] ${ip}: Host unreachable.`, 'out-err'); return; }

  const port     = parseInt(portStr);
  const portInfo = mission.target.ports[port];
  if (!portInfo) { addTrace(5); printLine(`[!] Port ${port} is closed or filtered.`, 'out-err'); return; }

  if (G.connected) await cmdDisconnect(true);
  G.connected = { ip, port, service: portInfo.service, authed: false };
  updateHUD(); updateSidebar();

  printLine(`[+] Connected to ${ip}:${port} (${portInfo.service})`, 'out-ok');
  printLine(`    ${portInfo.banner}`, 'out-dim');
  if (portInfo.service === 'SSH')                                     printLine('[*] Authentication required — use "crack"', 'out-info');
  else if (portInfo.service === 'HTTP' || portInfo.service === 'HTTPS') printLine('[*] Web service — use "inject" to probe login form', 'out-info');
}

async function cmdDisconnect(silent = false) {
  if (!G.connected) { if (!silent) printLine('Not connected.', 'out-dim'); return; }
  const { ip, port } = G.connected;
  G.connected = null;
  G.trace = Math.max(0, G.trace - 8);
  updateHUD(); updateSidebar();
  if (!silent) printLine(`[*] Disconnected from ${ip}:${port}.`, 'out-dim');
}

async function cmdCrack() {
  if (!G.connected)                                             { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'SSH')                           { printLine('[!] crack only works on SSH services.', 'out-err'); return; }
  if (G.connected.authed)                                      { printLine('[*] Already authenticated.', 'out-dim'); return; }

  const mission  = getCurrentMission();
  const portInfo = mission?.target?.ports[G.connected.port];

  if (!portInfo?.crackable) { addTrace(15); printLine('[!] This service has hardened auth — tool insufficient.', 'out-err'); return; }
  if (portInfo.complexity === 'medium' && !G.tools.includes('wordlist_pro')) {
    addTrace(10); printLine('[!] Password complexity too high for Basic Cracker. Upgrade your tools.', 'out-err'); return;
  }

  printLine('[*] Initiating brute force on SSH service...', 'out-info');
  await printProgress('[*] Trying common passwords', 2000);
  G.connected.authed = true;
  addTrace(20);
  updateHUD(); updateSidebar();
  printLine(`[+] Password found: ${portInfo.password}`, 'out-ok');
  printLine('[+] Authentication successful. Shell access granted.', 'out-ok');
}

async function cmdInject() {
  if (!G.connected)                                                      { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS') { printLine('[!] inject only works on HTTP/HTTPS services.', 'out-err'); return; }
  if (G.connected.authed)                                                { printLine('[*] Already have database access.', 'out-dim'); return; }

  const mission  = getCurrentMission();
  const portInfo = mission?.target?.ports[G.connected.port];
  if (!portInfo?.injectable) { addTrace(10); printLine('[!] No injectable endpoint detected on this service.', 'out-err'); return; }

  printLine("[*] Probing login form for SQL injection...", 'out-info');
  await delay(500);
  printLine("[*] Payload: ' OR '1'='1' --", 'out-dim');
  await printProgress('[*] Injecting', 1800);
  G.connected.authed = true;
  addTrace(25);
  updateHUD(); updateSidebar();
  printLine("[+] Vulnerability confirmed. Bypassing authentication...", 'out-ok');
  printLine("[+] Database shell acquired.", 'out-ok');
}

async function cmdLs() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated. Connect and authenticate first.', 'out-err'); return; }
  const files = getCurrentMission()?.target?.files;
  if (!files || Object.keys(files).length === 0) { printLine('No files.', 'out-dim'); return; }
  printLine('[*] Directory listing:', 'out-info');
  for (const [name, content] of Object.entries(files)) {
    await delay(40);
    printLine(`    ${name.padEnd(32)} ${(content.length * 1.1).toFixed(0)} bytes`, 'out-info');
  }
}

async function cmdCat(filename) {
  if (!filename) { printLine('Usage: cat <file>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const content = getCurrentMission()?.target?.files?.[filename];
  if (content === undefined) { addTrace(2); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  printLine(`[*] ${filename}:`, 'out-dim');
  printEmpty();
  for (const line of content.split('\n')) { await delay(18); printLine(`    ${line}`, 'out-info'); }
}

async function cmdDownload(filename) {
  if (!filename) { printLine('Usage: download <file>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const content = getCurrentMission()?.target?.files?.[filename];
  if (content === undefined) { addTrace(3); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  printLine(`[*] Downloading ${filename}...`, 'out-info');
  await printProgress('[*] Transfer', 800);
  if (!G.downloadedFiles.includes(filename)) G.downloadedFiles.push(filename);
  addTrace(5);
  printLine(`[+] Downloaded: ${filename}`, 'out-ok');
}

// ── Mission completion ────────────────────────────────────────

function checkMissionComplete() {
  const mission = getCurrentMission();
  if (mission?.check(G)) completeMission(mission);
}

async function completeMission(mission) {
  setBusy(true);
  await delay(600);

  G.crypto += mission.reward.crypto;
  for (const tool of (mission.unlocks || [])) {
    if (!G.tools.includes(tool)) G.tools.push(tool);
  }
  G.missionsDone.push(mission.id);
  G.missionIdx++;
  saveState();

  document.getElementById('mc-mission-name').textContent = mission.title;
  document.getElementById('mc-reward').textContent = mission.reward.crypto > 0 ? `+${mission.reward.crypto} CRYPTO` : '';
  if (mission.unlocks.length) {
    document.getElementById('mc-reward').textContent += (mission.reward.crypto > 0 ? '  |  ' : '') + `Unlocked: ${mission.unlocks.map(t => TOOLS[t]?.name ?? t).join(', ')}`;
  }
  document.getElementById('mission-complete').hidden = false;

  document.getElementById('mc-next-btn').onclick = () => {
    document.getElementById('mission-complete').hidden = true;
    G.connected = null; G.trace = 0; G.downloadedFiles = [];
    updateHUD(); updateSidebar(); clearOutput();
    startMission();
    setBusy(false);
  };
}

// ── Trace ─────────────────────────────────────────────────────

function addTrace(amount) {
  G.trace = Math.min(100, G.trace + amount);
  updateHUD();
  if (G.trace >= 100) triggerTraceBurn();
}

async function triggerTraceBurn() {
  setBusy(true);
  await printLines([
    { type: 'err', text: '' },
    { type: 'err', text: '[!!!] TRACE COMPLETE — CONNECTION TERMINATED' },
    { type: 'err', text: '[!!!] Security team alerted. Pulling out...' },
  ], 100);
  G.connected = null; G.trace = 0;
  G.notoriety = Math.min(100, G.notoriety + 5);
  G.downloadedFiles = [];
  saveState(); updateHUD(); updateSidebar();
  await delay(1000);
  printLine('[*] Connection dropped. Retry your approach.', 'out-warn');
  setBusy(false);
}

// ── HUD & Sidebar ─────────────────────────────────────────────

function updateHUD() {
  const mission = getCurrentMission();
  document.getElementById('hud-mission').textContent = mission ? `[${mission.title}]` : '';

  const tf = document.getElementById('trace-fill');
  tf.style.width  = G.trace + '%';
  tf.className    = `meter-fill trace${G.trace >= 70 ? ' high' : ''}`;
  document.getElementById('trace-pct').textContent = Math.round(G.trace) + '%';

  document.getElementById('notoriety-fill').style.width = G.notoriety + '%';
  document.getElementById('notoriety-pct').textContent  = G.notoriety + '%';
}

function updateSidebar() {
  const mission = getCurrentMission();
  const conn    = G.connected;
  document.getElementById('sb-mission-title').textContent = mission?.title ?? '—';
  document.getElementById('sb-objective').textContent     = mission?.objective ?? '—';
  document.getElementById('sb-crypto').textContent        = G.crypto;
  document.getElementById('sb-notoriety').textContent     = G.notoriety;
  document.getElementById('sb-connection').textContent    =
    conn ? `${conn.ip}:${conn.port} (${conn.authed ? '✓ authed' : 'no auth'})` : 'Offline';
  document.getElementById('sb-tools').innerHTML =
    G.tools.map(t => `<span class="tool-chip">${TOOLS[t]?.name ?? t}</span>`).join('');
}

init();
