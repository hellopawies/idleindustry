// Game state — the single source of truth for everything in-game
let G = newState();

function newState() {
  return {
    size: 3,
    grid: [],
    drone: { x: 0, y: 0 },
    inv: { hay: 0, wood: 0, carrot: 0 },
    speed: 1,
    running: false,
    stop: false,
    unlocked: new Set(['grass']),
    bought: new Set(),
  };
}

function makeCell(entity = null, growth = 0) {
  const now = Date.now();
  return {
    ground: 'turf',
    entity,
    plantedAt: entity ? now - growth * (GROW_MS[entity] || 4000) : 0,
    clearAt: null,
  };
}

function cellGrowth(cell) {
  if (!cell.entity) return 0;
  return Math.min(1, (Date.now() - cell.plantedAt) / GROW_MS[cell.entity]);
}

function initFarm(size) {
  G.size = size;
  G.grid = [];
  G.drone = { x: 0, y: 0 };
  for (let y = 0; y < size; y++) {
    G.grid[y] = [];
    for (let x = 0; x < size; x++) G.grid[y][x] = makeCell('grass', Math.random());
  }
}

function expandFarm(newSize) {
  const old = G.grid, oldSize = G.size;
  G.size = newSize;
  G.grid = [];
  for (let y = 0; y < newSize; y++) {
    G.grid[y] = [];
    for (let x = 0; x < newSize; x++)
      G.grid[y][x] = (y < oldSize && x < oldSize) ? old[y][x] : makeCell('grass', Math.random());
  }
}

function cur() { return G.grid[G.drone.y][G.drone.x]; }

// Auto-grow grass on empty turf tiles
setInterval(() => {
  const now = Date.now();
  for (let y = 0; y < G.size; y++)
    for (let x = 0; x < G.size; x++) {
      const c = G.grid[y][x];
      if (!c.entity && c.ground === 'turf' && (!c.clearAt || now - c.clearAt > 2000)) {
        c.entity = 'grass';
        c.plantedAt = now;
        c.clearAt = null;
      }
    }
  render();
}, 150);

// ── Rendering ────────────────────────────────────────────────

function render() {
  renderFarm();
  renderInv();
  renderResearch();
}

function renderFarm() {
  const el = document.getElementById('farm-grid');
  el.style.gridTemplateColumns = `repeat(${G.size}, 68px)`;
  const want = G.size * G.size;
  while (el.children.length < want) {
    const d = document.createElement('div');
    d.className = 'cell';
    d.innerHTML = '<div class="cell-icon"></div><div class="cell-bar"><div class="cell-bar-fill"></div></div>';
    el.appendChild(d);
  }
  while (el.children.length > want) el.removeChild(el.lastChild);
  let i = 0;
  for (let y = 0; y < G.size; y++)
    for (let x = 0; x < G.size; x++) {
      const c = G.grid[y][x], d = el.children[i++];
      const g = cellGrowth(c), ready = g >= 1, isDrone = G.drone.x === x && G.drone.y === y;
      d.className = `cell ${c.ground}${ready ? ' ready' : ''}${isDrone ? ' drone-here' : ''}`;
      const ic = ICONS[c.entity];
      let txt = c.entity ? (ic ? (ready ? ic.r : ic.g) : '?') : '';
      if (isDrone) txt = '⚡' + txt;
      d.querySelector('.cell-icon').textContent = txt;
      d.querySelector('.cell-bar-fill').style.width = `${g * 100}%`;
    }
}

function renderInv() {
  document.getElementById('inv-list').innerHTML = INV_DISPLAY.map(it =>
    `<div class="item-row"><span class="item-icon">${it.icon}</span><span class="item-name">${it.name}</span><span class="item-count">${G.inv[it.key] ?? 0}</span></div>`
  ).join('');
}

function renderResearch() {
  document.getElementById('research-list').innerHTML = RESEARCH.map(u => {
    const owned = G.bought.has(u.id);
    const reqOk = !u.req || u.req.every(r => G.bought.has(r));
    const costStr = Object.entries(u.cost).map(([k, v]) => `${v} ${k}`).join(', ');
    const cls = 'unlock-card' + (owned ? ' owned' : reqOk ? '' : ' needs-req');
    return `<div class="${cls}" onclick="buyResearch('${u.id}')">
      <div class="unlock-name">${owned ? '✓ ' : ''}${u.name}</div>
      <div class="unlock-desc">${u.desc}</div>
      ${!owned ? `<div class="unlock-cost">Cost: ${costStr}</div>` : ''}
    </div>`;
  }).join('');
}

// ── Research ─────────────────────────────────────────────────

function farmSizeFromBought() {
  if (G.bought.has('expand2')) return 7;
  if (G.bought.has('expand1')) return 5;
  return 3;
}

function applyBought() {
  G.unlocked = new Set(['grass']);
  G.speed = 1;
  for (const id of G.bought) {
    const u = RESEARCH.find(r => r.id === id);
    if (!u) continue;
    if (u.grants) u.grants.forEach(e => G.unlocked.add(e));
    if (u.speed)  G.speed = u.speed;
  }
}

function buyResearch(id) {
  const u = RESEARCH.find(r => r.id === id);
  if (!u || G.bought.has(id)) return;
  if (u.req && !u.req.every(r => G.bought.has(r))) { log('Requirements not met.', 'error'); return; }
  if (!Object.entries(u.cost).every(([k, v]) => (G.inv[k] || 0) >= v)) { log(`Not enough resources for ${u.name}.`, 'error'); return; }
  Object.entries(u.cost).forEach(([k, v]) => G.inv[k] -= v);
  G.bought.add(id);
  if (u.grants) u.grants.forEach(e => G.unlocked.add(e));
  if (u.speed) { G.speed = u.speed; document.getElementById('speed-sel').value = u.speed; }
  if (u.expand) expandFarm(u.expand);
  log(`Researched: ${u.name}`, 'info');
  render();
  saveCloud();
}

// ── Output log ───────────────────────────────────────────────

function log(msg, type = 'log') {
  const out = document.getElementById('output');
  const line = document.createElement('div');
  line.className = `out-${type}`;
  line.textContent = `> ${msg}`;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
  while (out.children.length > 60) out.removeChild(out.firstChild);
}
