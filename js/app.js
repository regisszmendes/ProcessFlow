// Make bootApp available globally
window.bootApp = async function () {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('main-app').classList.add('visible');

  // Set user info in header
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const av = document.getElementById('hdr-avatar');
  av.textContent = initials;
  av.style.background = getRoleColor(currentUser.role);

  document.getElementById('hdr-name').textContent = currentUser.name;
  const rb = document.getElementById('hdr-role');
  rb.textContent = currentUser.role;
  rb.style.background = getRoleBg(currentUser.role);
  rb.style.color = getRoleColor(currentUser.role);

  // Show config nav for admins
  if (CAN_ADMIN.includes(currentUser.role)) {
    document.getElementById('nav-config').style.display = 'inline-flex';
  }

  // Load all data
  await loadAllData();

  // Show first section
  showSection('register', document.querySelector('.nav-btn'));
};

let currentUser = null;
let processes = [];
let companies = [];
// ... rest of your app.js code
let currentUser = null;
window.CAN_EDIT = ['editor', 'manager', 'admin'];        
window.CAN_ADMIN = ['admin'];                             
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
