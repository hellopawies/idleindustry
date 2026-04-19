const TOOLS = {
  basic_cracker:    { name: 'Basic Cracker',       desc: 'Dictionary attack on SSH. Works on low-complexity passwords.' },
  wordlist_pro:     { name: 'Wordlist Pro',         desc: 'Extended dictionary. Cracks medium-complexity passwords.' },
  sqli_kit:         { name: 'SQLi Kit',             desc: 'Automated SQL injection toolkit for web login forms.' },
  proxy_basic:      { name: 'Basic Proxy',          desc: 'Passively routes traffic through a hop — reduces all trace by 35%.' },
  port_scanner_pro: { name: 'Port Scanner Pro',     desc: 'Deep scan reveals stealth ports and service fingerprints.' },
  bruteforce_v2:    { name: 'Bruteforce v2',        desc: 'GPU-accelerated cracker. Handles high-complexity passwords.' },
  packet_sniffer:   { name: 'Packet Sniffer',       desc: 'Capture raw network traffic. Reveals credentials in cleartext protocols like SIP and FTP.' },
  fuzzer:           { name: 'HTTP Fuzzer',          desc: 'Brute-force web paths and hidden endpoints. Auto-authenticates on vulnerable admin panels.' },
  exploit_db:       { name: 'ExploitDB Client',     desc: 'Search and deploy known CVE exploits against unpatched services.' },
  cryptobreaker:    { name: 'CryptoBreaker',        desc: 'Decrypt AES-256 encrypted files using extracted key material.' },
  log_wiper:        { name: 'Log Wiper',            desc: 'Scrub auth logs and access trails from a compromised host.' },
  steganographer:   { name: 'Steganographer',       desc: 'Extract hidden payloads from image files using LSB steganalysis.' },
  rootkit_mk2:      { name: 'Rootkit Mk.II',        desc: 'Deploy a persistent backdoor — auto-authenticates on future connections.' },
  vpn_tunnel:       { name: 'VPN Tunnel',           desc: 'Encrypt all traffic through a multi-hop chain — reduces trace gain by 50%.' },
};

// ── Darknet Shop ──────────────────────────────────────────────
const SHOP = {
  tools: [
    { id: 'wordlist_pro',     price: 180,  name: 'Wordlist Pro',          desc: 'Cracks medium-complexity SSH passwords.' },
    { id: 'sqli_kit',         price: 240,  name: 'SQLi Kit',              desc: 'SQL injection toolkit for web login forms.' },
    { id: 'proxy_basic',      price: 300,  name: 'Basic Proxy',           desc: 'Reduces all trace gain by 35%.' },
    { id: 'port_scanner_pro', price: 400,  name: 'Port Scanner Pro',      desc: 'Reveals stealth ports hidden from basic scan.' },
    { id: 'bruteforce_v2',    price: 550,  name: 'Bruteforce v2',         desc: 'GPU cracker — handles high-complexity passwords.' },
    { id: 'packet_sniffer',   price: 280,  name: 'Packet Sniffer',        desc: 'Capture raw traffic — reveals credentials in cleartext protocols.' },
    { id: 'fuzzer',           price: 350,  name: 'HTTP Fuzzer',           desc: 'Brute-force hidden web paths and auto-auth on vulnerable panels.' },
    { id: 'exploit_db',       price: 480,  name: 'ExploitDB Client',      desc: 'Deploy CVE exploits against unpatched services.' },
    { id: 'cryptobreaker',    price: 620,  name: 'CryptoBreaker',         desc: 'Decrypt AES-256 files using extracted key material.' },
    { id: 'log_wiper',        price: 390,  name: 'Log Wiper',             desc: 'Scrub auth logs and access trails from compromised hosts.' },
    { id: 'steganographer',   price: 440,  name: 'Steganographer',        desc: 'Extract hidden payloads from image files via LSB steganalysis.' },
    { id: 'rootkit_mk2',      price: 750,  name: 'Rootkit Mk.II',         desc: 'Install persistent backdoor — auto-auth on future connects.' },
    { id: 'vpn_tunnel',       price: 900,  name: 'VPN Tunnel',            desc: 'Multi-hop encrypted chain — reduces all trace gain by 50%.' },
  ],
  upgrades: [
    { id: 'proxy_chain',      requires: 'proxy_basic',    price: 450, name: 'Proxy Chain',           desc: 'Triple-hop routing — boosts trace reduction from 35% to 60%.' },
    { id: 'wordlist_elite',   requires: 'wordlist_pro',   price: 380, name: 'Wordlist Elite',        desc: 'Optimised chains — medium SSH crack faster and lower trace.' },
    { id: 'exploit_kit',      requires: 'sqli_kit',       price: 600, name: 'Exploit Kit',           desc: 'Zero-days included — inject works on hardened web targets.' },
    { id: 'gpu_cluster',      requires: 'bruteforce_v2',  price: 700, name: 'GPU Cluster',           desc: 'Distributed nodes — high-complexity crack twice as fast.' },
    { id: 'deep_packet',      requires: 'packet_sniffer', price: 420, name: 'Deep Packet Inspector', desc: 'Full protocol decode — sniff reveals passwords, not just metadata.' },
    { id: 'fuzz_turbo',       requires: 'fuzzer',         price: 500, name: 'Fuzz Turbo',            desc: 'Parallelised engine — faster fuzzing and 30% lower trace on HTTP.' },
    { id: 'zero_day',         requires: 'exploit_db',     price: 850, name: 'Zero-Day Bundle',       desc: 'Unreleased CVE exploits — bypass even hardened SSH without a crack.' },
  ],
  bribes: [
    { id: 'ghost_protocol', price: 120, name: 'Ghost Protocol', desc: 'Flush your current trace to 0. Use any time mid-op.' },
    { id: 'fixer',          price: 250, name: 'Fixer',          desc: 'Crooked contact scrubs 20 heat off your record.' },
    { id: 'insider',        price: 200, name: 'Insider',        desc: 'Bribe a target sysadmin — auto-authenticates your active connection.' },
    { id: 'intel_drop',     price: 150, name: 'Intel Drop',     desc: 'Anonymous tip reveals all files on the current target.' },
    { id: 'cleaner',        price: 350, name: 'The Cleaner',    desc: 'Professional log sanitiser — wipe host logs without needing Log Wiper.' },
    { id: 'mole',           price: 280, name: 'The Mole',       desc: 'Insider at target org — reveals all hidden ports and file paths.' },
  ],
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
    unlocks: ['bruteforce_v2', 'packet_sniffer'],
    check(G) { return G.downloadedFiles.includes('blacksite_manifest.txt'); },
  },

  {
    id: 'a2m3',
    act: 2,
    title: 'The Telecom',
    objective: 'Capture VoIP credentials from the Blacksite comms relay (172.16.10.5)',
    briefing: [
      { type: 'sys',  text: '[ ENCRYPTED MESSAGE — 14:55:09 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Good work. The manifest is out there now.' },
      { type: 'info', text: 'But Voss is still talking. His operation runs through' },
      { type: 'info', text: 'a private SIP gateway — Voice-over-IP, unencrypted.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'SIP (port 5060) passes credentials in plaintext.' },
      { type: 'info', text: 'A packet sniffer on a live connection will capture them.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 172.16.10.5' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Route: scan → connect 5060 → sniff → download voip_creds.pcap' },
      { type: 'dim',  text: 'New command: sniff — passive capture on active connection.' },
    ],
    target: {
      ip:       '172.16.10.5',
      hostname: 'blacksite-sip-gw',
      ports: {
        5060: { service: 'SIP',  banner: 'Asterisk PBX 18.12 — Blacksite Comms', crackable: false },
        22:   { service: 'SSH',  banner: 'OpenSSH 9.1 — Key Auth Only',           crackable: false },
        443:  { service: 'HTTPS',banner: 'SSL/TLS — Admin (cert required)',        crackable: false },
      },
      files: {
        'pbx_status.txt': 'Asterisk PBX — Blacksite Internal\nRegistered extensions: 12\nActive calls: 0\nUptime: 47d 3h',
      },
      captureFiles: {
        'voip_creds.pcap': [
          '=== PACKET CAPTURE — SIP REGISTER ===',
          'Timestamp:  2026-04-19 14:43:12 UTC',
          'Protocol:   SIP/2.0 (UDP, CLEARTEXT)',
          '',
          'REGISTER sip:172.16.10.5 SIP/2.0',
          'From: <sip:voss_admin@blacksite.int>',
          'Authorization: Digest username="voss_admin"',
          '  realm="blacksite.int"',
          '  uri="sip:172.16.10.5"',
          '  nonce="7f3dc92a"',
          '',
          '>>> PLAINTEXT CREDENTIAL EXTRACTED <<<',
          'Username: voss_admin',
          'Password: T3l3c0m_Bl4ckS1te!',
          'Realm:    blacksite.int',
          '=====================================',
        ].join('\n'),
      },
    },
    reward:  { crypto: 750 },
    unlocks: ['fuzzer'],
    check(G) { return G.downloadedFiles.includes('voip_creds.pcap'); },
  },

  {
    id: 'a2m4',
    act: 2,
    title: 'CryptoVault',
    objective: 'Download wallet_seeds.db from the Blacksite crypto wallet server',
    briefing: [
      { type: 'sys',  text: '[ MISSION BRIEF — 16:20:31 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The VoIP logs reference a payment server.' },
      { type: 'info', text: 'Voss is moving crypto — 800+ BTC untraceable.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'The wallet server has a web interface.' },
      { type: 'info', text: 'No injectable forms — but there are hidden admin paths.' },
      { type: 'info', text: 'Run the fuzzer to brute-force directory names.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 192.168.20.8' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Route: scan → connect 80 → fuzz → ls → download wallet_seeds.db' },
      { type: 'dim',  text: 'New command: fuzz — directory brute-force on HTTP targets.' },
    ],
    target: {
      ip:       '192.168.20.8',
      hostname: 'blacksite-wallet-01',
      ports: {
        80:   { service: 'HTTP', banner: 'nginx/1.22.0 — Wallet Management Interface', crackable: false, fuzzable: true },
        22:   { service: 'SSH',  banner: 'OpenSSH 9.2 — Key Auth Only',                crackable: false },
        8443: { service: 'HTTPS',banner: 'SSL/TLS — Internal API',                     crackable: false, hidden: true },
      },
      files: {
        'index.html': '<!-- Wallet Management Interface v2.1 -->\n<title>WMI</title>\n<p>Authorised access only.</p>',
      },
      fuzzFiles: {
        'wallet_seeds.db': [
          '-- BIP39 Wallet Seed Database --',
          'wallet_id | seed_phrase                                  | balance_btc',
          '----------|----------------------------------------------|------------',
          'W-001     | arrow castle drift flame grant humid iris...  | 14.8821',
          'W-002     | bleak copper dune ember fawn ghost hinge...   |  7.2204',
          'W-003     | VOSS_OPERATIONAL_FUND                         | 892.4450',
          '',
          'Owner:    Senator R. Voss (alias: NightOwl_BTC)',
          'Note:     Rotate seeds after Q2 transfer. DO NOT STORE PLAINTEXT.',
        ].join('\n'),
        'admin_config.json': '{"db_host":"localhost","db_pass":"Wllt@dm1n!","backup_server":"10.50.0.1","backup_key":"helios_derived_v3"}',
      },
    },
    reward:  { crypto: 1200 },
    unlocks: ['exploit_db', 'log_wiper'],
    check(G) { return G.downloadedFiles.includes('wallet_seeds.db'); },
  },

  {
    id: 'a2m5',
    act: 2,
    title: 'Cleanup Crew',
    objective: 'Wipe the auth logs on the Blacksite log server (10.10.50.3)',
    briefing: [
      { type: 'sys',  text: '[ URGENT — 18:07:44 ]' },
      { type: 'info', text: '' },
      { type: 'info', text: 'You\'ve been active. Too active.' },
      { type: 'info', text: 'Voss\'s security team is reviewing relay logs.' },
      { type: 'info', text: 'Your IPs, timestamps, file transfers — all in /var/log/auth.log.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Get into the central log server and wipe everything.' },
      { type: 'info', text: 'Log Wiper will scrub auth entries without crashing the service.' },
      { type: 'info', text: '' },
      { type: 'warn', text: 'Target IP: 10.10.50.3' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Route: scan → connect 22 → crack → wipe' },
      { type: 'dim',  text: 'New command: wipe — scrub auth logs on authenticated host.' },
    ],
    target: {
      ip:       '10.10.50.3',
      hostname: 'blacksite-log-srv',
      ports: {
        22:  { service: 'SSH',  banner: 'OpenSSH 8.9 — Log Server', crackable: true, password: 'logadm1n!', complexity: 'medium' },
        514: { service: 'Syslog', banner: 'rsyslog 8.2102 — Central Log Aggregator', crackable: false, hidden: true },
      },
      files: {
        'auth.log': [
          '2026-04-18 22:11:04 sshd[1842]: Accepted password for voss_admin from 10.77.0.1',
          '2026-04-19 01:32:17 sshd[2201]: Accepted password for relay_svc from 172.16.10.5',
          '2026-04-19 02:48:55 sshd[2389]: Accepted password for unknown from 185.220.101.47',
          '2026-04-19 03:47:22 sshd[2541]: Accepted password for unknown from 185.220.101.47',
          '2026-04-19 14:43:12 sshd[3102]: Failed password for root from 185.220.101.47',
          '>>> YOUR IP IS IN THIS LOG. WIPE IT. <<<',
        ].join('\n'),
        'syslog': '[kernel] boot OK\n[cron] daily backup completed\n[rsyslog] remote logging active on :514',
        'wtmp.log': 'Binary session log — last 90 days. Includes all successful authentications.',
      },
    },
    reward:  { crypto: 900 },
    unlocks: ['steganographer'],
    check(G) { return (G.wipedHosts || []).includes('10.10.50.3'); },
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
