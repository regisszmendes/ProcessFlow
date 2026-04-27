// =========================
// HELPERS
// =========================
function showError(el, message) {
  el.textContent = message;
  el.style.display = 'block';
}//

function clearMessages(...elements) {
  elements.forEach(el => el.style.display = 'none');
}//
// =========================
// LOGIN
// =========================
window.doLogin = async function () {
  const emailInput = document.getElementById('li-email');
  const passInput = document.getElementById('li-pass');
  const err = document.getElementById('login-err');
  const btn = document.getElementById('login-btn');

  const email = emailInput.value.trim().toLowerCase();
  const pass = passInput.value;

  clearMessages(err);

  // loading state
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data?.user) {
      console.error(error);
      showError(err, 'Invalid email or password.');
      return;
    }

    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error(profileError);
      showError(err, 'User profile not found.');
      return;
    }

    if (!userProfile.active) {
      showError(err, 'Your account has been disabled.');
      return;
    }

    currentUser = userProfile;
    bootApp();

  } catch (e) {
    console.error(e);
    showError(err, 'Unexpected error during login.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
};


// =========================
// REGISTER
// =========================
window.doRegister = async function () {
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passInput = document.getElementById('reg-pass');
  const pass2Input = document.getElementById('reg-pass2');

  const err = document.getElementById('reg-err');
  const ok = document.getElementById('reg-ok');
  const btn = document.getElementById('register-btn');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const pass = passInput.value;
  const pass2 = pass2Input.value;

  clearMessages(err, ok);

  // =========================
  // VALIDATION
  // =========================
  if (!name || !email || !pass) {
    showError(err, 'All fields required.');
    return;
  }

  if (pass.length < 6) {
    showError(err, 'Password must be at least 6 characters.');
    return;
  }

  if (pass !== pass2) {
    showError(err, 'Passwords do not match.');
    return;
  }

  // =========================
  // LOADING STATE
  // =========================
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    // =========================
    // CREATE AUTH USER
    // =========================
    const { data, error: signUpError } = await window.supabaseClient.auth.signUp({
      email,
      password: pass
    });

    if (signUpError || !data?.user) {
      console.error(signUpError);
      showError(err, signUpError?.message || 'Error creating account.');
      return;
    }

    // =========================
    // CREATE USER PROFILE (DB)
    // =========================
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
      .upsert([newUser]);

    if (insertError) {
      console.error(insertError);
      showError(err, 'Error creating user profile.');
      return;
    }

    // =========================
    // EMAIL CONFIRMATION FLOW
    // =========================
    if (!data.session) {
      ok.textContent = 'Check your email to confirm your account.';
      ok.style.display = 'block';
      return;
    }

    // =========================
    // AUTO LOGIN
    // =========================
    currentUser = newUser;

    ok.textContent = 'Account created successfully!';
    ok.style.display = 'block';

    bootApp();

  } catch (e) {
    console.error(e);
    showError(err, 'Unexpected error during registration.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register';
  }
};
// =========================
// LOGOUT
// =========================
window.doLogout = async function () {
  try {
    await window.supabaseClient.auth.signOut();
  } catch (e) {
    console.error('Logout error:', e);
  }

  currentUser = null;

  document.getElementById('main-app').classList.remove('visible');
  document.getElementById('main-header').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';

  // reset forms
  document.getElementById('li-email').value = '';
  document.getElementById('li-pass').value = '';

  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pass').value = '';
  document.getElementById('reg-pass2').value = '';

  // hide messages
  clearMessages(
    document.getElementById('login-err'),
    document.getElementById('reg-err'),
    document.getElementById('reg-ok')
  );
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
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session?.user) return;

    const { data: userProfile, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Session restore error:', error);
      return;
    }

    if (userProfile?.active) {
      currentUser = userProfile;
      bootApp();
    }

  } catch (e) {
    console.error('Unexpected session restore error:', e);
  }
});
