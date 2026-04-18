// ── Supabase client ──────────────────────────────────────────
const SUPABASE_URL      = "https://fwawlsbjltgvcpyezciw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cWfZRmHb55YMA-wa7hb6rw_qP6dIuYi";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Default industry data (fallback if DB config unavailable) ─
const DEFAULT_INDUSTRIES = [
  { id: 0,  name: "Lemonade Stand",     emoji: "🍋", baseCost: 10,                    baseIncome: 0.10          },
  { id: 1,  name: "Bakery",             emoji: "🥐", baseCost: 100,                   baseIncome: 0.80          },
  { id: 2,  name: "Factory",            emoji: "🏭", baseCost: 1_000,                 baseIncome: 6.00          },
  { id: 3,  name: "Oil Rig",            emoji: "🛢️", baseCost: 10_000,                baseIncome: 47.00         },
  { id: 4,  name: "Tech Company",       emoji: "💻", baseCost: 100_000,               baseIncome: 260.00        },
  { id: 5,  name: "Bank",               emoji: "🏦", baseCost: 1_000_000,             baseIncome: 1_400         },
  { id: 6,  name: "Space Program",      emoji: "🚀", baseCost: 10_000_000,            baseIncome: 7_800         },
  { id: 7,  name: "Megacorp",           emoji: "🌐", baseCost: 100_000_000,           baseIncome: 43_000        },
  { id: 8,  name: "AI Conglomerate",    emoji: "🤖", baseCost: 1_000_000_000,         baseIncome: 240_000       },
  { id: 9,  name: "Dyson Sphere",       emoji: "☀️", baseCost: 10_000_000_000,        baseIncome: 1_300_000     },
  { id: 10, name: "Galactic Empire",    emoji: "🌌", baseCost: 100_000_000_000,       baseIncome: 7_000_000     },
  { id: 11, name: "Quantum Nexus",      emoji: "🔮", baseCost: 1_000_000_000_000,     baseIncome: 40_000_000    },
  { id: 12, name: "Neural Galaxy",      emoji: "🧠", baseCost: 10_000_000_000_000,    baseIncome: 220_000_000   },
  { id: 13, name: "Dark Matter Engine", emoji: "⚫", baseCost: 100_000_000_000_000,   baseIncome: 1_200_000_000 },
  { id: 14, name: "Time Forge",         emoji: "⏳", baseCost: 1_000_000_000_000_000, baseIncome: 6_500_000_000 },
  { id: 15, name: "Entropy Vault",      emoji: "🌀", baseCost: 10_000_000_000_000_000,baseIncome: 36_000_000_000},
];

const DEFAULT_COST_SCALE      = 1.15;
const DEFAULT_MAX_OFFLINE_H   = 2;
const DEFAULT_IDLE_MULTIPLIER = 1.0;

const DEFAULT_RANKS = [
  { id: 0, name: "Intern",    emoji: "🪪", incomeBonus: 0,    offlineBonus: 0   },
  { id: 1, name: "Associate", emoji: "💼", incomeBonus: 0.05, offlineBonus: 0.5 },
  { id: 2, name: "Manager",   emoji: "📊", incomeBonus: 0.15, offlineBonus: 1   },
  { id: 3, name: "Director",  emoji: "🏢", incomeBonus: 0.30, offlineBonus: 1.5 },
  { id: 4, name: "VP",        emoji: "🎯", incomeBonus: 0.50, offlineBonus: 2   },
  { id: 5, name: "CEO",       emoji: "👑", incomeBonus: 1.00, offlineBonus: 4   },
];

// ── Live config (overwritten from DB on login) ────────────────
let INDUSTRIES    = DEFAULT_INDUSTRIES.map(x => ({ ...x }));
let RANKS         = DEFAULT_RANKS.map(x => ({ ...x }));
let COST_SCALE    = DEFAULT_COST_SCALE;
let MAX_OFFLINE   = DEFAULT_MAX_OFFLINE_H * 3600;
let IDLE_MULTIPLIER = DEFAULT_IDLE_MULTIPLIER;
let STARTING_MONEY  = 10;
let GAME_EVENTS     = [];

const SESSION_KEY = "pg_session";
