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

  {
    id: 'a1m3',
    act: 1,
    title: 'Ghost Protocol',
    objective: 'More content coming soon...',
    briefing: [
      { type: 'sys',  text: '[ DECRYPTING... ]' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'This chapter is still being prepared.' },
      { type: 'info', text: 'Check back soon — the story continues.' },
    ],
    target:  null,
    reward:  { crypto: 0 },
    unlocks: [],
    check()  { return false; },
  },
];
