// ===========================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL = "https://fskbraltrjhxnvlfshqb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza2JyYWx0cmpoeG52bGZzaHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNTM0NjcsImV4cCI6MjA1MjYyOTQ2N30.sb_publishable_LwV8tmjClKkcVQRvxtUUpg_IH8JkHLc";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("✅ Supabase ready");
