window.doLogin = function() {
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass  = document.getElementById('li-pass').value;
  const err   = document.getElementById('login-err');
  err.style.display = 'none';
  users = JSON.parse(localStorage.getItem('pf_users') || '[]');
  const u = users.find(x => x.email===email && x.password===pass);
  if (!u)       { err.textContent='Invalid email or password.'; err.style.display='block'; return; }
  if (!u.active){ err.textContent='Your account has been disabled. Contact an administrator.'; err.style.display='block'; return; }
  currentUser = u; sessionStorage.setItem('pf_session', u.id); bootApp();
}
