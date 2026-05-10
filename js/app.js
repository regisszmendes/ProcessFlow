// ===========================================================
// GLOBAL VARIABLES
// ===========================================================
window.processes = window.processes || [];
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
// BOOT APP
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

  const initials = window.currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const av = document.getElementById('hdr-avatar');
  av.textContent = initials;
  av.style.background = getRoleColor(window.currentUser.role);

  document.getElementById('hdr-name').textContent = window.currentUser.name;
  const rb = document.getElementById('hdr-role');
  rb.textContent = window.currentUser.role;
  rb.style.background = getRoleBg(window.currentUser.role);
  rb.style.color = getRoleColor(window.currentUser.role);

  const configNav = document.getElementById('nav-config');
  if (configNav && window.CAN_ADMIN.includes(window.currentUser.role)) {
    configNav.style.display = 'inline-flex';
  }

  await loadAllData();
  showSection('register', document.querySelector('.nav-btn'));
};

function recordVisit() {
  const visits = JSON.parse(localStorage.getItem('pf_visits') || '[]');
  visits.push({ timestamp: new Date().toISOString() });
  localStorage.setItem('pf_visits', JSON.stringify(visits));
}

// ===========================================================
// LOAD ALL DATA
// ===========================================================
window.loadAllData = async function () {
  try {
    console.log('📊 Loading all data...');
    
    const { data: companiesData, error: compError } = await window.supabaseClient
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (compError) console.error('Error loading companies:', compError);
    companies = companiesData || [];

    const { data: processesData, error: procError } = await window.supabaseClient
      .from('processes')
      .select(`*,companies(id,biz_id,name)`)
      .order('created_at', { ascending: false });
    
    if (procError) console.error('Error loading processes:', procError);
    processes = processesData || [];

    const { data: stepsData } = await window.supabaseClient.from('steps').select('*').order('created_at', { ascending: false });
    steps = stepsData || [];

    const { data: metricsData } = await window.supabaseClient.from('metrics').select('*').order('created_at', { ascending: false });
    metrics = metricsData || [];

    const { data: gapsData } = await window.supabaseClient.from('gaps').select('*').order('created_at', { ascending: false });
    gaps = gapsData || [];

    const { data: projectsData } = await window.supabaseClient.from('projects').select('*').order('created_at', { ascending: false });
    projects = projectsData || [];

    const { data: tasksData } = await window.supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
    tasks = tasksData || [];

    const { data: changeData } = await window.supabaseClient.from('change_entries').select('*').order('created_at', { ascending: false });
    changeEntries = changeData || [];

    populateCompanyDropdowns();
    populateProcessDropdowns();
    if (typeof populateChangeDropdowns === 'function') populateChangeDropdowns();

    if (typeof renderProcessTable === 'function') {
      renderProcessTable();
      if (processes.length > 0) {
        const tableCard = document.getElementById('process-table-card');
        if (tableCard) tableCard.style.display = 'block';
      }
    }
    
    if (typeof renderCompanyTable === 'function') renderCompanyTable();

    console.log('✅ All data loaded');

  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
};

function getRoleColor(role) {
  const colors = { viewer: '#6b7280', editor: '#0088ff', manager: '#00d4aa', admin: '#a855f7' };
  return colors[role] || '#6b7280';
}

function getRoleBg(role) {
  const bgs = { viewer: 'rgba(107,114,128,.15)', editor: 'rgba(0,136,255,.15)', manager: 'rgba(0,212,170,.15)', admin: 'rgba(168,85,247,.15)' };
  return bgs[role] || 'rgba(107,114,128,.15)';
}

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

window.showSection = function (id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'change' && typeof renderChangeEntries === 'function') renderChangeEntries();
  if (id === 'config') switchConfigTab('biz', document.getElementById('ctab-biz'));
};

window.switchConfigTab = function (tab, btn) {
  document.querySelectorAll('.graph-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panes = ['config-pane-biz', 'config-pane-users', 'config-pane-analytics', 'config-pane-integration'];
  panes.forEach(paneId => {
    const pane = document.getElementById(paneId);
    if (pane) pane.style.display = 'none';
  });
  const selectedPane = document.getElementById('config-pane-' + tab);
  if (selectedPane) selectedPane.style.display = 'flex';
  if (tab === 'biz' && typeof renderCompanyTable === 'function') renderCompanyTable();
  if (tab === 'users' && typeof renderUserTable === 'function') renderUserTable();
  if (tab === 'analytics' && typeof renderAnalytics === 'function') renderAnalytics();
  if (tab === 'integration' && typeof loadIntegrationSettings === 'function') loadIntegrationSettings();
};

window.addEventListener('DOMContentLoaded', async function () {
  console.log('🎬 DOM loaded');
  recordVisit();
});

setInterval(async function () {
  if (!window.currentUser || !window.CAN_ADMIN?.includes(window.currentUser.role)) return;
  const { data: users } = await window.supabaseClient.from('users').select('*');
  if (!users) return;
  const pendingCount = users.filter(u => u.pending).length;
  if (window._lastPendingCount === undefined) {
    window._lastPendingCount = pendingCount;
    return;
  }
  if (window._lastPendingCount !== pendingCount) {
    window._lastPendingCount = pendingCount;
    if (typeof syncUsers === 'function') syncUsers();
    if (typeof renderUserTable === 'function' && document.getElementById('section-config')?.classList.contains('active')) renderUserTable();
  }
}, 4000);

// ===========================================================
// EDIT MODAL FOR PROCESS (from process.js)
// ===========================================================
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
  const { error } = await window.supabaseClient.from('processes').update(updates).eq('id', id);
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  alert('✓ Updated!');
  closeEditProcModal();
  await loadAllData();
};

console.log('✅ app.js loaded');
