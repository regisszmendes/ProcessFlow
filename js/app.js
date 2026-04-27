let currentUser = null;
let currentUser = null;
window.CAN_EDIT = ['editor', 'manager', 'admin'];        //
window.CAN_ADMIN = ['admin'];                             //
// =========================
// VISIT LOGGER
// =========================
function recordVisit() {
  const visits = JSON.parse(localStorage.getItem('pf_visits') || '[]');
  visits.push({ timestamp: new Date().toISOString() });
  localStorage.setItem('pf_visits', JSON.stringify(visits));
}

// =========================
// APP INIT
// =========================
window.addEventListener('DOMContentLoaded', async function () {
  recordVisit();

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session?.user) return;

  const { data: userProfile, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) { console.error(error); return; }

  if (userProfile?.active) {
    currentUser = userProfile;
    bootApp();
  }
});

// =========================
// ADMIN PENDING USER POLL
// =========================
setInterval(async function () {
  if (!currentUser || !window.CAN_ADMIN?.includes(currentUser.role)) return;

  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select('*');

  if (error || !users) return;

  const pendingCount = users.filter(u => u.pending).length;

  if (window._lastPendingCount === undefined) {
    window._lastPendingCount = pendingCount;
    return;
  }

  if (window._lastPendingCount !== pendingCount) {
    window._lastPendingCount = pendingCount;

    syncUsers();
    refreshConfigNavBadge();
    renderPendingBanner();

    if (document.getElementById('section-config')?.classList.contains('active')) {
      renderUserTable();
    }
  }
}, 4000);
