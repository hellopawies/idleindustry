const TUT_STEPS = [
  {
    title: 'Welcome to The Drone Was Deployed! 🤖',
    text: "You're a programmer who's taken over a farm. Instead of farming yourself, you'll write code to control a drone that does all the work. Let's walk through the basics.",
  },
  {
    title: 'Your Farm',
    text: 'This is your 3×3 farm grid. The ⚡ symbol is your drone. Each tile can hold a crop — the bar at the bottom shows growth. When it turns yellow, the crop is ready to harvest!',
    highlight: '#farm-grid',
  },
  {
    title: 'The Code Editor',
    text: 'Write JavaScript here to control the drone. Actions like move() and harvest() use `await` to pause and execute step by step. Sensing functions like canHarvest() are instant — no await needed.',
    highlight: '#code-editor',
  },
  {
    title: 'Run Your Code',
    text: "The editor has a starter script that loops forever: if something's ready to harvest, harvest it — then move East. Click ▶ Run to watch your drone go!",
    highlight: '#btn-run',
    code: 'while (true) {\n  if (canHarvest()) await harvest();\n  await move(East);\n}',
  },
  {
    title: 'Your Inventory',
    text: 'Resources you harvest appear here. Grass drops Hay, Bush drops Wood, Carrots drop Carrot. These are your currency — spend them in Research to unlock upgrades.',
    highlight: '#inv-panel',
  },
  {
    title: 'Research Tree',
    text: 'Click any card here to buy an upgrade with your resources. Unlock new crops, speed boosts (up to 10×), and bigger farms. Start by saving 10 Hay to unlock Bush!',
    highlight: '#research-panel',
  },
  {
    title: "You're ready! 🌾",
    text: "That's all you need. Write smarter code to cover the whole farm — try nested for loops with getPosX(), getPosY(), and getWorldSize(). Happy farming!",
    isLast: true,
  },
];

let tutIdx = 0;

function tutShow(i) {
  const s = TUT_STEPS[i];
  document.getElementById('tut-step-label').textContent = `Step ${i + 1} of ${TUT_STEPS.length}`;
  document.getElementById('tut-title').textContent = s.title;
  document.getElementById('tut-text').textContent = s.text;
  const codeEl = document.getElementById('tut-code');
  if (s.code) { codeEl.textContent = s.code; codeEl.classList.add('show'); }
  else codeEl.classList.remove('show');
  document.getElementById('tut-next').textContent = s.isLast ? '🌾 Start Playing!' : 'Next →';
  document.getElementById('tut-dots').innerHTML = TUT_STEPS.map((_, j) =>
    `<div class="tut-dot${j === i ? ' on' : ''}"></div>`
  ).join('');
  tutSpotlight(s.highlight);
}

function tutSpotlight(sel) {
  const sp = document.getElementById('tut-spotlight');
  if (!sel) { sp.style.boxShadow = 'none'; sp.style.width = '0'; return; }
  const el = document.querySelector(sel);
  if (!el) { sp.style.boxShadow = 'none'; return; }
  const r = el.getBoundingClientRect(), p = 8;
  sp.style.left   = `${r.left   - p}px`;
  sp.style.top    = `${r.top    - p}px`;
  sp.style.width  = `${r.width  + p * 2}px`;
  sp.style.height = `${r.height + p * 2}px`;
  sp.style.boxShadow = '0 0 0 9999px rgba(0,0,0,.72)';
}

function tutNext() {
  tutIdx++;
  if (tutIdx >= TUT_STEPS.length) { tutEnd(); return; }
  tutShow(tutIdx);
}

function tutEnd() {
  document.getElementById('tut-overlay').classList.remove('on');
  localStorage.setItem('drone-tut-done', '1');
}

document.getElementById('tut-next').addEventListener('click', tutNext);
document.getElementById('tut-skip').addEventListener('click', tutEnd);
