function recordVisit() {
  console.log("Visit recorded");

  const visits = JSON.parse(localStorage.getItem('pf_visits') || '[]');

  visits.push({
    timestamp: new Date().toISOString()
  });

  localStorage.setItem('pf_visits', JSON.stringify(visits));
}

window.addEventListener('DOMContentLoaded', async function () {
  console.log("App initialized");

  recordVisit();

  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session?.user) return;

  const { data: userProfile, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  if (userProfile?.active) {
    currentUser = userProfile;
    bootApp();
  }
});
setInterval(async function() {
  if (!currentUser || !window.CAN_ADMIN?.includes(currentUser.role)) return;

  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  if (!users) return;

  const pendingCount = users.filter(u => u.pending).length;

  // First run setup
  if (window._lastPendingCount === undefined) {
    window._lastPendingCount = pendingCount;
    return;
  }

  // ✅ ONLY run when it changes
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
