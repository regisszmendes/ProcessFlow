window.doLogin = function() {
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass  = document.getElementById('li-pass').value;
  const err   = document.getElementById('login-err');
  err.style.display = 'none';
  users = JSON.parse(localStorage.getItem('pf_users') || '[]');
  const u = users.find(x => x.email===email && x.password===pass);
  if (!u)       { err.textContent='Invalid email or password.'; err.style.display='block'; return; }
  if (!u.active){ err.textContent='Your account has been disabled. Contact an administrator.'; err.style.display='block'; return; }
  currentUser = u; sessionStorage.setItem('pf_session', u.id); bootApp();}
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
}
window.doLogout = function() {
  currentUser=null; sessionStorage.removeItem('pf_session');
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('main-header').style.display='none';
  document.getElementById('main-app').classList.remove('visible');
}
