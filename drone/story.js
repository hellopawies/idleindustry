// ── Story Mode Controller ─────────────────────────────────────

let storyMode  = false;
let storyChapter = 0;

function storyGetProgress() {
  return parseInt(localStorage.getItem('drone-story-chapter') || '0', 10);
}

function storySaveProgress(idx) {
  localStorage.setItem('drone-story-chapter', String(idx));
  if (idx >= CHAPTERS.length) localStorage.setItem('drone-story-done', '1');
  saveCloud();
}

function storyIsDone() {
  return !!localStorage.getItem('drone-story-done');
}

function setMode(mode) {
  storyMode = mode === 'story';
  document.getElementById('btn-story-mode').classList.toggle('active', storyMode);
  document.getElementById('btn-free-mode').classList.toggle('active', !storyMode);
  document.getElementById('story-panel').hidden    = !storyMode;
  document.getElementById('research-panel').hidden = storyMode;
  document.getElementById('story-chapter-done').hidden = true;
  document.getElementById('btn-save').disabled = storyMode;

  if (storyMode) {
    loadChapter(storyChapter);
  } else {
    _restoreFreePlay();
  }
}

async function _restoreFreePlay() {
  G.stop = true;
  await new Promise(r => setTimeout(r, 150));
  G.stop = false; G.running = false;
  document.getElementById('btn-run').disabled  = false;
  document.getElementById('btn-stop').disabled = true;

  G = newState();
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
  document.getElementById('output').innerHTML = '';
  render();
  log('Free Play — build the farm your way!', 'info');
}

function loadChapter(idx) {
  if (idx >= CHAPTERS.length) { _finishStory(); return; }
  storyChapter = idx;
  const ch = CHAPTERS[idx];

  G.stop = true;
  setTimeout(() => {
    G.stop = false; G.running = false;
    document.getElementById('btn-run').disabled  = false;
    document.getElementById('btn-stop').disabled = true;

    ch.setup();

    document.getElementById('code-editor').value              = ch.starterCode;
    document.getElementById('story-badge').textContent        = `Chapter ${ch.badge}`;
    document.getElementById('story-ch-title').textContent     = ch.title;
    document.getElementById('story-text').innerHTML           = ch.story.replace(/\n/g, '<br>');
    document.getElementById('story-objective').innerHTML      = `<b>Objective:</b> ${ch.objective}`;
    document.getElementById('story-concept').textContent      = `Concept: ${ch.concept}`;
    document.getElementById('story-hint-text').textContent    = ch.hint;
    document.getElementById('story-hint-text').hidden         = true;
    document.getElementById('story-hint-btn').textContent     = 'Show Hint';
    document.getElementById('story-chapter-done').hidden      = true;

    document.getElementById('output').innerHTML = '';
    log(`Chapter ${idx + 1} / ${CHAPTERS.length}: ${ch.title}`, 'info');
    log(`Objective: ${ch.objective}`, 'info');

    render();
  }, 150);
}

function storyCheckWin() {
  if (!storyMode || storyChapter >= CHAPTERS.length) return;
  if (CHAPTERS[storyChapter].check(G)) chapterComplete();
}

function chapterComplete() {
  const isLast = storyChapter + 1 >= CHAPTERS.length;
  storySaveProgress(storyChapter + 1);

  document.getElementById('chapter-done-icon').textContent  = isLast ? '🎉' : '⭐';
  document.getElementById('chapter-done-title').textContent = isLast ? 'Story Complete!' : 'Chapter Complete!';
  document.getElementById('chapter-done-sub').textContent   = CHAPTERS[storyChapter].title;
  document.getElementById('chapter-done-next').textContent  = isLast ? 'Enter Free Play →' : 'Next Chapter →';
  document.getElementById('story-chapter-done').hidden      = false;
}

function _finishStory() {
  storySaveProgress(CHAPTERS.length);
  setMode('free');
}

// ── Init ─────────────────────────────────────────────────────

function initStory() {
  storyChapter = Math.min(storyGetProgress(), CHAPTERS.length - 1);

  document.getElementById('btn-story-mode').addEventListener('click', () => setMode('story'));
  document.getElementById('btn-free-mode').addEventListener('click',  () => setMode('free'));

  document.getElementById('story-hint-btn').addEventListener('click', () => {
    const hint = document.getElementById('story-hint-text');
    const btn  = document.getElementById('story-hint-btn');
    hint.hidden     = !hint.hidden;
    btn.textContent = hint.hidden ? 'Show Hint' : 'Hide Hint';
  });

  document.getElementById('chapter-done-next').addEventListener('click', () => {
    document.getElementById('story-chapter-done').hidden = true;
    const next = storyChapter + 1;
    if (next >= CHAPTERS.length) {
      storySaveProgress(CHAPTERS.length);
      setMode('free');
    } else {
      loadChapter(next);
    }
  });

  _afterRunHook = storyCheckWin;
}
