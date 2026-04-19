const SUPABASE_URL      = "https://fwawlsbjltgvcpyezciw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cWfZRmHb55YMA-wa7hb6rw_qP6dIuYi";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  currentUserId = _s?.userId || null;
} catch {}

async function saveCloud(state) {
  if (!currentUserId) return;
  const { error } = await sb.rpc("save_hacker", { p_user_id: currentUserId, p_data: state });
  if (error) console.error('[hacker] save failed:', error);
}

async function loadCloud() {
  if (!currentUserId) return null;
  const { data, error } = await sb.rpc("load_hacker", { p_user_id: currentUserId });
  if (error) { console.error('[hacker] load failed:', error); return null; }
  return data;
}
