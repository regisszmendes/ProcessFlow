// ===========================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL = "https://fskbraltrjhxnvlfshqb.supabase.co";
const SUPABASE_KEY = "sb_publishable_LwV8tmjClKkcVQRvxtUUpg_IH8JkHLc";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("✅ Supabase ready");
