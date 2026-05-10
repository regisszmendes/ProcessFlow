// =========================
// GLOBAL CURRENT USER
// =========================
// ✅ CRITICAL: currentUser is stored on window.currentUser
// This makes it accessible across all JS files

// =========================
// HELPERS
// =========================
function showError(el, message) {
  el.textContent = message;
  el.style.display = 'block';
}

function clearMessages(...elements) {
  elements.forEach(el => el.style.display = 'none');
}

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

  // ✅ VALIDATION FIRST
  if (!email || !pass) {
    showError(err, 'Please enter both email and password.');
    return;
  }

  // loading state
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    // ✅ ATTEMPT LOGIN
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data?.user) {
      console.error('Login error:', error);
      showError(err, 'Invalid email or password.');
      return;
    }

    // ✅ FETCH USER PROFILE FROM DATABASE
    const { data: userProfile, error: profileError } = await window.supabaseClient
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error:', profileError);
      showError(err, 'User profile not found. Please contact support.');
      return;
    }

    // ✅ CHECK IF ACCOUNT IS ACTIVE
    if (!userProfile.active) {
      showError(err, 'Your account has been disabled. Please contact support.');
      return;
    }

    // ✅ SUCCESS - SET CURRENT USER AND BOOT APP
    window.currentUser = userProfile;
    console.log('✅ Login successful:', userProfile);
    bootApp();

  } catch (e) {
    console.error('Unexpected login error:', e);
    showError(err, 'Unexpected error during login. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
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
    showError(err, 'All fields are required.');
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
      console.error('Signup error:', signUpError);
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
      role: 'viewer',  // ✅ Changed default role to 'viewer' for security
      active: true,
    };

    // ✅ USING INSERT INSTEAD OF UPSERT
    const { error: insertError } = await window.supabaseClient
      .from('users')
      .insert([newUser]);

    if (insertError) {
      console.error('User insert error:', insertError);
      showError(err, 'Error creating user profile: ' + insertError.message);
      return;
    }

    console.log('✅ User created in database:', newUser);

    // =========================
    // EMAIL CONFIRMATION FLOW
    // =========================
    if (!data.session) {
      ok.textContent = 'Check your email to confirm your account, then sign in.';
      ok.style.display = 'block';
      
      // Clear form
      nameInput.value = '';
      emailInput.value = '';
      passInput.value = '';
      pass2Input.value = '';
      
      return;
    }

    // =========================
    // AUTO LOGIN (if email confirmation disabled)
    // =========================
    window.currentUser = newUser;

    ok.textContent = 'Account created successfully! Logging you in...';
    ok.style.display = 'block';

    setTimeout(() => {
      bootApp();
    }, 1000);

  } catch (e) {
    console.error('Unexpected registration error:', e);
    showError(err, 'Unexpected error during registration.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
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

  window.currentUser = null;

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
// SESSION AUTO-RESTORE (ONLY ON PAGE LOAD)
// =========================
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Checking for existing session...');
  
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session?.user) {
      console.log('❌ No active session found');
      return;
    }

    console.log('✅ Active session found, fetching user profile...');

    const { data: userProfile, error } = await window.supabaseClient
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Session restore error:', error);
      return;
    }

    if (!userProfile) {
      console.error('User profile not found for session');
      return;
    }

    if (!userProfile.active) {
      console.log('Account is inactive, showing login screen');
      await window.supabaseClient.auth.signOut();
      return;
    }

    console.log('✅ Session restored for user:', userProfile.name);
    window.currentUser = userProfile;
    bootApp();

  } catch (e) {
    console.error('Unexpected session restore error:', e);
  }
});
