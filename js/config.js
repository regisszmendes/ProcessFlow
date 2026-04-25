// ============================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL = "https://fskbraltrjhxnvlfshqb.supabase.co";
const SUPABASE_KEY = "sb_publishable_LwV8tmjClKkcVQRvxtUUpg_IH8JkHLc";

// Make it global
window.supabaseClient = null;

try {
  if (typeof supabase !== "undefined") {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Supabase ready");
  } else {
    console.warn("⚠️ Supabase not loaded");
  }
} catch (err) {
  console.error("❌ Supabase init error:", err);
}
