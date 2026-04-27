window.doLogin = async function() {
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass  = document.getElementById('li-pass').value;
  const err   = document.getElementById('login-err');

  err.style.display = 'none';

  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', pass);

  if (error) {
    console.error(error);
    err.textContent = 'Error logging in';
    err.style.display = 'block';
    return;
  }

  const u = users[0];

  if (!u) {
    err.textContent = 'Invalid email or password.';
    err.style.display = 'block';
    return;
  }

  if (!u.active) {
    err.textContent = 'Your account has been disabled.';
    err.style.display = 'block';
    return;
  }

  currentUser = u;
  sessionStorage.setItem('pf_session', u.id);

  bootApp();
};
window.doRegister = async function() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const err   = document.getElementById('reg-err');
  const ok    = document.getElementById('reg-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  if (!name || !email || !pass) {
    err.textContent = 'All fields required.';
    err.style.display = 'block';
    return;
  }

  if (pass.length < 6) {
    err.textContent = 'Password must be at least 6 characters.';
    err.style.display = 'block';
    return;
  }

  if (pass !== pass2) {
    err.textContent = 'Passwords do not match.';
    err.style.display = 'block';
    return;
  }

  // 🔍 Check if user already exists in Supabase
  const { data: existingUsers, error: checkError } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('email', email);

  if (checkError) {
    console.error(checkError);
    err.textContent = 'Error checking user';
    err.style.display = 'block';
    return;
  }

  if (existingUsers.length > 0) {
    err.textContent = 'This email is already registered.';
    err.style.display = 'block';
    return;
  }

  // 🆕 Create user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: pass,
    role: 'manager',
    active: true,
    pending: false,
    created: new Date().toLocaleDateString()
  };

  const { error } = await window.supabaseClient
    .from('users')
    .insert([newUser]);

  if (error) {
    console.error(error);
    err.textContent = 'Error creating user';
    err.style.display = 'block';
    return;
  }

  // ✅ Auto login
  currentUser = newUser;
  sessionStorage.setItem('pf_session', newUser.id);

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
window.switchLoginTab = function(tab, btn) {
  document.querySelectorAll('.login-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('tab-login').style.display =
    tab === 'login' ? 'block' : 'none';

  document.getElementById('tab-register').style.display =
    tab === 'register' ? 'block' : 'none';
};
