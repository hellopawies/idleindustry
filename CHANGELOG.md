# PawieGames — Changelog

---

## 2026-04-19

### Hacker Story — v1.0.0
- 3 new story missions: Act 1 M3 (The Architect), Act 2 M1 (The Broker), Act 2 M2 (Black Ice)
- 3 new tools with gameplay effects: Proxy Basic (–35% trace), Port Scanner Pro (reveals stealth ports), Bruteforce v2 (high-complexity SSH)
- Mid-mission and quest progress now saved to cloud — refresh resumes exactly where you left off
- Trace and heat persist across page refreshes
- Fixed quest save race condition (saves now awaited before continuing)
- Tighter terminal line spacing

### Hacker Story — v0.3.0
- Free Mode: random anonymous contracts after story chapters run out
- Two contract types gated by tool loadout: SSH exfiltration and SQL injection
- `story` command checks for new chapters; `quest` command manages contracts

### Hacker Story — v0.2.0
- Hub-style header with Trace and Heat meters
- Act/mission shown in header pill; mobile layout fixed

### Hacker Story — v0.1.0 (Initial Launch)
- Terminal hacking game with 2 story missions following the Project Helios conspiracy
- Commands: scan, connect, crack, inject, ls, cat, download
- Trace meter + Heat (notoriety) system
- Cloud save from day one

### Idle Industry — v1.0.0
- Offline Earnings Receipt: returning players see a per-industry breakdown of what they earned while away

### Idle Industry — v0.9.0
- Removed the Reset Game button

### The Drone Was Deployed — v1.0.0 (Initial Launch)
- 7-chapter story mode teaches JavaScript coding concepts step by step before free play
- Story progress saved to cloud — picks up where you left off on any device
- Story mode restart button (↺) in the header to replay from Chapter 1
- Free play unlocks after completing all 7 chapters
- Code editor with Run / Stop / Speed controls and auto-save
- Research panel to unlock upgrades using harvested resources
- Mode toggle buttons stack full-width on mobile for easy tapping

---

## 2026-03-23

### Idle Industry — v0.8.0
- Version tag on login screen is now a label (not a button)
- Username placeholder changed to "Username"
- Admin can now set a global Idle Income Multiplier
- Login stats shows the Idle Bonus multiplier
- New buildings from v0.7.0 always appear even if server config predates them

### Idle Industry — v0.7.0
- Version number shown on login screen
- Buy ×10/×100 uses "buy up to N" — buys however many you can afford
- 5 new late-game buildings: Quantum Nexus, Neural Galaxy, Dark Matter Engine, Time Forge, Entropy Vault

### Idle Industry — v0.6.0
- Buildings unlock progressively — buy one of each before the next is revealed
- Buy quantity selector: ×1, ×10, ×100, Max
- App favicon and Apple touch icon

### Idle Industry — v0.5.0
- Full mobile layout: stats stack below title, cards and buttons are touch-friendly
- Admin editor rows reflow on narrow screens
- Login stats bar switches to 2×2 grid on mobile

### Idle Industry — v0.4.0
- 4 new late-game buildings: Megacorp, AI Conglomerate, Dyson Sphere, Galactic Empire

### Idle Industry — v0.3.0
- Animated business-theme background across all screens
- Live server stats on login page
- Leaderboard — top 20 richest players
- Version number and changelog added

---

## 2026-03-22

### Idle Industry — v0.2.0
- Player rank system: Intern → Associate → Manager → Director → VP → CEO
- Each rank gives an income multiplier bonus and extra offline earning hours
- Rank badge shown in the game header

---

## 2026-03-21

### Idle Industry — v0.1.0
- Initial launch — build industries and earn money passively
- Cloud save syncs progress automatically
- Offline income accrues while you're away, up to the idle cap
