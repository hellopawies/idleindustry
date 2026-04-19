const SUPABASE_URL      = "https://fwawlsbjltgvcpyezciw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cWfZRmHb55YMA-wa7hb6rw_qP6dIuYi";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  currentUserId = _s?.userId || null;
} catch {}

// Cached free-play state — preserved so story saves never overwrite game progress.
let _cachedGameState = null;
let _cachedCode      = null;

async function saveCloud() {
  if (!currentUserId) { console.warn('[cloud] no userId, skipping save'); return; }

  const inStory = typeof storyMode !== 'undefined' && storyMode;

  // Use cached free-play state when saving from story mode.
  const gameState = inStory && _cachedGameState
    ? _cachedGameState
    : { bought: [...G.bought], inv: { ...G.inv } };

  const code = inStory && _cachedCode !== null
    ? _cachedCode
    : (document.getElementById('code-editor')?.value ?? '');

  const storyData = {
    storyChapter: typeof storyChapter !== 'undefined' ? storyChapter : 0,
    storyDone:    typeof storyIsDone  === 'function'  ? storyIsDone() : false,
  };

  const { error } = await sb.rpc("save_drone", {
    p_user_id: currentUserId,
    p_data:    { ...gameState, ...storyData },
    p_code:    code,
  });
  if (error) console.error('[cloud] save failed:', error);
  else console.log('[cloud] saved ok');
}

async function loadCloud() {
  if (!currentUserId) { console.warn('[cloud] no userId, skipping load'); return null; }
  const { data, error } = await sb.rpc("load_drone", { p_user_id: currentUserId });
  if (error) { console.error('[cloud] load failed:', error); return null; }

  if (data) {
    // Cache free-play state for story-mode save protection.
    _cachedGameState = { bought: data.bought || [], inv: data.inv || {} };
    _cachedCode      = data.code ?? null;

    // Restore story progress from cloud into localStorage.
    if (data.storyChapter != null)
      localStorage.setItem('drone-story-chapter', String(data.storyChapter));
    if (data.storyDone)
      localStorage.setItem('drone-story-done', '1');
  }

  console.log('[cloud] loaded:', data);
  return data;
}
