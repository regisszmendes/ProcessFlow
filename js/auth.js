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
window.doRegister = function() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const err   = document.getElementById('reg-err');
  const ok    = document.getElementById('reg-ok');
  err.style.display='none'; ok.style.display='none';
  if (!name||!email||!pass){ err.textContent='All fields required.'; err.style.display='block'; return; }
  if (pass.length<6)       { err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return; }
  if (pass!==pass2)        { err.textContent='Passwords do not match.'; err.style.display='block'; return; }
  // Re-read from storage to get the freshest list before duplicate check
  users = JSON.parse(localStorage.getItem('pf_users') || '[]');
  const existing = users.find(u => u.email===email);
  if (existing && existing.active){
    err.textContent='This email is already registered. Please sign in.';
    err.style.display='block'; return;
 }
users.push({
  id: Date.now().toString(),
  name,
  email,
  password: pass,
  role: 'manager',
  active: true,
  pending: false,
  created: new Date().toLocaleDateString()
});

localStorage.setItem('pf_users', JSON.stringify(users));

// ✅ auto login (same behavior as before)
currentUser = users[users.length - 1];
sessionStorage.setItem('pf_session', currentUser.id);

bootApp();
}
window.doLogout = function() {
  // 1. Clear session
  currentUser = null;
  sessionStorage.removeItem('pf_session');

  // 2. Hide app
  document.getElementById('main-app').classList.remove('visible');
  document.getElementById('main-header').style.display = 'none';

  // 3. Show login screen
  document.getElementById('login-screen').style.display = 'flex';

  // 4. Reset forms (THIS is what you're missing)
  document.getElementById('li-email').value = '';
  document.getElementById('li-pass').value = '';

  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pass').value = '';
  document.getElementById('reg-pass2').value = '';

  // 5. Hide messages
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('reg-err').style.display = 'none';
  document.getElementById('reg-ok').style.display = 'none';
};
