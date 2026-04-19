const G = {
  missionIdx:      0,
  missionsDone:    [],
  tools:           ['basic_cracker'],
  crypto:          0,
  notoriety:       0,
  freeMode:        false,

  // Session-only (not saved)
  connected:       null,
  trace:           0,
  downloadedFiles: [],
  currentQuest:    null,
};

async function init() {
  let session;
  try { session = JSON.parse(localStorage.getItem('pg_session')); } catch {}
  if (!session?.userId) { window.location.href = '../'; return; }

  const username = session.username || 'ghost';
  document.getElementById('hud-user').textContent = username;
  document.getElementById('prompt').textContent   = `${username}@terminal:~$`;

  const saved = await loadCloud();
  if (saved) applyPayload(saved);

  updateHUD();
  updateSidebar();

  if (!localStorage.getItem('hacker_intro_seen')) {
    showIntro(username);
  } else {
    document.getElementById('intro-overlay').hidden = true;
    startMission(true);
  }
}

function applyPayload(saved) {
  G.missionIdx      = saved.missionIdx      ?? 0;
  G.missionsDone    = saved.missionsDone    ?? [];
  G.tools           = saved.tools           ?? ['basic_cracker'];
  G.crypto          = saved.crypto          ?? 0;
  G.notoriety       = saved.notoriety       ?? 0;
  G.freeMode        = saved.freeMode        ?? (G.missionIdx >= MISSIONS.length);
  G.trace           = saved.trace           ?? 0;
  G.downloadedFiles = saved.downloadedFiles ?? [];
  if (saved.savedQuest) G.currentQuest = restoreQuest(saved.savedQuest);
}

function restoreQuest(data) {
  const file = data._file;
  return { ...data, check(G) { return G.downloadedFiles.includes(file); } };
}

async function saveState() {
  const savedQuest = G.currentQuest ? {
    id:        G.currentQuest.id,
    type:      G.currentQuest.type,
    company:   G.currentQuest.company,
    hostname:  G.currentQuest.hostname,
    title:     G.currentQuest.title,
    objective: G.currentQuest.objective,
    _file:     G.currentQuest._file,
    reward:    G.currentQuest.reward,
    target:    G.currentQuest.target,
    briefing:  G.currentQuest.briefing,
  } : null;
  await saveCloud({
    missionIdx:       G.missionIdx,
    missionsDone:     G.missionsDone,
    tools:            G.tools,
    crypto:           G.crypto,
    notoriety:        G.notoriety,
    freeMode:         G.freeMode,
    trace:            G.trace,
    downloadedFiles:  G.downloadedFiles,
    savedQuest,
  });
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

// ── Mission / Free mode ───────────────────────────────────────

function getCurrentMission() {
  if (G.freeMode) return G.currentQuest;
  return MISSIONS[G.missionIdx] ?? null;
}

async function startMission(isResume = false) {
  G.connected = null;
  if (!isResume) { G.trace = 0; G.downloadedFiles = []; }
  updateHUD(); updateSidebar();

  if (G.freeMode || G.missionIdx >= MISSIONS.length) {
    if (isResume && G.freeMode) {
      await resumeFreeMode();
    } else {
      await enterFreeMode();
    }
    return;
  }

  if (isResume && G.downloadedFiles.length > 0) {
    await printLines([
      { type: 'sys',  text: '[ SESSION RESTORED ]' },
      { type: 'info', text: `Mission:  ${MISSIONS[G.missionIdx].title}` },
      { type: 'info', text: `Progress: ${G.downloadedFiles.length} file(s) downloaded` },
      { type: 'dim',  text: 'Type "status" for mission details.' },
    ], 40);
  } else {
    await printLines(MISSIONS[G.missionIdx].briefing, 60);
  }
  printEmpty();
}

async function enterFreeMode() {
  G.freeMode = true;
  G.currentQuest = null;
  await saveState(); updateHUD(); updateSidebar();

  await printLines([
    { type: 'sys',  text: '[ STORY MODE COMPLETE ]' },
    { type: 'info', text: '' },
    { type: 'info', text: 'You\'ve finished all available story chapters.' },
    { type: 'info', text: 'More chapters will drop — use "story" to check for updates.' },
    { type: 'info', text: '' },
    { type: 'info', text: 'In the meantime: anonymous contracts are available.' },
    { type: 'dim',  text: 'Type "quest" to receive your first contract.' },
  ], 55);
  printEmpty();
}

async function resumeFreeMode() {
  updateHUD(); updateSidebar();
  if (G.currentQuest) {
    await printLines([
      { type: 'sys',  text: '[ SESSION RESTORED ]' },
      { type: 'info', text: `Contract: ${G.currentQuest.title}` },
      { type: 'info', text: `Target:   ${G.currentQuest.target.ip}` },
      { type: 'info', text: `Objective: ${G.currentQuest.objective}` },
      { type: 'dim',  text: 'Type "status" for details or "quest" to see contract.' },
    ], 40);
  } else {
    await printLines([
      { type: 'sys',  text: '[ SESSION RESTORED — FREE MODE ]' },
      { type: 'dim',  text: 'Type "quest" to get a contract.' },
    ], 40);
  }
  printEmpty();
}

async function generateNewQuest() {
  G.currentQuest    = generateQuest(G.tools);
  G.connected       = null;
  G.trace           = 0;
  G.downloadedFiles = [];
  await saveState();
  updateHUD(); updateSidebar();
  await printLines(G.currentQuest.briefing, 50);
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
      case 'quest':
      case 'contracts':  await cmdQuest();                   break;
      case 'story':      await cmdStory();                   break;
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
  const showInject = G.tools.includes('sqli_kit') || (!G.freeMode && getCurrentMission()?.id === 'a1m2');
  const lines = [
    { type: 'sys',  text: '[ AVAILABLE COMMANDS ]' },
    { type: 'info', text: '  help                — this message' },
    { type: 'info', text: '  whoami              — your profile' },
    { type: 'info', text: '  status              — current mission / contract' },
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
  if (G.freeMode) {
    lines.push(
      { type: 'sys',  text: '' },
      { type: 'sys',  text: '[ FREE MODE ]' },
      { type: 'info', text: '  quest               — get / show current contract' },
      { type: 'info', text: '  story               — check for new story chapters' },
    );
  }
  await printLines(lines, 18);
}

async function cmdWhoami() {
  let session;
  try { session = JSON.parse(localStorage.getItem('pg_session')); } catch {}
  await printLines([
    { type: 'ok',   text: `User:       ${session?.username || 'ghost'}` },
    { type: 'info', text: `Mode:       ${G.freeMode ? 'Free Mode' : `Story — Act ${MISSIONS[G.missionIdx]?.act ?? '?'}`}` },
    { type: 'info', text: `Crypto:     ${G.crypto}` },
    { type: 'info', text: `Heat:       ${G.notoriety}%` },
    { type: 'info', text: `Tools:      ${G.tools.join(', ')}` },
    { type: 'info', text: `Story:      ${G.missionsDone.length} / ${MISSIONS.length} chapters` },
  ], 20);
}

async function cmdStatus() {
  const mission = getCurrentMission();
  const conn    = G.connected;
  const lines   = [];

  if (G.freeMode) {
    if (mission) {
      lines.push(
        { type: 'sys',  text: '[ ACTIVE CONTRACT ]' },
        { type: 'info', text: `Target:     ${mission.company}  (${mission.target.ip})` },
        { type: 'info', text: `Objective:  ${mission.objective}` },
        { type: 'info', text: `Payout:     ${mission.reward.crypto} CRYPTO` },
      );
    } else {
      lines.push(
        { type: 'sys',  text: '[ FREE MODE — NO ACTIVE CONTRACT ]' },
        { type: 'dim',  text: 'Type "quest" to get a contract.' },
      );
    }
  } else {
    lines.push(
      { type: 'sys',  text: mission ? `[ ACT ${mission.act} — ${mission.title.toUpperCase()} ]` : '[ NO ACTIVE MISSION ]' },
      { type: 'info', text: `Objective:  ${mission?.objective ?? '—'}` },
    );
  }

  lines.push(
    { type: conn ? 'ok' : 'dim', text: `Connection: ${conn ? `${conn.ip}:${conn.port} (${conn.service})${conn.authed ? ' ✓' : ' — not authenticated'}` : 'Offline'}` },
    { type: G.trace > 60 ? 'warn' : 'info', text: `Trace:      ${Math.round(G.trace)}%` },
  );
  await printLines(lines, 20);
}

async function cmdQuest() {
  if (!G.freeMode) { printLine('[!] Contracts are only available in Free Mode.', 'out-err'); return; }

  // Active quest not yet completed — show it
  if (G.currentQuest && !G.downloadedFiles.includes(G.currentQuest._file)) {
    await printLines([
      { type: 'sys',  text: '[ ACTIVE CONTRACT ]' },
      { type: 'info', text: `Target:    ${G.currentQuest.company}` },
      { type: 'warn', text: `IP:        ${G.currentQuest.target.ip}` },
      { type: 'info', text: `Objective: ${G.currentQuest.objective}` },
      { type: 'info', text: `Payout:    ${G.currentQuest.reward.crypto} CRYPTO` },
    ], 20);
    return;
  }

  printLine('[*] Fetching new contract...', 'out-dim');
  await delay(700);
  await generateNewQuest();
}

async function cmdStory() {
  if (!G.freeMode) { printLine('[*] You are already in story mode.', 'out-dim'); return; }

  if (G.missionIdx < MISSIONS.length) {
    // New chapters are available
    printLine('[+] New story chapter detected! Switching to story mode...', 'out-ok');
    await delay(600);
    G.freeMode = false;
    G.currentQuest = null;
    clearOutput();
    await startMission();
  } else {
    await printLines([
      { type: 'sys',  text: '[ STORY STATUS ]' },
      { type: 'info', text: `Chapters completed: ${G.missionsDone.length} / ${MISSIONS.length}` },
      { type: 'dim',  text: 'No new chapters yet. Check back soon.' },
    ], 20);
  }
}

// ── Target resolution (story mission or free quest) ───────────

function getActiveTarget() {
  return getCurrentMission()?.target ?? null;
}

async function cmdScan(ip) {
  if (!ip) { printLine('Usage: scan <ip>', 'out-err'); return; }
  const target = getActiveTarget();
  if (!target) { printLine('[!] No target in scope. ' + (G.freeMode ? 'Type "quest" to get a contract.' : ''), 'out-err'); return; }
  if (ip !== target.ip) { addTrace(10); printLine(`[!] ${ip}: Host unreachable or not in scope.`, 'out-err'); return; }

  const hasPro = G.tools.includes('port_scanner_pro');
  printLine(`[*] Scanning ${ip}${hasPro ? ' (deep scan)' : ''}...`, 'out-info');
  await printProgress('[*] Port scan', hasPro ? 900 : 1200);
  printLine(`[+] Host: ${target.hostname} (${ip})`, 'out-ok');
  printEmpty();
  for (const [port, info] of Object.entries(target.ports)) {
    if (info.hidden && !hasPro) continue;
    await delay(80);
    const tag = info.hidden ? '[STEALTH]' : '[OPEN]   ';
    printLine(`    ${String(port).padEnd(6)} ${tag}  ${info.service.padEnd(6)}  ${info.banner}`, 'out-info');
  }
  if (!hasPro && Object.values(target.ports).some(p => p.hidden)) {
    printLine('    [*] Some stealth ports may be hidden — use port_scanner_pro.', 'out-dim');
  }
}

async function cmdConnect(ip, portStr) {
  if (!ip || !portStr) { printLine('Usage: connect <ip> <port>', 'out-err'); return; }
  const target = getActiveTarget();
  if (!target) { printLine('[!] No target in scope.', 'out-err'); return; }
  if (ip !== target.ip) { addTrace(5); printLine(`[!] ${ip}: Host unreachable.`, 'out-err'); return; }

  const port     = parseInt(portStr);
  const portInfo = target.ports[port];
  if (!portInfo) { addTrace(5); printLine(`[!] Port ${port} is closed or filtered.`, 'out-err'); return; }

  if (G.connected) await cmdDisconnect(true);
  G.connected = { ip, port, service: portInfo.service, authed: false };
  updateHUD(); updateSidebar();

  printLine(`[+] Connected to ${ip}:${port} (${portInfo.service})`, 'out-ok');
  printLine(`    ${portInfo.banner}`, 'out-dim');
  if (portInfo.service === 'SSH')                                       printLine('[*] Authentication required — use "crack"', 'out-info');
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
  if (!G.connected)                        { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'SSH')       { printLine('[!] crack only works on SSH services.', 'out-err'); return; }
  if (G.connected.authed)                  { printLine('[*] Already authenticated.', 'out-dim'); return; }

  const portInfo = getActiveTarget()?.ports[G.connected.port];
  if (!portInfo?.crackable) { addTrace(15); printLine('[!] This service has hardened auth — tool insufficient.', 'out-err'); return; }
  if (portInfo.complexity === 'medium' && !G.tools.includes('wordlist_pro')) {
    addTrace(10); printLine('[!] Password complexity too high for Basic Cracker. Need Wordlist Pro.', 'out-err'); return;
  }
  if (portInfo.complexity === 'high' && !G.tools.includes('bruteforce_v2')) {
    addTrace(12); printLine('[!] Password complexity too high. Bruteforce v2 required.', 'out-err'); return;
  }

  const duration = portInfo.complexity === 'high' ? 3500 : portInfo.complexity === 'medium' ? 2800 : 2000;
  const label    = portInfo.complexity === 'high' ? '[*] GPU brute force' : '[*] Trying common passwords';
  printLine('[*] Initiating brute force on SSH service...', 'out-info');
  await printProgress(label, duration);
  G.connected.authed = true;
  addTrace(portInfo.complexity === 'high' ? 30 : 20);
  updateHUD(); updateSidebar();
  printLine(`[+] Password found: ${portInfo.password}`, 'out-ok');
  printLine('[+] Authentication successful. Shell access granted.', 'out-ok');
}

async function cmdInject() {
  if (!G.connected)                                                        { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS')  { printLine('[!] inject only works on HTTP/HTTPS services.', 'out-err'); return; }
  if (G.connected.authed)                                                  { printLine('[*] Already have database access.', 'out-dim'); return; }

  const portInfo = getActiveTarget()?.ports[G.connected.port];
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
  const files = getActiveTarget()?.files;
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
  const content = getActiveTarget()?.files?.[filename];
  if (content === undefined) { addTrace(2); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  printLine(`[*] ${filename}:`, 'out-dim');
  printEmpty();
  for (const line of content.split('\n')) { await delay(18); printLine(`    ${line}`, 'out-info'); }
}

async function cmdDownload(filename) {
  if (!filename) { printLine('Usage: download <file>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const content = getActiveTarget()?.files?.[filename];
  if (content === undefined) { addTrace(3); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  printLine(`[*] Downloading ${filename}...`, 'out-info');
  await printProgress('[*] Transfer', 800);
  if (!G.downloadedFiles.includes(filename)) G.downloadedFiles.push(filename);
  addTrace(5);
  await saveState();
  printLine(`[+] Downloaded: ${filename}`, 'out-ok');
}

// ── Completion ────────────────────────────────────────────────

function checkMissionComplete() {
  const mission = getCurrentMission();
  if (!mission) return;
  if (G.freeMode) {
    if (G.currentQuest?.check(G)) completeQuest(G.currentQuest);
  } else {
    if (mission.check(G)) completeMission(mission);
  }
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
  await saveState();

  document.getElementById('mc-mission-name').textContent = mission.title;
  let rewardText = mission.reward.crypto > 0 ? `+${mission.reward.crypto} CRYPTO` : '';
  if (mission.unlocks.length) rewardText += (rewardText ? '  |  ' : '') + `Unlocked: ${mission.unlocks.map(t => TOOLS[t]?.name ?? t).join(', ')}`;
  document.getElementById('mc-reward').textContent = rewardText;
  document.getElementById('mission-complete').hidden = false;

  document.getElementById('mc-next-btn').onclick = () => {
    document.getElementById('mission-complete').hidden = true;
    G.connected = null; G.trace = 0; G.downloadedFiles = [];
    updateHUD(); updateSidebar(); clearOutput();
    startMission();
    setBusy(false);
  };
}

async function completeQuest(quest) {
  setBusy(true);
  G.crypto += quest.reward.crypto;
  G.currentQuest = null;
  await saveState();
  await delay(400);
  await printLines([
    { type: 'ok',  text: '' },
    { type: 'ok',  text: `[+] CONTRACT COMPLETE — ${quest.title}` },
    { type: 'ok',  text: `[+] Payout deposited: +${quest.reward.crypto} CRYPTO` },
    { type: 'dim', text: 'Type "quest" for a new contract.' },
  ], 60);
  updateHUD(); updateSidebar();
  setBusy(false);
}

// ── Trace ─────────────────────────────────────────────────────

function addTrace(amount) {
  const effective = G.tools.includes('proxy_basic') ? Math.round(amount * 0.65) : amount;
  G.trace = Math.min(100, G.trace + effective);
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
  await saveState(); updateHUD(); updateSidebar();
  await delay(1000);
  printLine('[*] Connection dropped. Retry your approach.', 'out-warn');
  if (G.freeMode) printLine('[*] Type "quest" to see your current contract.', 'out-dim');
  setBusy(false);
}

// ── HUD & Sidebar ─────────────────────────────────────────────

function updateHUD() {
  const levelEl = document.getElementById('hdr-level');
  if (G.freeMode) {
    levelEl.textContent = 'Free Mode';
  } else {
    const m = MISSIONS[G.missionIdx];
    levelEl.textContent = m
      ? `Act ${m.act} · Mission ${G.missionIdx + 1} / ${MISSIONS.length}`
      : 'Free Mode';
  }

  const tf = document.getElementById('trace-fill');
  tf.style.width  = G.trace + '%';
  tf.className    = `meter-fill trace${G.trace >= 70 ? ' high' : ''}`;
  document.getElementById('trace-pct').textContent = Math.round(G.trace) + '%';

  document.getElementById('notoriety-fill').style.width = G.notoriety + '%';
  document.getElementById('notoriety-pct').textContent  = G.notoriety + '%';
}

function updateSidebar() {
  const quest   = G.freeMode ? G.currentQuest : null;
  const mission = G.freeMode ? null : MISSIONS[G.missionIdx];
  const conn    = G.connected;

  document.getElementById('sb-mission-title').textContent =
    G.freeMode
      ? (quest ? quest.title : 'Free Mode')
      : (mission?.title ?? '—');

  document.getElementById('sb-objective').textContent =
    G.freeMode
      ? (quest ? quest.objective : 'Type "quest" to start')
      : (mission?.objective ?? '—');

  document.getElementById('sb-crypto').textContent     = G.crypto;
  document.getElementById('sb-notoriety').textContent  = G.notoriety;
  document.getElementById('sb-connection').textContent =
    conn ? `${conn.ip}:${conn.port} (${conn.authed ? '✓ authed' : 'no auth'})` : 'Offline';
  document.getElementById('sb-tools').innerHTML =
    G.tools.map(t => `<span class="tool-chip">${TOOLS[t]?.name ?? t}</span>`).join('');
}

init();
