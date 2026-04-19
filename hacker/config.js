const TOOLS = {
  basic_cracker:    { name: 'Basic Cracker',    desc: 'Dictionary attack on SSH. Works on low-complexity passwords.' },
  wordlist_pro:     { name: 'Wordlist Pro',      desc: 'Extended dictionary. Cracks medium-complexity passwords.' },
  sqli_kit:         { name: 'SQLi Kit',          desc: 'Automated SQL injection toolkit for web login forms.' },
  proxy_basic:      { name: 'Basic Proxy',       desc: 'Passively routes traffic through a hop — reduces all trace by 35%.' },
  port_scanner_pro: { name: 'Port Scanner Pro',  desc: 'Deep scan reveals stealth ports and service fingerprints.' },
  bruteforce_v2:    { name: 'Bruteforce v2',     desc: 'GPU-accelerated cracker. Handles high-complexity passwords.' },
};

const MISSIONS = [
  {
    id: 'a1m1',
    act: 1,
    title: 'First Contact',
    objective: 'Download credentials.txt from 10.0.0.12',
    briefing: [
      { type: 'sys',  text: '[ ENCRYPTED MESSAGE — 03:47:22 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'They know what your mentor found.' },
      { type: 'info', text: 'The evidence is buried in Veridian Corp\'s network.' },
      { type: 'info', text: 'Start small — they have an exposed internal server.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 10.0.0.12' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Get in. Find the credentials file. Get out.' },
      { type: 'dim',  text: 'Type "help" to see available commands.' },
    ],
    target: {
      ip:       '10.0.0.12',
      hostname: 'veridian-srv-01',
      ports: {
        22:  { service: 'SSH',   banner: 'OpenSSH 7.4 — Veridian Internal', crackable: true,  password: 'password123', complexity: 'low' },
        80:  { service: 'HTTP',  banner: 'Apache/2.4.6 — Veridian Portal',  crackable: false },
        443: { service: 'HTTPS', banner: 'SSL/TLS',                         crackable: false },
      },
      files: {
        'readme.txt':      'Server maintenance log\nLast updated: 2026-04-01\nAdmin: sysadmin@veridian.corp',
        'credentials.txt': 'admin:hunter2\nbackup_user:letmein\ndb_reader:Veridian2024!',
        'server.log':      '[INFO] System boot OK\n[INFO] SSH daemon started\n[WARN] Failed login from 10.0.0.89\n[INFO] User "admin" logged in from 10.0.0.1',
      },
    },
    reward:  { crypto: 50 },
    unlocks: [],
    check(G) { return G.downloadedFiles.includes('credentials.txt'); },
  },

  {
    id: 'a1m2',
    act: 1,
    title: 'The Leak',
    objective: 'Extract user_records.csv from the employee portal',
    briefing: [
      { type: 'sys',  text: '[ MISSION BRIEF — 04:12:07 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The credentials pointed somewhere.' },
      { type: 'info', text: 'There\'s a web server on the internal network.' },
      { type: 'info', text: 'Their login form doesn\'t sanitize input.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 10.0.0.45' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Connect to port 80, then run "inject" to exploit the form.' },
      { type: 'dim',  text: 'New command available: inject' },
    ],
    target: {
      ip:       '10.0.0.45',
      hostname: 'veridian-web-02',
      ports: {
        80:  { service: 'HTTP',  banner: 'Apache/2.4.6 — Veridian Employee Portal', crackable: false, injectable: true },
        443: { service: 'HTTPS', banner: 'SSL/TLS — Redirect to :80',               crackable: false },
        22:  { service: 'SSH',   banner: 'OpenSSH 8.1 — Hardened',                  crackable: false },
      },
      files: {
        'user_records.csv':  'id,name,email,dept\n1,Marcus Webb,m.webb@veridian.corp,Engineering\n2,Diana Cross,d.cross@veridian.corp,Executive\n3,Yusuf Karim,y.karim@veridian.corp,Security',
        'internal_memo.txt': '[CONFIDENTIAL]\nAll staff: the Q2 audit has been moved forward.\nDo not discuss Project Helios externally.\n— D. Cross, CEO',
      },
    },
    reward:  { crypto: 120 },
    unlocks: ['sqli_kit', 'wordlist_pro'],
    check(G) { return G.downloadedFiles.includes('user_records.csv'); },
  },

  {
    id: 'a1m3',
    act: 1,
    title: 'The Architect',
    objective: 'Download project_helios.enc from the executive workstation',
    briefing: [
      { type: 'sys',  text: '[ MISSION BRIEF — 05:38:44 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The user records named her: Diana Cross, CEO.' },
      { type: 'info', text: 'Internal memo confirmed it — Project Helios is hers.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Her executive workstation sits on the internal network.' },
      { type: 'info', text: 'She uses a stronger password. Your new wordlist can handle it.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 10.0.0.91' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Get in. Download project_helios.enc. Don\'t leave tracks.' },
      { type: 'dim',  text: 'Hint: scan → connect 22 → crack → ls → download' },
    ],
    target: {
      ip:       '10.0.0.91',
      hostname: 'veridian-exec-ceo',
      ports: {
        22:  { service: 'SSH',   banner: 'OpenSSH 8.4 — Executive Access', crackable: true, password: 'Helios@2026!', complexity: 'medium' },
        443: { service: 'HTTPS', banner: 'SSL/TLS — Executive Portal',     crackable: false },
      },
      files: {
        'project_helios.enc': '[ENCRYPTED BINARY — AES-256]\nHeader: HELIOS_PAYLOAD_v3\nSize: 4.2 MB\nKey required.',
        'personal_notes.txt': 'Remind legal: NDA extensions for Helios staff.\nCall Senator Voss re: regulatory window.\nDestroy lab records before Q3 audit.',
        '.bash_history':      'ssh admin@172.20.0.2\nscp helios_key.bin d.cross@10.0.0.91:~\nrm -rf /tmp/staging',
      },
    },
    reward:  { crypto: 200 },
    unlocks: ['proxy_basic'],
    check(G) { return G.downloadedFiles.includes('project_helios.enc'); },
  },

  {
    id: 'a2m1',
    act: 2,
    title: 'The Broker',
    objective: 'Download helios_key.bin from the offshore drop server',
    briefing: [
      { type: 'sys',  text: '[ ENCRYPTED MESSAGE — 11:02:17 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'You have a file. Encrypted.' },
      { type: 'info', text: 'Someone wants to keep it that way.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The bash history pointed to an offshore relay.' },
      { type: 'info', text: 'A broker — no name, no face — pushed the key there.' },
      { type: 'info', text: 'Their login form is vulnerable. Use it.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 185.220.101.47' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Route: scan → connect 80 → inject → ls → download' },
      { type: 'dim',  text: 'Note: your proxy is active. Trace will be slower.' },
    ],
    target: {
      ip:       '185.220.101.47',
      hostname: 'broker-drop-01',
      ports: {
        80:  { service: 'HTTP',  banner: 'nginx/1.20.1 — Private File Drop', crackable: false, injectable: true },
        22:  { service: 'SSH',   banner: 'OpenSSH 9.0 — Key Auth Only',      crackable: false },
        8080:{ service: 'HTTP',  banner: 'Admin panel (restricted)',          crackable: false },
      },
      files: {
        'helios_key.bin':  '[AES KEY MATERIAL]\n0x4865 6c69 6f73 5f4b 4579 5f32 3032 3600\nAuthorised use: D.Cross / Senator Voss only.',
        'drop_manifest.txt': 'Delivery log:\n2026-03-12  helios_key.bin  → veridian-exec-ceo\n2026-03-30  blacksite_access.txt  → pending\nClient: VOSS_OFFICE',
      },
    },
    reward:  { crypto: 320 },
    unlocks: ['port_scanner_pro'],
    check(G) { return G.downloadedFiles.includes('helios_key.bin'); },
  },

  {
    id: 'a2m2',
    act: 2,
    title: 'Black Ice',
    objective: 'Download blacksite_manifest.txt from the government relay',
    briefing: [
      { type: 'sys',  text: '[ WARNING — 02:14:05 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The drop manifest named a second delivery.' },
      { type: 'info', text: '"VOSS_OFFICE" — Senator Voss. This goes higher than Veridian.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'A government relay sits behind the senator\'s network.' },
      { type: 'info', text: 'Hardened. Non-standard ports. Rotate your scanner.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 10.77.0.5' },
      { type: 'warn', text: 'WARNING: This host has active intrusion detection.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Use port_scanner_pro to find the hidden SSH port.' },
      { type: 'dim',  text: 'You\'ll need Bruteforce v2 — this password won\'t fall easily.' },
    ],
    target: {
      ip:       '10.77.0.5',
      hostname: 'voss-relay-alpha',
      ports: {
        2222: { service: 'SSH',   banner: 'OpenSSH 9.3 — Hardened Gov Relay', crackable: true, password: 'V0ss#Bl4ckS1te_26', complexity: 'high', hidden: true },
        443:  { service: 'HTTPS', banner: 'SSL/TLS — Classified',             crackable: false },
        8443: { service: 'HTTPS', banner: 'SSL/TLS — Admin (cert required)',  crackable: false },
      },
      files: {
        'blacksite_manifest.txt': '[CLASSIFIED — EYES ONLY]\nProject Helios — Phase 3\nAuthorised: Senator R. Voss, D. Cross (Veridian)\nObjective: civilian data pipeline for pre-crime profiling\nStatus: ACTIVE\nCover: corporate wellness programme\nWitnesses: [REDACTED x7]',
        'access_log.txt':         '2026-04-01 AUTH OK   voss_admin from 10.77.0.1\n2026-04-02 AUTH FAIL unknown from 185.220.101.47\n2026-04-10 AUTH OK   voss_admin from 10.77.0.1',
      },
    },
    reward:  { crypto: 500 },
    unlocks: ['bruteforce_v2'],
    check(G) { return G.downloadedFiles.includes('blacksite_manifest.txt'); },
  },
];

// ── Free mode quest generation ────────────────────────────────

const _COMPANIES = [
  'NexusCorp',   'Axiom Data',    'Helix Systems',  'Vortex Technologies',
  'Apex Finance','Cipher Labs',   'Meridian Group', 'Solaris Bank',
  'Kronos Logistics','Titan Networks','Pulsar Media','Orbit Analytics',
  'Stratum Ltd', 'Cobalt Systems','Zenith Corp',    'Paragon Data',
];
const _SUFFIXES  = ['srv-01','db-prod','files-02','backup-01','web-03','intranet','store-02'];
const _IP_PFXS   = ['172.16.0.','10.10.0.','192.168.10.','10.20.0.','172.31.0.'];
const _FILES     = [
  'employee_records.csv','salary_data.csv','api_keys.txt',
  'client_list.csv',     'financial_q3.csv','contracts.txt',
  'user_database.sql',   'access_tokens.json','audit_log.txt',
  'config_backup.conf',  'internal_report.txt','password_backup.txt',
];
const _PASSWORDS = [
  'admin123','letmein','company2024','qwerty1','password1',
  'welcome1','summer2025','test1234','login123','corp2024',
];
const _SSH_BANNERS  = ['OpenSSH 7.9','OpenSSH 8.2','OpenSSH 7.4','Dropbear SSH 2020'];
const _HTTP_BANNERS = ['Apache/2.4.41','nginx/1.18.0','Apache/2.4.6','nginx/1.20.1'];

function _rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _rndInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }

function _fileContent(name, company) {
  const slug = company.toLowerCase().replace(/\s+/g, '');
  if (name.endsWith('.csv'))  return `id,name,email\n1,J. Chen,j.chen@${slug}.corp\n2,M. Osei,m.osei@${slug}.corp\n3,A. Patel,a.patel@${slug}.corp`;
  if (name.endsWith('.json')) return `{"api_key":"sk-${Math.random().toString(36).slice(2,14)}","env":"production","org":"${company}"}`;
  if (name.endsWith('.sql'))  return `-- ${company} user dump\nINSERT INTO users VALUES (1,'admin','$2b$10$hashed...');\nINSERT INTO users VALUES (2,'guest','$2b$10$hashed...');`;
  if (name.endsWith('.conf')) return `[server]\nhost=db.${slug}.internal\nport=5432\npassword=REDACTED\nssl=true`;
  return `[${company} CONFIDENTIAL]\nDate: ${new Date().toISOString().slice(0,10)}\nInternal use only.`;
}

function generateQuest(tools) {
  const types = ['ssh_exfil'];
  if (tools.includes('sqli_kit')) types.push('web_inject');

  const type    = _rnd(types);
  const company = _rnd(_COMPANIES);
  const slug    = company.toLowerCase().replace(/\s+/g, '-');
  const ip      = `${_rnd(_IP_PFXS)}${_rndInt(10, 240)}`;
  const hostname = `${slug}-${_rnd(_SUFFIXES)}`;
  const file    = _rnd(_FILES);
  const reward  = type === 'web_inject' ? _rndInt(130, 280) : _rndInt(60, 160);
  const diff    = reward >= 200 ? 'HIGH' : reward >= 120 ? 'MED' : 'LOW';

  const shared = {
    id: 'fq_' + Date.now(),
    type, company, hostname,
    title: `Contract: ${company}`,
    objective: `Exfiltrate ${file} from ${ip}`,
    reward: { crypto: reward },
    _file: file,
    check(G) { return G.downloadedFiles.includes(file); },
  };

  if (type === 'ssh_exfil') {
    const pw = _rnd(_PASSWORDS);
    return {
      ...shared,
      briefing: [
        { type: 'sys',  text: '[ INCOMING CONTRACT ]' },
        { type: 'info', text: '' },
        { type: 'info', text: `Target:     ${company}` },
        { type: 'warn', text: `IP:         ${ip}` },
        { type: 'info', text: `Objective:  Download ${file}` },
        { type: 'info', text: `Payout:     ${reward} CRYPTO  [${diff}]` },
        { type: 'info', text: '' },
        { type: 'dim',  text: 'Route: scan → connect 22 → crack → ls → download' },
      ],
      target: {
        ip, hostname,
        ports: {
          22: { service: 'SSH',  banner: `${_rnd(_SSH_BANNERS)} — ${company}`, crackable: true, password: pw, complexity: 'low' },
          80: { service: 'HTTP', banner: `${_rnd(_HTTP_BANNERS)} — ${company} Portal`, crackable: false },
        },
        files: {
          [file]:       _fileContent(file, company),
          'readme.txt': `${company} internal server\nOps: ops@${slug}.corp`,
        },
      },
    };
  }

  return {
    ...shared,
    briefing: [
      { type: 'sys',  text: '[ INCOMING CONTRACT ]' },
      { type: 'info', text: '' },
      { type: 'info', text: `Target:     ${company} (web portal)` },
      { type: 'warn', text: `IP:         ${ip}` },
      { type: 'info', text: `Objective:  Download ${file}` },
      { type: 'info', text: `Payout:     ${reward} CRYPTO  [${diff}]` },
      { type: 'info', text: '' },
      { type: 'dim',  text: 'Route: scan → connect 80 → inject → ls → download' },
    ],
    target: {
      ip, hostname,
      ports: {
        80:  { service: 'HTTP',  banner: `${_rnd(_HTTP_BANNERS)} — ${company} Portal`, crackable: false, injectable: true },
        22:  { service: 'SSH',   banner: `${_rnd(_SSH_BANNERS)} — Hardened`,           crackable: false },
        443: { service: 'HTTPS', banner: 'SSL/TLS',                                    crackable: false },
      },
      files: {
        [file]:      _fileContent(file, company),
        'index.php': `<!-- ${company} Portal v2 -->`,
      },
    },
  };
}
