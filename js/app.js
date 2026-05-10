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

// ✅ CRITICAL: currentUser is stored on window object (set in auth.js)
// Don't declare it here as a local variable!

window.CAN_EDIT = ['editor', 'manager', 'admin'];
window.CAN_DELETE = ['manager', 'admin'];
window.CAN_AI = ['manager', 'admin'];
window.CAN_ADMIN = ['admin'];

// ===========================================================
// BOOT APP - MUST BE FIRST AND GLOBAL
// ===========================================================
window.bootApp = async function () {
  console.log('🚀 bootApp called with user:', window.currentUser);
  
  if (!window.currentUser) {
    console.error('❌ Cannot boot app: no current user');
    return;
  }
  
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('main-app').classList.add('visible');

  // Set user info in header
  const initials = window.currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const av = document.getElementById('hdr-avatar');
  av.textContent = initials;
  av.style.background = getRoleColor(window.currentUser.role);

  document.getElementById('hdr-name').textContent = window.currentUser.name;
  const rb = document.getElementById('hdr-role');
  rb.textContent = window.currentUser.role;
  rb.style.background = getRoleBg(window.currentUser.role);
  rb.style.color = getRoleColor(window.currentUser.role);

  // ✅ SHOW CONFIG NAV FOR ADMINS - IMPROVED LOGIC
  const configNav = document.getElementById('nav-config');
  if (configNav && window.CAN_ADMIN.includes(window.currentUser.role)) {
    console.log('✅ Showing config nav for admin user');
    configNav.style.display = 'inline-flex';
  } else {
    console.log('⚠️ Config nav hidden - user role:', window.currentUser.role);
    if (configNav) {
      configNav.style.display = 'none';
    }
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
  
  // ✅ If opening config section, show business pane by default
  if (id === 'config') {
    switchConfigTab('biz', document.getElementById('ctab-biz'));
  }
};

// =========================
// CONFIG SUB-TABS
// =========================
window.switchConfigTab = function (tab, btn) {
  // Remove active class from all config tab buttons
  document.querySelectorAll('.graph-tab').forEach(b => b.classList.remove('active'));
  
  // Add active class to clicked button
  if (btn) btn.classList.add('active');
  
  // Hide all config panes
  const panes = ['config-pane-biz', 'config-pane-users', 'config-pane-analytics', 'config-pane-integration'];
  panes.forEach(paneId => {
    const pane = document.getElementById(paneId);
    if (pane) pane.style.display = 'none';
  });
  
  // Show selected pane
  const selectedPane = document.getElementById('config-pane-' + tab);
  if (selectedPane) {
    selectedPane.style.display = 'flex';
  }
  
  // ✅ Load specific data when tabs are opened
  if (tab === 'biz' && typeof renderCompanyTable === 'function') {
    renderCompanyTable();
  }
  
  if (tab === 'users' && typeof renderUserTable === 'function') {
    renderUserTable();
  }
  
  if (tab === 'analytics' && typeof renderAnalytics === 'function') {
    renderAnalytics();
  }
  
  if (tab === 'integration' && typeof loadIntegrationSettings === 'function') {
    loadIntegrationSettings();
  }
};

// =========================
// APP INIT
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
  if (!window.currentUser || !window.CAN_ADMIN?.includes(window.currentUser.role)) return;

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
// ===========================================================
// MISSING EDIT & DELETE FUNCTIONS
// ===========================================================
// Add this to the END of your app.js file

// ===== PROCESS EDIT MODAL =====
window.openEditProcModal = function(id) {
  const proc = processes.find(p => p.id === id);
  if (!proc) return;
  
  document.getElementById('epm-internal-id').value = id;
  document.getElementById('epm-proc-id-label').textContent = proc.proc_id;
  document.getElementById('epm-proc-id').value = proc.proc_id;
  document.getElementById('epm-name').value = proc.name;
  document.getElementById('epm-dept').value = proc.department || '';
  document.getElementById('epm-owner').value = proc.owner || '';
  document.getElementById('epm-version').value = proc.version || '';
  document.getElementById('epm-status').value = proc.status;
  document.getElementById('epm-priority').value = proc.priority;
  document.getElementById('epm-type').value = proc.type;
  document.getElementById('epm-start').value = proc.start_date || '';
  document.getElementById('epm-end').value = proc.end_date || '';
  document.getElementById('epm-duration').value = proc.duration || '';
  document.getElementById('epm-frequency').value = proc.frequency || '';
  document.getElementById('epm-desc').value = proc.description || '';
  document.getElementById('epm-input').value = proc.input || '';
  document.getElementById('epm-output').value = proc.output || '';
  document.getElementById('epm-stakeholders').value = proc.stakeholders || '';
  document.getElementById('epm-tools').value = proc.tools || '';
  document.getElementById('epm-kpis').value = proc.kpis || '';
  document.getElementById('epm-risks').value = proc.risks || '';
  
  document.getElementById('edit-proc-modal').style.display = 'flex';
};

window.closeEditProcModal = function() {
  document.getElementById('edit-proc-modal').style.display = 'none';
};

window.applyEditProcess = async function() {
  const id = parseInt(document.getElementById('epm-internal-id').value);
  
  const updates = {
    proc_id: document.getElementById('epm-proc-id').value.trim(),
    name: document.getElementById('epm-name').value.trim(),
    department: document.getElementById('epm-dept').value.trim(),
    owner: document.getElementById('epm-owner').value.trim(),
    version: document.getElementById('epm-version').value.trim(),
    status: document.getElementById('epm-status').value,
    priority: document.getElementById('epm-priority').value,
    type: document.getElementById('epm-type').value,
    start_date: document.getElementById('epm-start').value || null,
    end_date: document.getElementById('epm-end').value || null,
    duration: document.getElementById('epm-duration').value.trim(),
    frequency: document.getElementById('epm-frequency').value,
    description: document.getElementById('epm-desc').value.trim(),
    input: document.getElementById('epm-input').value.trim(),
    output: document.getElementById('epm-output').value.trim(),
    stakeholders: document.getElementById('epm-stakeholders').value.trim(),
    tools: document.getElementById('epm-tools').value.trim(),
    kpis: document.getElementById('epm-kpis').value.trim(),
    risks: document.getElementById('epm-risks').value.trim(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await window.supabaseClient
    .from('processes')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    alert('Error updating process: ' + error.message);
    return;
  }
  
  alert('✓ Process updated successfully!');
  closeEditProcModal();
  await loadProcesses();
  renderProcessTable();
};

// ===== STEP FUNCTIONS =====
window.deleteStep = async function(id) {
  if (!confirm('Delete this step?')) return;
  
  const { error } = await window.supabaseClient
    .from('steps')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Step deleted');
  await loadSteps();
  renderSteps();
};

// ===== GAP FUNCTIONS =====
window.deleteGap = async function(id) {
  if (!confirm('Delete this gap?')) return;
  
  const { error } = await window.supabaseClient
    .from('gaps')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Gap deleted');
  await loadGaps();
  renderGaps();
};

// ===== METRIC FUNCTIONS =====
window.deleteMetric = async function(id) {
  if (!confirm('Delete this metric?')) return;
  
  const { error } = await window.supabaseClient
    .from('metrics')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Metric deleted');
  await loadMetrics();
  renderMetrics();
};

// ===== TASK FUNCTIONS =====
window.deleteTask = async function(id) {
  if (!confirm('Delete this task?')) return;
  
  const { error } = await window.supabaseClient
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Task deleted');
  await loadTasks();
  renderTasks();
  renderKanban();
};

// ===== CHANGE ENTRY FUNCTIONS =====
window.deleteChangeEntry = async function(id) {
  if (!confirm('Delete this assessment?')) return;
  
  const { error } = await window.supabaseClient
    .from('change_entries')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Assessment deleted');
  await loadChangeEntries();
  renderChangeEntries();
};

// ===== FEEDBACK FUNCTIONS =====
window.deleteFeedback = async function(id) {
  if (!CAN_ADMIN.includes(currentUser?.role)) {
    alert('Only admins can delete feedback');
    return;
  }
  
  if (!confirm('Delete this feedback?')) return;
  
  const { error } = await window.supabaseClient
    .from('feedbacks')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Feedback deleted');
  await loadFeedback();
  renderFeedback();
};

// ===== LOAD FUNCTIONS (if missing) =====
window.loadSteps = async function() {
  const { data } = await window.supabaseClient
    .from('steps')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.steps = data || [];
};

window.loadGaps = async function() {
  const { data } = await window.supabaseClient
    .from('gaps')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.gaps = data || [];
};

window.loadMetrics = async function() {
  const { data } = await window.supabaseClient
    .from('metrics')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.metrics = data || [];
};

window.loadTasks = async function() {
  const { data } = await window.supabaseClient
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.tasks = data || [];
};

window.loadChangeEntries = async function() {
  const { data } = await window.supabaseClient
    .from('change_entries')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.changeEntries = data || [];
};

window.loadFeedback = async function() {
  const { data } = await window.supabaseClient
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });
  
  window.feedbacks = data || [];
};

console.log('✅ Edit & Delete functions loaded');
