window.addEventListener('DOMContentLoaded', function () {
  console.log("App initialized");

  const sessionId = sessionStorage.getItem('pf_session');

  if (!sessionId) return;

  // For now (localStorage version)
  const users = JSON.parse(localStorage.getItem('pf_users') || '[]');

  const u = users.find(x => x.id === sessionId);

  if (u && u.active) {
    currentUser = u;
    bootApp();
  }
});
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

  recordVisit(); // ✅ now it runs

  const sessionId = sessionStorage.getItem('pf_session');

  if (!sessionId) return;

  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('id', sessionId);

  if (error) {
    console.error(error);
    return;
  }

  const u = users[0];

  if (u && u.active) {
    currentUser = u;
    bootApp();
  }
});
