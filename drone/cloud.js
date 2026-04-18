const SUPABASE_URL      = "https://fwawlsbjltgvcpyezciw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cWfZRmHb55YMA-wa7hb6rw_qP6dIuYi";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserId = null;
try {
  const _s = JSON.parse(localStorage.getItem("pg_session"));
  currentUserId = _s?.userId || null;
} catch {}

async function saveCloud() {
  if (!currentUserId) return;
  const code = document.getElementById('code-editor')?.value ?? '';
  await sb.rpc("save_drone", {
    p_user_id: currentUserId,
    p_data: { bought: [...G.bought], inv: { ...G.inv }, code },
  });
}

async function loadCloud() {
  if (!currentUserId) return null;
  const { data, error } = await sb.rpc("load_drone", { p_user_id: currentUserId });
  if (error || !data) return null;
  return data;
}
