// ===========================================================
// GLOBAL VARIABLES
// ===========================================================
let processes = [];
let companies = [];
let steps = [];
let metrics = [];
let gaps = [];
let projects = [];
let tasks = [];
let feedbacks = [];
let changeEntries = [];
let currentRAG = null;

window.CAN_EDIT = ['editor', 'manager', 'admin'];
window.CAN_DELETE = ['manager', 'admin'];
window.CAN_AI = ['manager', 'admin'];
window.CAN_ADMIN = ['admin'];

// ===========================================================
// BOOT APP - MUST BE FIRST AND GLOBAL
// ===========================================================
window.bootApp = async function () {
  console.log('🚀 bootApp called with user:', currentUser);
  
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
  if (window.CAN_ADMIN.includes(currentUser.role)) {
    document.getElementById('nav-config').style.display = 'inline-flex';
  }

  // Load all data
  await loadAllData();

  // Show first section
  showSection('register', document.querySelector('.nav-btn'));
};

// =========================
// VISIT LOGGER
// =========================
function recordVisit() {
  const visits = JSON.parse(localStorage.getItem('pf_visits') || '[]');
  visits.push({ timestamp: new Date().toISOString() });
  localStorage.setItem('pf_visits', JSON.stringify(visits));
}

// =========================
// LOAD ALL DATA
// =========================
window.loadAllData = async function () {
  try {
    console.log('📊 Loading all data...');
    
    // Load companies
    const { data: companiesData, error: compError } = await window.supabaseClient
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (compError) console.error('Error loading companies:', compError);
    companies = companiesData || [];
    console.log('✅ Loaded companies:', companies.length);

    // Load processes with company data
    const { data: processesData, error: procError } = await window.supabaseClient
      .from('processes')
      .select(`
        *,
        companies (
          id,
          biz_id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (procError) console.error('Error loading processes:', procError);
    processes = processesData || [];
    console.log('✅ Loaded processes:', processes.length);

    // Load steps
    const { data: stepsData, error: stepsError } = await window.supabaseClient
      .from('steps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (stepsError) console.error('Error loading steps:', stepsError);
    steps = stepsData || [];

    // Load metrics
    const { data: metricsData, error: metricsError } = await window.supabaseClient
      .from('metrics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (metricsError) console.error('Error loading metrics:', metricsError);
    metrics = metricsData || [];

    // Load gaps
    const { data: gapsData, error: gapsError } = await window.supabaseClient
      .from('gaps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (gapsError) console.error('Error loading gaps:', gapsError);
    gaps = gapsData || [];

    // Load projects
    const { data: projectsData, error: projError } = await window.supabaseClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (projError) console.error('Error loading projects:', projError);
    projects = projectsData || [];

    // Load tasks
    const { data: tasksData, error: tasksError } = await window.supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tasksError) console.error('Error loading tasks:', tasksError);
    tasks = tasksData || [];

    // Load change entries
    const { data: changeData, error: changeError } = await window.supabaseClient
      .from('change_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (changeError) console.error('Error loading change entries:', changeError);
    changeEntries = changeData || [];

    // Populate dropdowns
    populateCompanyDropdowns();
    populateProcessDropdowns();
    if (typeof populateChangeDropdowns === 'function') {
      populateChangeDropdowns();
    }

    // Render tables
    if (typeof renderProcessTable === 'function') renderProcessTable();
    if (typeof renderCompanyTable === 'function') renderCompanyTable();

    console.log('✅ All data loaded successfully');

  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
};

// =========================
// HELPER FUNCTIONS
// =========================
function getRoleColor(role) {
  const colors = {
    viewer: '#6b7280',
    editor: '#0088ff',
    manager: '#00d4aa',
    admin: '#a855f7'
  };
  return colors[role] || '#6b7280';
}

function getRoleBg(role) {
  const bgs = {
    viewer: 'rgba(107,114,128,.15)',
    editor: 'rgba(0,136,255,.15)',
    manager: 'rgba(0,212,170,.15)',
    admin: 'rgba(168,85,247,.15)'
  };
  return bgs[role] || 'rgba(107,114,128,.15)';
}

// =========================
// POPULATE DROPDOWNS
// =========================
window.populateCompanyDropdowns = function () {
  const opts = companies.map(c => `<option value="${c.id}">[${c.biz_id}] ${c.name}</option>`).join('');
  const none = '<option value="">— select company —</option>';

  ['proc-company-id', 'adm-company-id', 'chg-company-id', 'change-filter-company'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    el.innerHTML = none + opts;
    el.value = val;
  });
};

window.populateProcessDropdowns = function () {
  const opts = processes.map(p => {
    const co = p.companies;
    const prefix = co ? `[${co.biz_id}] ` : '';
    return `<option value="${p.id}">${prefix}[${p.proc_id}] ${p.name}</option>`;
  }).join('');

  const none = '<option value="">— select process —</option>';
  const anyP = '<option value="">All Processes</option>';

  ['step-proc-id', 'metric-proc-id', 'proj-proc-id', 'gap-proc-id', 'ai-proc-id', 'chg-proc-id'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    el.innerHTML = none + opts;
    el.value = val;
  });

  ['step-filter-proc', 'metric-filter-proc', 'diagram-filter-proc', 'change-filter-process'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = el.value;
    el.innerHTML = anyP + opts;
    el.value = val;
  });
};

// =========================
// NAVIGATION
// =========================
window.showSection = function (id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');

  // Section-specific loading
  if (id === 'change' && typeof renderChangeEntries === 'function') {
    renderChangeEntries();
  }
};

// =========================
// APP INIT - DO NOT DUPLICATE SESSION RESTORE
// =========================
window.addEventListener('DOMContentLoaded', async function () {
  console.log('🎬 DOM loaded, recording visit');
  recordVisit();
  
  // Session restore is handled in auth.js
  // We don't duplicate it here
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

    if (typeof syncUsers === 'function') syncUsers();
    if (typeof refreshConfigNavBadge === 'function') refreshConfigNavBadge();
    if (typeof renderPendingBanner === 'function') renderPendingBanner();

    if (document.getElementById('section-config')?.classList.contains('active')) {
      if (typeof renderUserTable === 'function') renderUserTable();
    }
  }
}, 4000);

console.log('✅ app.js loaded');
