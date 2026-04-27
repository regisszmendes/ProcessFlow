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

