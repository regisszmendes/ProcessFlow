// ===========================================================
// ADMIN / CONFIG SECTION
// ===========================================================

// SAVE COMPANY
window.saveCompany = async function() {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('You need Admin role to manage companies.');
    return;
  }

  const bizId = document.getElementById('biz-id')?.value.trim();
  const name = document.getElementById('biz-name')?.value.trim();

  if (!bizId || !name) {
    alert('Company ID and Name are required.');
    return;
  }

  const companyData = {
    biz_id: bizId,
    name: name,
    industry: document.getElementById('biz-industry')?.value.trim() || '',
    country: document.getElementById('biz-country')?.value.trim() || '',
    size: document.getElementById('biz-size')?.value || '',
    status: document.getElementById('biz-status')?.value || 'active',
    description: document.getElementById('biz-desc')?.value.trim() || '',
    contact: document.getElementById('biz-contact')?.value.trim() || '',
    email: document.getElementById('biz-email')?.value.trim() || '',
    created_by: window.currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('companies')
    .insert([companyData])
    .select();

  if (error) {
    console.error('Error saving company:', error);
    alert('Error: ' + error.message);
    return;
  }

  alert('✓ Company saved!');
  clearCompanyForm();
  await window.loadAllData();
};

// CLEAR COMPANY FORM
window.clearCompanyForm = function() {
  ['biz-id', 'biz-name', 'biz-industry', 'biz-country', 'biz-desc', 'biz-contact', 'biz-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const sizeEl = document.getElementById('biz-size');
  if (sizeEl) sizeEl.value = '';
  
  const statusEl = document.getElementById('biz-status');
  if (statusEl) statusEl.value = 'active';
};

// RENDER COMPANY TABLE
window.renderCompanyTable = function() {
  const tbody = document.getElementById('biz-table-body');
  const tableCard = document.getElementById('biz-table-card');
  
  if (!tbody) return;

  if (window.companies.length === 0) {
    if (tableCard) tableCard.style.display = 'none';
    return;
  }
  
  if (tableCard) tableCard.style.display = 'block';

  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);

  const html = window.companies.map(c => {
    const procCount = window.processes.filter(p => p.company_id === c.id).length;
    
    return `
    <tr>
      <td><span style="font-family:var(--mono);font-weight:700;color:#0088ff;">${c.biz_id}</span></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.industry || '—'}</td>
      <td>${c.country || '—'}</td>
      <td>${c.size || '—'}</td>
      <td><span style="padding:3px 8px;background:${c.status === 'active' ? '#dcfce7' : '#fee'};color:${c.status === 'active' ? '#166534' : '#991b1b'};border-radius:4px;font-size:11px;font-weight:600;">${c.status || 'active'}</span></td>
      <td>${procCount}</td>
      <td>${c.contact || '—'}</td>
      <td>
        ${canDelete ? `<button class="btn btn-danger" style="padding:5px 12px;font-size:12px;" onclick="deleteCompany('${c.id}')">✕</button>` : '—'}
      </td>
    </tr>
  `}).join('');

  tbody.innerHTML = html;
};

// DELETE COMPANY
window.deleteCompany = async function(id) {
  if (!window.CAN_DELETE.includes(window.currentUser?.role)) {
    alert('You need Manager role or above to delete companies.');
    return;
  }

  const company = window.companies.find(c => c.id === id);
  if (!company) return;

  // Check for linked processes
  const linkedProcs = window.processes.filter(p => p.company_id === id);
  
  if (linkedProcs.length > 0) {
    if (!confirm(`This company has ${linkedProcs.length} linked process(es). Deleting the company will also delete all linked data. Continue?`)) {
      return;
    }
  }

  if (!confirm(`Delete company "${company.name}"?`)) return;

  const { error } = await window.supabaseClient
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    alert('Error: ' + error.message);
    return;
  }

  alert('✓ Company deleted!');
  await window.loadAllData();
};

// RENDER USER TABLE
window.renderUserTable = async function() {
  const tbody = document.getElementById('user-table-body');
  if (!tbody) return;

  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#c00;">Error loading users</td></tr>';
    return;
  }

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#999;">No users found</td></tr>';
    return;
  }

  const roleColors = {
    viewer: '#6b7280',
    editor: '#0088ff',
    manager: '#00d4aa',
    admin: '#a855f7'
  };

  const html = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>
        <select onchange="updateUserRole('${u.id}', this.value)" style="padding:5px;border:1px solid #ccc;border-radius:4px;font-size:12px;background:${roleColors[u.role] || '#999'};color:white;font-weight:600;">
          <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Viewer</option>
          <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" ${u.active ? 'checked' : ''} onchange="toggleUserActive('${u.id}', this.checked)"/>
          <span style="font-size:12px;">${u.active ? 'Active' : 'Inactive'}</span>
        </label>
      </td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');

  tbody.innerHTML = html;
};

// UPDATE USER ROLE
window.updateUserRole = async function(userId, newRole) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('You need Admin role to change user roles.');
    return;
  }

  const { error } = await window.supabaseClient
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating role:', error);
    alert('Error: ' + error.message);
    return;
  }

  alert('✓ User role updated!');
};

// TOGGLE USER ACTIVE
window.toggleUserActive = async function(userId, isActive) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('You need Admin role to activate/deactivate users.');
    return;
  }

  const { error } = await window.supabaseClient
    .from('users')
    .update({ active: isActive })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user status:', error);
    alert('Error: ' + error.message);
    return;
  }

  alert(`✓ User ${isActive ? 'activated' : 'deactivated'}!`);
};

// LOAD INTEGRATION SETTINGS
window.loadIntegrationSettings = async function() {
  const { data, error } = await window.supabaseClient
    .from('integration_settings')
    .select('*')
    .maybeSingle();  // Changed from .single()

  if (error) {
    console.log('Integration settings load info:', error.message);
    return;
  }

  if (data) {
    const apiKeyInput = document.getElementById('anthropic-api-key');
    if (apiKeyInput) {
      apiKeyInput.value = data.anthropic_api_key || '';
    }
  }
};

// SAVE INTEGRATION SETTINGS
window.saveIntegration = async function() {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('You need Admin role to manage integration settings.');
    return;
  }

  const apiKey = document.getElementById('anthropic-api-key')?.value.trim();

  if (!apiKey) {
    alert('API Key is required.');
    return;
  }

  // Check if settings exist
  const { data: existing } = await window.supabaseClient
    .from('integration_settings')
    .select('id')
    .single();

  let error;

  if (existing) {
    // Update
    const result = await window.supabaseClient
      .from('integration_settings')
      .update({ 
        anthropic_api_key: apiKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    error = result.error;
  } else {
    // Insert
    const result = await window.supabaseClient
      .from('integration_settings')
      .insert([{ 
        anthropic_api_key: apiKey,
        created_by: window.currentUser.id
      }]);
    error = result.error;
  }

  if (error) {
    console.error('Error saving integration settings:', error);
    alert('Error: ' + error.message);
    return;
  }

  alert('✓ Integration settings saved!');
};

// RENDER ANALYTICS
window.renderAnalytics = function() {
  const container = document.getElementById('analytics-container');
  if (!container) return;

  const stats = {
    totalCompanies: window.companies.length,
    totalProcesses: window.processes.length,
    totalSteps: window.steps.length,
    totalGaps: window.gaps.length,
    criticalGaps: window.gaps.filter(g => g.severity === 'critical').length,
    highGaps: window.gaps.filter(g => g.severity === 'high').length
  };

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
      <div class="metric-card">
        <div class="metric-label">Companies</div>
        <div class="metric-value">${stats.totalCompanies}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Processes</div>
        <div class="metric-value">${stats.totalProcesses}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Steps</div>
        <div class="metric-value">${stats.totalSteps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Gaps</div>
        <div class="metric-value">${stats.totalGaps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Critical Gaps</div>
        <div class="metric-value" style="color:#dc2626;">${stats.criticalGaps}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">High Gaps</div>
        <div class="metric-value" style="color:#d97706;">${stats.highGaps}</div>
      </div>
    </div>
  `;
};

console.log('✅ admin.js loaded');
