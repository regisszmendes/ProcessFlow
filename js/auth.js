// =========================
// LOGIN
// =========================
window.doLogin = async function () {
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass = document.getElementById('li-pass').value;
  const err = document.getElementById('login-err');

  err.style.display = 'none';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: pass
  });

  if (error) {
    console.error(error);
    err.textContent = 'Invalid email or password.';
    err.style.display = 'block';
    return;
  }

  // Fetch user profile from DB
  const { data: userProfile, error: profileError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !userProfile) {
    err.textContent = 'User profile not found.';
    err.style.display = 'block';
    return;
  }

  if (!userProfile.active) {
    err.textContent = 'Your account has been disabled.';
    err.style.display = 'block';
    return;
  }

  currentUser = userProfile;

  bootApp();
};


// =========================
// REGISTER
// =========================
window.doRegister = async function () {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;

  const err = document.getElementById('reg-err');
  const ok = document.getElementById('reg-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation
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

  // Create Auth user
  const { data, error: signUpError } = await supabaseClient.auth.signUp({
    email,
    password: pass
  });

  if (signUpError) {
    console.error(signUpError);
    err.textContent = signUpError.message;
    err.style.display = 'block';
    return;
  }

  // Create profile (NO PASSWORD HERE)
  const newUser = {
    id: data.user.id,
    name,
    email,
    role: 'manager',
    active: true,
    created: new Date().toISOString()
  };

  const { error: insertError } = await supabaseClient
    .from('users')
    .insert([newUser]);

  if (insertError) {
    console.error(insertError);
    err.textContent = 'Error creating user profile.';
    err.style.display = 'block';
    return;
  }

  currentUser = newUser;

  ok.textContent = 'Account created successfully!';
  ok.style.display = 'block';

  bootApp();
};


// =========================
// LOGOUT
// =========================
window.doLogout = async function () {
  await supabaseClient.auth.signOut();

  currentUser = null;

  // Hide app
  document.getElementById('main-app').classList.remove('visible');
  document.getElementById('main-header').style.display = 'none';

  // Show login
  document.getElementById('login-screen').style.display = 'flex';

  // Reset forms
  document.getElementById('li-email').value = '';
  document.getElementById('li-pass').value = '';

  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pass').value = '';
  document.getElementById('reg-pass2').value = '';

  // Hide messages
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('reg-err').style.display = 'none';
  document.getElementById('reg-ok').style.display = 'none';
};


// =========================
// TAB SWITCH
// =========================
window.switchLoginTab = function (tab, btn) {
  document.querySelectorAll('.login-tab')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');

  document.getElementById('tab-login').style.display =
    tab === 'login' ? 'block' : 'none';

  document.getElementById('tab-register').style.display =
    tab === 'register' ? 'block' : 'none';
};


// =========================
// SESSION AUTO-RESTORE
// =========================
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userProfile && userProfile.active) {
      currentUser = userProfile;
      bootApp();
    }
  }
});
