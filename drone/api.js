// ── Post-run hook (used by story mode) ───────────────────────
let _afterRunHook = null;

// ── Timing helpers ───────────────────────────────────────────

function delay(ms) {
  return new Promise((res, rej) => setTimeout(() => G.stop ? rej(new Error('__STOP__')) : res(), ms));
}
function actionDelay() { return delay(500 / G.speed); }
function chk() { if (G.stop) throw new Error('__STOP__'); }

// ── Direction map ────────────────────────────────────────────

const DIR = {
  north: d => ({ x: d.x, y: (d.y - 1 + G.size) % G.size }),
  south: d => ({ x: d.x, y: (d.y + 1) % G.size }),
  east:  d => ({ x: (d.x + 1) % G.size, y: d.y }),
  west:  d => ({ x: (d.x - 1 + G.size) % G.size, y: d.y }),
};

// ── Drone actions (all async — use await in player code) ─────

async function apiMove(dir) {
  chk();
  const k = (typeof dir === 'string' ? dir : '').toLowerCase();
  if (!DIR[k]) throw new Error(`Unknown direction: "${dir}". Use North, South, East, or West.`);
  await actionDelay();
  G.drone = DIR[k](G.drone);
}

async function apiHarvest() {
  chk();
  const c = cur();
  if (!c.entity || cellGrowth(c) < 1) return false;
  await actionDelay();
  const d = DROPS[c.entity];
  if (d) G.inv[d.item] = (G.inv[d.item] || 0) + d.n;
  c.entity = null;
  c.clearAt = Date.now();
  return true;
}

async function apiTill() {
  chk();
  await actionDelay();
  const c = cur();
  if (c.entity) { c.entity = null; c.clearAt = Date.now(); }
  c.ground = c.ground === 'turf' ? 'soil' : 'turf';
}

async function apiPlant(type) {
  chk();
  const t = typeof type === 'string' ? type.toLowerCase() : String(type ?? '');
  if (!G.unlocked.has(t)) { log(`${t} is not unlocked yet.`, 'error'); return false; }
  const c = cur();
  if (c.entity || (t === 'carrot' && c.ground !== 'soil')) return false;
  await actionDelay();
  c.entity = t;
  c.plantedAt = Date.now();
  c.clearAt = null;
  return true;
}

// ── Drone sensors (instant — no await needed) ────────────────

const apiCanHarvest  = () => { const c = cur(); return !!(c.entity && cellGrowth(c) >= 1); };
const apiEntityType  = () => cur().entity;
const apiGroundType  = () => cur().ground;
const apiWorldSize   = () => G.size;
const apiPosX        = () => G.drone.x;
const apiPosY        = () => G.drone.y;
const apiNumItems    = k  => G.inv[(typeof k === 'string' ? k : '').toLowerCase()] || 0;
const apiPrint       = (...a) => log(a.join(' '), 'log');

// ── API surface exposed to player code ───────────────────────

const API_KEYS = [
  'move', 'harvest', 'plant', 'till',
  'canHarvest', 'getEntityType', 'getGroundType', 'getWorldSize', 'getPosX', 'getPosY', 'numItems', 'print',
  'North', 'South', 'East', 'West',
  'Entities', 'Grounds', 'Items',
];
const API_VALS = [
  apiMove, apiHarvest, apiPlant, apiTill,
  apiCanHarvest, apiEntityType, apiGroundType, apiWorldSize, apiPosX, apiPosY, apiNumItems, apiPrint,
  'north', 'south', 'east', 'west',
  { Grass: 'grass', Bush: 'bush', Tree: 'tree', Carrot: 'carrot' },
  { Turf: 'turf', Soil: 'soil' },
  { Hay: 'hay', Wood: 'wood', Carrot: 'carrot' },
];

// ── Code runner ──────────────────────────────────────────────

async function runCode() {
  const code = document.getElementById('code-editor').value;
  G.running = true; G.stop = false;
  document.getElementById('btn-run').disabled = true;
  document.getElementById('btn-stop').disabled = false;
  log('Running...', 'info');
  try {
    const fn = new (Object.getPrototypeOf(async function() {}).constructor)(...API_KEYS, code);
    await fn(...API_VALS);
    log('Done.', 'info');
  } catch (e) {
    if (e.message !== '__STOP__') log(`Error: ${e.message}`, 'error');
    else log('Stopped.', 'info');
  }
  G.running = false; G.stop = false;
  document.getElementById('btn-run').disabled = false;
  document.getElementById('btn-stop').disabled = true;
  if (typeof _afterRunHook === 'function') _afterRunHook();
}
