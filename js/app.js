// ===========================================================
// GLOBAL VARIABLES
// ===========================================================
window.processes = [];
window.companies = [];
window.steps = [];
window.metrics = [];
window.gaps = [];
window.projects = [];
window.tasks = [];
window.feedbacks = [];
window.changeEntries = [];
window.currentRAG = null;

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
    window.companies = companiesData || [];

    const { data: processesData, error: procError } = await window.supabaseClient
      .from('processes')
      .select(`*,companies(id,biz_id,name)`)
      .order('created_at', { ascending: false });
    
    if (procError) console.error('Error loading processes:', procError);
    window.processes = processesData || [];

    const { data: stepsData } = await window.supabaseClient.from('steps').select('*').order('created_at', { ascending: false });
    window.steps = stepsData || [];

    const { data: metricsData } = await window.supabaseClient.from('metrics').select('*').order('created_at', { ascending: false });
    window.metrics = metricsData || [];

    const { data: gapsData } = await window.supabaseClient.from('gaps').select('*').order('created_at', { ascending: false });
    window.gaps = gapsData || [];

    const { data: projectsData } = await window.supabaseClient.from('projects').select('*').order('created_at', { ascending: false });
    window.projects = projectsData || [];

    const { data: tasksData } = await window.supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
    window.tasks = tasksData || [];

    const { data: changeData } = await window.supabaseClient.from('change_entries').select('*').order('created_at', { ascending: false });
    window.changeEntries = changeData || [];

    // Load improvement plans and KPIs for monitoring
    const { data: plansData } = await window.supabaseClient
      .from('improvement_plans')
      .select('*')
      .order('generated_at', { ascending: false });
    window.improvement_plans = plansData || [];

    const { data: kpisData } = await window.supabaseClient
      .from('plan_kpis')
      .select('*');
    window.plan_kpis = kpisData || [];

    populateCompanyDropdowns();
    populateProcessDropdowns();
    if (typeof populateChangeDropdowns === 'function') populateChangeDropdowns();

    if (typeof renderProcessTable === 'function') {
      renderProcessTable();
      if (window.processes.length > 0) {
        const tableCard = document.getElementById('process-table-card');
        if (tableCard) tableCard.style.display = 'block';
      }
    }
    
    if (typeof renderCompanyTable === 'function') renderCompanyTable();
    if (typeof renderStepsTable === 'function') renderStepsTable();
    if (typeof renderGapsTable === 'function') renderGapsTable();
    if (typeof renderMetricsTable === 'function') renderMetricsTable();
    if (typeof populateProcessDropdowns === 'function') populateProcessDropdowns();
    if (typeof populateCompanyDropdowns === 'function') populateCompanyDropdowns();
    if (typeof renderMonitoringDashboard === 'function') renderMonitoringDashboard();
    
    // Refresh metrics dropdowns
    if (typeof refreshMetricProcessDropdown === 'function') refreshMetricProcessDropdown();
    
    // Refresh AI dropdowns
    if (typeof refreshAIProcessDropdown === 'function') refreshAIProcessDropdown();
    
    // Refresh gaps dropdowns
    if (typeof refreshGapProcessDropdown === 'function') refreshGapProcessDropdown();

    console.log('✅ All data loaded');
    console.log('  - Improvement Plans:', window.improvement_plans?.length || 0);

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
  const opts = window.companies.map(c => `<option value="${c.id}">[${c.biz_id}] ${c.name}</option>`).join('');
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
  const opts = window.processes.map(p => {
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
// EDIT MODAL FOR PROCESS
// ===========================================================
window.openEditProcModal = function(id) {
  const proc = window.processes.find(p => p.id === id);
  if (!proc) {
    console.error('Process not found:', id);
    return;
  }
  
  // Remove any existing modal
  const existing = document.getElementById('edit-modal-simple');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'edit-modal-simple';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:600px;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  box.innerHTML = '<h2 style="margin-bottom:1.5rem;">✏ Edit Process</h2><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Process Name *</label><input type="text" id="edit-name" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Department</label><input type="text" id="edit-dept" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Owner</label><input type="text" id="edit-owner" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Description</label><textarea id="edit-desc" rows="4" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea></div><div style="margin-top:1.5rem;"><button id="save-edit-btn" style="background:#008f74;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">✓ Save Changes</button><button id="cancel-edit-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;margin-left:10px;font-size:14px;">Cancel</button></div>';
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  // Fill form with data
  document.getElementById('edit-name').value = proc.name || '';
  document.getElementById('edit-dept').value = proc.department || '';
  document.getElementById('edit-owner').value = proc.owner || '';
  document.getElementById('edit-desc').value = proc.description || '';
  
  // Save button
  document.getElementById('save-edit-btn').onclick = async function() {
    const updates = {
      name: document.getElementById('edit-name').value.trim(),
      department: document.getElementById('edit-dept').value.trim(),
      owner: document.getElementById('edit-owner').value.trim(),
      description: document.getElementById('edit-desc').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await window.supabaseClient.from('processes').update(updates).eq('id', id);
    
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    alert('✓ Process updated successfully!');
    div.remove();
    await window.loadAllData();
  };
  
  // Cancel button
  document.getElementById('cancel-edit-btn').onclick = function() {
    div.remove();
  };
};

window.closeEditProcModal = function() {
  const modal = document.getElementById('edit-modal-simple');
  if (modal) modal.remove();
};

window.applyEditProcess = async function() {
  // Fallback for old modal if still exists
  const modal = document.getElementById('edit-modal-simple');
  if (modal) {
    document.getElementById('save-edit-btn').click();
  }
};

console.log('✅ app.js loaded');

// POPULATE PROCESS DROPDOWNS
window.populateProcessDropdowns = function() {
  // Populate proc-company-id (Process Registration form)
  const procCompanyDropdown = document.getElementById('proc-company-id');
  if (procCompanyDropdown && window.companies) {
    const opts = window.companies.map(c => 
      `<option value="${c.id}">${c.name}</option>`
    ).join('');
    procCompanyDropdown.innerHTML = '<option value="">— select company —</option>' + opts;
  }
  
  // Populate step-proc-id
  const stepProcDropdown = document.getElementById('step-proc-id');
  if (stepProcDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    stepProcDropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  }
  
  // Populate step-filter-proc
  const stepFilterDropdown = document.getElementById('step-filter-proc');
  if (stepFilterDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    stepFilterDropdown.innerHTML = '<option value="">All Processes</option>' + opts;
  }
  
  // Populate gap-proc-id
  const gapProcDropdown = document.getElementById('gap-proc-id');
  if (gapProcDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    gapProcDropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  }
  
  // Populate gap-filter-proc
  const gapFilterDropdown = document.getElementById('gap-filter-proc');
  if (gapFilterDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    gapFilterDropdown.innerHTML = '<option value="">All Processes</option>' + opts;
  }
  
  // Populate ai-proc-id (Improve section)
  const aiProcDropdown = document.getElementById('ai-proc-id');
  if (aiProcDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    aiProcDropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  }
  
  // Populate diagram-filter-proc
  const diagramProcDropdown = document.getElementById('diagram-filter-proc');
  if (diagramProcDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    diagramProcDropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  }
  
  console.log('✅ Process dropdowns populated');
};

// REFRESH DROPDOWNS ON SECTION CHANGE
window.refreshSectionDropdowns = function() {
  setTimeout(() => {
    if (typeof populateProcessDropdowns === 'function') {
      populateProcessDropdowns();
    }
    if (typeof populateCompanyDropdowns === 'function') {
      populateCompanyDropdowns();
    }
  }, 100);
};
