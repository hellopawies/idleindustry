// ── Session check ─────────────────────────────────────────────
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  if (!_s?.userId || !_s?.username) window.location.replace('../');
} catch { window.location.replace('../'); }

// ── Toolbar event listeners ───────────────────────────────────

document.getElementById('btn-run').addEventListener('click', runCode);

document.getElementById('btn-save').addEventListener('click', async () => {
  if (storyMode) return;
  const btn = document.getElementById('btn-save');
  btn.textContent = '💾 Saving…';
  btn.disabled = true;
  await saveCloud();
  btn.textContent = '✓ Saved';
  setTimeout(() => { btn.textContent = '💾 Save'; btn.disabled = false; }, 1500);
});

document.getElementById('btn-stop').addEventListener('click', () => { G.stop = true; });

document.getElementById('speed-sel').addEventListener('change', e => { G.speed = +e.target.value; });

document.getElementById('btn-reset').addEventListener('click', () => {
  if (storyMode) { loadChapter(storyChapter); return; }
  G.stop = true;
  setTimeout(() => {
    G = newState();
    document.getElementById('output').innerHTML = '';
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    initFarm(3);
    render();
    log('Game reset.', 'info');
    saveCloud();
  }, 100);
});

let _saveTimer = null;
document.getElementById('code-editor').addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const t = e.target, s = t.selectionStart;
    t.value = t.value.slice(0, s) + '  ' + t.value.slice(t.selectionEnd);
    t.selectionStart = t.selectionEnd = s + 2;
  }
});
document.getElementById('code-editor').addEventListener('input', () => {
  if (storyMode) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveCloud, 2000);
});

// ── Init ─────────────────────────────────────────────────────

(async () => {
  initStory();

  if (!storyIsDone()) {
    initFarm(3);
    render();
    setMode('story');
  } else {
    const saved = await loadCloud();
    if (saved) {
      if (saved.bought?.length > 0) {
        G.bought = new Set(saved.bought);
        G.inv    = { hay: 0, wood: 0, carrot: 0, ...saved.inv };
        applyBought();
        initFarm(farmSizeFromBought());
        document.getElementById('speed-sel').value = G.speed;
      } else {
        initFarm(3);
      }
      if (saved.code) document.getElementById('code-editor').value = saved.code;
    } else {
      initFarm(3);
    }
    render();
    setMode('free');
    log('Welcome! Write code in the editor and click Run.', 'info');
    log('Try: while(true){ if(canHarvest()) await harvest(); await move(East); }', 'log');

    setTimeout(() => {
      if (!localStorage.getItem('drone-tut-done')) {
        tutIdx = 0;
        tutShow(0);
        document.getElementById('tut-overlay').classList.add('on');
      }
    }, 400);
  }

  setInterval(saveCloud, 30_000);
  window.addEventListener('beforeunload', saveCloud);
})();
