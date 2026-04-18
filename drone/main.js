// ── Session check ─────────────────────────────────────────────
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  if (!_s?.userId || !_s?.username) window.location.replace('../');
} catch { window.location.replace('../'); }

// ── Toolbar event listeners ───────────────────────────────────

document.getElementById('btn-run').addEventListener('click', runCode);

document.getElementById('btn-stop').addEventListener('click', () => { G.stop = true; });

document.getElementById('speed-sel').addEventListener('change', e => { G.speed = +e.target.value; });

document.getElementById('btn-reset').addEventListener('click', () => {
  G.stop = true;
  setTimeout(() => {
    G = newState();
    document.getElementById('output').innerHTML = '';
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    initFarm(3);
    render();
    log('Game reset.', 'info');
  }, 100);
});

document.getElementById('code-editor').addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const t = e.target, s = t.selectionStart;
    t.value = t.value.slice(0, s) + '  ' + t.value.slice(t.selectionEnd);
    t.selectionStart = t.selectionEnd = s + 2;
  }
});

// ── Init ─────────────────────────────────────────────────────

initFarm(3);
render();
log('Welcome! Write code in the editor and click Run.', 'info');
log('Try: while(true){ if(canHarvest()) await harvest(); await move(East); }', 'log');

setTimeout(() => {
  if (!localStorage.getItem('drone-tut-done')) {
    tutIdx = 0;
    tutShow(0);
    document.getElementById('tut-overlay').classList.add('on');
  }
}, 400);
