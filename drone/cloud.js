const SUPABASE_URL      = "https://fwawlsbjltgvcpyezciw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cWfZRmHb55YMA-wa7hb6rw_qP6dIuYi";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  currentUserId = _s?.userId || null;
} catch {}

async function saveCloud() {
  if (!currentUserId) { console.warn('[cloud] no userId, skipping save'); return; }
  const code = document.getElementById('code-editor')?.value ?? '';
  const { error } = await sb.rpc("save_drone", {
    p_user_id: currentUserId,
    p_data: { bought: [...G.bought], inv: { ...G.inv } },
    p_code: code,
  });
  if (error) console.error('[cloud] save failed:', error);
  else console.log('[cloud] saved ok');
}

async function loadCloud() {
  if (!currentUserId) { console.warn('[cloud] no userId, skipping load'); return null; }
  const { data, error } = await sb.rpc("load_drone", { p_user_id: currentUserId });
  if (error) { console.error('[cloud] load failed:', error); return null; }
  console.log('[cloud] loaded:', data);
  return data;
}
