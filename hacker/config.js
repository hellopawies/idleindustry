const TOOLS = {
  basic_cracker: { name: 'Basic Cracker',  desc: 'Dictionary attack on SSH. Works on low-complexity passwords.' },
  wordlist_pro:  { name: 'Wordlist Pro',   desc: 'Extended dictionary. Cracks medium-complexity passwords.' },
  sqli_kit:      { name: 'SQLi Kit',       desc: 'Automated SQL injection toolkit for web login forms.' },
  proxy_basic:   { name: 'Basic Proxy',    desc: 'Route traffic through a single hop to reduce trace.' },
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
    unlocks: ['sqli_kit'],
    check(G) { return G.downloadedFiles.includes('user_records.csv'); },
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
