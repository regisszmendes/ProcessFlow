// ===========================================================
// ADMIN & CONFIG SECTION - Company & User Management
// ===========================================================

// =========================
// COMPANY MANAGEMENT
// =========================

// SAVE COMPANY
window.saveCompany = async function () {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can register companies.');
    return;
  }

  const name = document.getElementById('biz-name').value.trim();
  const bizId = document.getElementById('biz-id').value.trim().toUpperCase();
  const industry = document.getElementById('biz-industry').value.trim();
  const country = document.getElementById('biz-country').value.trim();
  const size = document.getElementById('biz-size').value;
  const status = document.getElementById('biz-status').value;
  const desc = document.getElementById('biz-desc').value.trim();
  const contact = document.getElementById('biz-contact').value.trim();
  const email = document.getElementById('biz-email').value.trim();

  const err = document.getElementById('biz-err');
  const ok = document.getElementById('biz-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation - Name first, then ID
  if (!name || !bizId) {
    err.textContent = 'Company Name and Company ID are required.';
    err.style.display = 'block';
    return;
  }

  // Check for duplicate Company ID
  const { data: existing } = await window.supabaseClient
    .from('companies')
    .select('id')
    .eq('biz_id', bizId)
    .single();

  if (existing) {
    err.textContent = 'Company ID already exists. Use a unique ID.';
    err.style.display = 'block';
    return;
  }

  const companyData = {
    biz_id: bizId,
    name,
    industry,
    country,
    size,
    status,
    description: desc,
    contact,
    email,
    created_by: window.currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('companies')
    .insert([companyData])
    .select();

  if (error) {
    console.error('Error saving company:', error);
    err.textContent = 'Error saving company: ' + error.message;
    err.style.display = 'block';
    return;
  }

  ok.textContent = '✓ Company registered successfully!';
  ok.style.display = 'block';

  clearCompanyForm();
  await loadAllData();
  renderCompanyTable();
  document.getElementById('biz-table-card').style.display = 'block';
};

// GENERATE COMPANY ID (Standardized format)
window.generateBizId = function () {
  const nameInput = document.getElementById('biz-name').value.trim().toUpperCase();
  
  if (!nameInput) {
    alert('Please enter Company Name first.');
    return;
  }

  // Extract first letters of each word to create prefix (max 4 chars)
  const words = nameInput.split(/\s+/);
  let prefix = '';
  
  if (words.length === 1) {
    // Single word: take first 3-4 letters
    prefix = words[0].substring(0, 4);
  } else {
    // Multiple words: take first letter of each word
    prefix = words.map(w => w[0]).join('').substring(0, 4);
  }

  // Standardized format: PREFIX-YYYY-NNN (e.g., ACME-2024-001)
  const year = new Date().getFullYear();
  const existingCompanies = companies.filter(c => c.biz_id.startsWith(prefix));
  const sequence = String(existingCompanies.length + 1).padStart(3, '0');

  const standardizedId = `${prefix}-${year}-${sequence}`;
  document.getElementById('biz-id').value = standardizedId;
  
  console.log(`Generated Company ID: ${standardizedId}`);
};

// CLEAR COMPANY FORM
window.clearCompanyForm = function () {
  ['biz-id', 'biz-name', 'biz-industry', 'biz-country', 'biz-desc', 'biz-contact', 'biz-email']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

  document.getElementById('biz-size').value = '';
  document.getElementById('biz-status').value = 'active';

  const err = document.getElementById('biz-err');
  const ok = document.getElementById('biz-ok');
  if (err) err.style.display = 'none';
  if (ok) ok.style.display = 'none';
};

// DELETE COMPANY
window.deleteCompany = async function (id) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can delete companies.');
    return;
  }

  const company = companies.find(c => c.id == id);
  if (!company) return;

  // Check for linked processes
  const linkedProcs = processes.filter(p => p.company_id == id);

  const detail = linkedProcs.length 
    ? `\n\nThis will also affect ${linkedProcs.length} linked process(es).`
    : '';

  if (!confirm(`⚠ Deletion cannot be undone.${detail}\n\nCompany: "${company.biz_id} — ${company.name}"\n\nAre you sure?`)) {
    return;
  }

  const { error } = await window.supabaseClient
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    alert('Error deleting company: ' + error.message);
    return;
  }

  // Replace the last 2 lines of deleteCompany with this:
  await loadAllData();
  
  // Debug: confirm array was updated
  console.log('Companies after delete:', companies.length, companies.map(c => c.biz_id));
  
  renderCompanyTable();

// EDIT COMPANY
window.editCompany = async function (id) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can edit companies.');
    return;
  }

  // Fetch company data
  const company = companies.find(c => c.id === id);
  if (!company) {
    alert('Company not found.');
    return;
  }

  // Populate form
  document.getElementById('biz-name').value = company.name;
  document.getElementById('biz-id').value = company.biz_id;
  document.getElementById('biz-id').disabled = true; // Can't change ID
  document.getElementById('biz-industry').value = company.industry || '';
  document.getElementById('biz-country').value = company.country || '';
  document.getElementById('biz-size').value = company.size || '';
  document.getElementById('biz-status').value = company.status || 'active';
  document.getElementById('biz-desc').value = company.description || '';
  document.getElementById('biz-contact').value = company.contact || '';
  document.getElementById('biz-email').value = company.email || '';

  // Change buttons
  const saveBtn = document.getElementById('biz-save-btn');
  if (saveBtn) {
    saveBtn.textContent = '✏️ Update Company';
    saveBtn.onclick = () => updateCompany(id);
  }

  // Add cancel button if not exists
  const btnRow = document.querySelector('#config-pane-biz .btn-row');
  let cancelBtn = document.querySelector('button[onclick*="cancelEditCompany"]');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'biz-cancel-btn';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = '✕ Cancel';
    cancelBtn.onclick = cancelEditCompany;
    btnRow.appendChild(cancelBtn);
  }

  // Scroll to form
  document.querySelector('#config-pane-biz').scrollIntoView({ behavior: 'smooth' });
};

// UPDATE COMPANY
window.updateCompany = async function (id) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can update companies.');
    return;
  }

  const name = document.getElementById('biz-name').value.trim();
  const industry = document.getElementById('biz-industry').value.trim();
  const country = document.getElementById('biz-country').value.trim();
  const size = document.getElementById('biz-size').value;
  const status = document.getElementById('biz-status').value;
  const desc = document.getElementById('biz-desc').value.trim();
  const contact = document.getElementById('biz-contact').value.trim();
  const email = document.getElementById('biz-email').value.trim();

  const err = document.getElementById('biz-err');
  const ok = document.getElementById('biz-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation
  if (!name) {
    err.textContent = 'Company Name is required.';
    err.style.display = 'block';
    return;
  }

  const updateData = {
    name,
    industry,
    country,
    size,
    status,
    description: desc,
    contact,
    email,
    updated_at: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from('companies')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating company:', error);
    err.textContent = 'Error updating company: ' + error.message;
    err.style.display = 'block';
    return;
  }

  ok.textContent = '✓ Company updated successfully!';
  ok.style.display = 'block';

  // Reset form
  cancelEditCompany();

  // Reload data
  await loadAllData();
  renderCompanyTable();
};

// CANCEL EDIT COMPANY
window.cancelEditCompany = function () {
  // Clear form
  clearCompanyForm();
  
  // Re-enable ID field
  document.getElementById('biz-id').disabled = false;

  // Reset button
  const saveBtn = document.getElementById('biz-save-btn');
  if (saveBtn) {
    saveBtn.textContent = '🏢 Register Company';
    saveBtn.onclick = saveCompany;
  }

  // Remove cancel button
  const cancelBtn = document.getElementById('biz-cancel-btn');
  if (cancelBtn) {
    cancelBtn.remove();
  }
};

// RENDER COMPANY TABLE
window.renderCompanyTable = function () {
  const tbody = document.getElementById('biz-table-body');
  if (!tbody) return;

  const cd = window.CAN_DELETE.includes(window.currentUser?.role);
  const ce = window.CAN_ADMIN.includes(window.currentUser?.role);
  
  const sizeBadge = {
    micro: 'badge-gray',
    small: 'badge-blue',
    medium: 'badge-orange',
    large: 'badge-green',
    enterprise: 'badge-purple'
  };

  const statusBadge = {
    active: 'badge-green',
    inactive: 'badge-gray'
  };

  tbody.innerHTML = companies.map(c => {
    const procCount = processes.filter(p => p.company_id === c.id).length;
    
    return `<tr>
      <td><span style="font-family:var(--mono);font-size:.78rem;color:var(--accent2);font-weight:700">${c.biz_id}</span></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.industry || '—'}</td>
      <td>${c.country || '—'}</td>
      <td><span class="badge ${sizeBadge[c.size] || 'badge-gray'}">${c.size || '—'}</span></td>
      <td><span class="badge ${statusBadge[c.status] || 'badge-gray'}">${c.status}</span></td>
      <td style="text-align:center">${procCount}</td>
      <td>${c.contact || '—'}</td>
      <td style="display:flex;gap:4px">
        ${ce ? `<button class="btn btn-secondary" style="padding:3px 9px;font-size:.68rem" onclick="editCompany('${c.id}')">✏️ Edit</button>` : ''}
        ${cd ? `<button class="btn btn-danger" style="padding:3px 9px;font-size:.68rem" onclick="deleteCompany('${c.id}')">x Delete</button>` : '—'}
      </td>
    </tr>`;
  }).join('');

  // Show table card if there are companies
  if (companies.length > 0) {
    document.getElementById('biz-table-card').style.display = 'block';
  }
};

// =========================
// USER MANAGEMENT
// =========================

// ADD USER (Admin)
window.adminAddUser = async function () {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can add users.');
    return;
  }

  const name = document.getElementById('adm-name').value.trim();
  const email = document.getElementById('adm-email').value.trim().toLowerCase();
  const pass = document.getElementById('adm-pass').value;
  const role = document.getElementById('adm-role').value;
  const companyId = document.getElementById('adm-company-id').value || null;

  const err = document.getElementById('adm-err');
  const ok = document.getElementById('adm-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation
  if (!name || !email || !pass) {
    err.textContent = 'Name, Email, and Password are required.';
    err.style.display = 'block';
    return;
  }

  if (pass.length < 6) {
    err.textContent = 'Password must be at least 6 characters.';
    err.style.display = 'block';
    return;
  }

  // Create auth user
  const { data: authData, error: signUpError } = await window.supabaseClient.auth.signUp({
    email,
    password: pass
  });

  if (signUpError || !authData?.user) {
    console.error('Signup error:', signUpError);
    err.textContent = signUpError?.message || 'Error creating user account.';
    err.style.display = 'block';
    return;
  }

  // Create user profile in database
  const newUser = {
    id: authData.user.id,
    name,
    email,
    role,
    company_id: companyId,
    active: true,
    created_by: window.currentUser.id
  };

  const { error: insertError } = await window.supabaseClient
    .from('users')
    .insert([newUser]);

  if (insertError) {
    console.error('User insert error:', insertError);
    err.textContent = 'Error creating user profile: ' + insertError.message;
    err.style.display = 'block';
    return;
  }

  ok.textContent = '✓ User added successfully!';
  ok.style.display = 'block';

  // Clear form
  ['adm-name', 'adm-email', 'adm-pass'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('adm-role').value = 'viewer';
  document.getElementById('adm-company-id').value = '';

  // Reload users
  await loadAllData();
  renderUserTable();
};

// RENDER USER TABLE
window.renderUserTable = async function () {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  // Fetch users from database
  const { data: users, error } = await window.supabaseClient
    .from('users')
    .select(`
      *,
      companies (
        id,
        biz_id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading users:', error);
    return;
  }

  const roleBadge = {
    viewer: 'badge-gray',
    editor: 'badge-blue',
    manager: 'badge-green',
    admin: 'badge-purple'
  };

  const statusBadge = {
    true: 'badge-green',
    false: 'badge-gray'
  };

  tbody.innerHTML = users.map(u => {
    const company = u.companies;
    const createdDate = new Date(u.created_at).toLocaleDateString();
    const isCurrentUser = u.id === window.currentUser.id;

    return `<tr>
      <td>${u.name}${isCurrentUser ? ' <span style="color:var(--accent);font-size:.7rem">(You)</span>' : ''}</td>
      <td>${u.email}</td>
      <td><span class="badge ${roleBadge[u.role] || 'badge-gray'}">${u.role}</span></td>
      <td>${company ? `[${company.biz_id}] ${company.name}` : '—'}</td>
      <td><span class="badge ${statusBadge[u.active]}">${u.active ? 'Active' : 'Inactive'}</span></td>
      <td style="font-size:.72rem;color:var(--text3)">${createdDate}</td>
      <td style="display:flex;gap:4px">
        ${!isCurrentUser ? `
          <button class="btn btn-secondary" style="padding:3px 9px;font-size:.68rem" onclick="editUser('${u.id}')">
            ✏️ Edit
          </button>
          <button class="btn ${u.active ? 'btn-danger' : 'btn-primary'}" style="padding:3px 9px;font-size:.68rem" onclick="toggleUserStatus('${u.id}', ${!u.active})">
            ${u.active ? '🔒 Deactivate' : '🔓 Activate'}
          </button>
        ` : '<span style="color:var(--text3);font-size:.7rem">—</span>'}
      </td>
    </tr>`;
  }).join('');
};

// TOGGLE USER STATUS
window.toggleUserStatus = async function (userId, newStatus) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can change user status.');
    return;
  }

  if (userId === window.currentUser.id) {
    alert('You cannot deactivate yourself!');
    return;
  }

  const action = newStatus ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  const { error } = await window.supabaseClient
    .from('users')
    .update({ active: newStatus })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    alert('Error updating user status: ' + error.message);
    return;
  }

  alert(`✓ User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
  await renderUserTable();
};

// EDIT USER
window.editUser = async function (userId) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can edit users.');
    return;
  }

  // Fetch user data
  const { data: user, error } = await window.supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    alert('Error loading user data.');
    return;
  }

  // Populate form
  document.getElementById('adm-name').value = user.name;
  document.getElementById('adm-email').value = user.email;
  document.getElementById('adm-email').disabled = true; // Can't change email
  document.getElementById('adm-pass').value = '';
  document.getElementById('adm-pass').placeholder = 'Leave blank to keep current password';
  document.getElementById('adm-role').value = user.role;
  document.getElementById('adm-company-id').value = user.company_id || '';

  // Change button to "Update User"
  const addBtn = document.getElementById('user-save-btn');
  if (addBtn) {
    addBtn.textContent = '✏️ Update User';
    addBtn.onclick = () => updateUser(userId);
  }

  // Scroll to form
  document.getElementById('config-pane-users').scrollIntoView({ behavior: 'smooth' });
};

// UPDATE USER
window.updateUser = async function (userId) {
  if (!window.CAN_ADMIN.includes(window.currentUser?.role)) {
    alert('Only admins can update users.');
    return;
  }

  const name = document.getElementById('adm-name').value.trim();
  const pass = document.getElementById('adm-pass').value;
  const role = document.getElementById('adm-role').value;
  const companyId = document.getElementById('adm-company-id').value || null;

  const err = document.getElementById('adm-err');
  const ok = document.getElementById('adm-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation
  if (!name) {
    err.textContent = 'Name is required.';
    err.style.display = 'block';
    return;
  }

  // Update user profile in database
  const updateData = {
    name,
    role,
    company_id: companyId
  };

  const { error: updateError } = await window.supabaseClient
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (updateError) {
    console.error('User update error:', updateError);
    err.textContent = 'Error updating user: ' + updateError.message;
    err.style.display = 'block';
    return;
  }

  // Update password if provided
  if (pass && pass.length >= 6) {
    const { error: pwError } = await window.supabaseClient.auth.admin.updateUserById(
      userId,
      { password: pass }
    );

    if (pwError) {
      console.error('Password update error:', pwError);
      // Continue anyway - profile was updated
    }
  }

  ok.textContent = '✓ User updated successfully!';
  ok.style.display = 'block';

  // Reset form
  cancelEditUser();

  // Reload users
  await renderUserTable();
};

// CANCEL EDIT USER
window.cancelEditUser = function () {
  // Clear form
  ['adm-name', 'adm-email', 'adm-pass'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.disabled = false;
    if (id === 'adm-pass') {
      el.placeholder = 'Min. 6 chars';
    }
  });
  document.getElementById('adm-role').value = 'viewer';
  document.getElementById('adm-company-id').value = '';

  // Reset button
  const btn = document.getElementById('user-save-btn');
  if (btn) {
    btn.textContent = '➕ Add User';
    btn.onclick = adminAddUser;
  }
};

// =========================
// ANALYTICS
// =========================

// RENDER ANALYTICS
window.renderAnalytics = function () {
  const visits = JSON.parse(localStorage.getItem('pf_visits') || '[]');
  
  if (visits.length === 0) {
    document.getElementById('an-total-visits').textContent = '0';
    document.getElementById('an-today-visits').textContent = '0';
    document.getElementById('an-unique-days').textContent = '0';
    document.getElementById('an-avg-day').textContent = '0';
    return;
  }

  // Total visits
  document.getElementById('an-total-visits').textContent = visits.length;

  // Today's visits
  const today = new Date().toDateString();
  const todayVisits = visits.filter(v => new Date(v.timestamp).toDateString() === today);
  document.getElementById('an-today-visits').textContent = todayVisits.length;

  // Unique days
  const uniqueDays = new Set(visits.map(v => new Date(v.timestamp).toDateString()));
  document.getElementById('an-unique-days').textContent = uniqueDays.size;

  // Average per day
  const avgPerDay = (visits.length / uniqueDays.size).toFixed(1);
  document.getElementById('an-avg-day').textContent = avgPerDay;

  // Render charts
  renderVisitChart(visits);
  renderAccessLog(visits);
  renderHourHeatmap(visits);
};

// RENDER VISIT CHART
function renderVisitChart(visits) {
  const chartDiv = document.getElementById('an-bar-chart');
  if (!chartDiv) return;

  // Get last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toDateString());
  }

  // Count visits per day
  const counts = days.map(day => {
    return visits.filter(v => new Date(v.timestamp).toDateString() === day).length;
  });

  const maxCount = Math.max(...counts, 1);

  chartDiv.innerHTML = days.map((day, i) => {
    const date = new Date(day);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const height = (counts[i] / maxCount) * 100;
    
    return `
      <div style="display:flex;gap:8px;align-items:center">
        <div style="font-size:.7rem;color:var(--text3);width:60px">${label}</div>
        <div style="flex:1;background:var(--surface2);height:20px;border-radius:4px;overflow:hidden">
          <div style="width:${height}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .3s"></div>
        </div>
        <div style="font-size:.7rem;color:var(--text2);width:30px;text-align:right">${counts[i]}</div>
      </div>
    `;
  }).join('');
}

// RENDER ACCESS LOG
function renderAccessLog(visits) {
  const logDiv = document.getElementById('an-access-log');
  if (!logDiv) return;

  const recent = visits.slice(-20).reverse();

  logDiv.innerHTML = recent.map(v => {
    const date = new Date(v.timestamp);
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();
    
    return `
      <div style="display:flex;justify-content:space-between;padding:.4rem .6rem;background:var(--surface2);border-radius:6px;font-size:.72rem">
        <span style="color:var(--text2)">${day}</span>
        <span style="color:var(--accent);font-family:var(--mono)">${time}</span>
      </div>
    `;
  }).join('');
}

// RENDER HOUR HEATMAP
function renderHourHeatmap(visits) {
  const heatmapDiv = document.getElementById('an-heatmap');
  if (!heatmapDiv) return;

  // Count visits per hour
  const hourCounts = new Array(24).fill(0);
  visits.forEach(v => {
    const hour = new Date(v.timestamp).getHours();
    hourCounts[hour]++;
  });

  const maxCount = Math.max(...hourCounts, 1);

  heatmapDiv.innerHTML = hourCounts.map((count, hour) => {
    const height = (count / maxCount) * 100;
    const opacity = count === 0 ? 0.1 : 0.3 + (count / maxCount) * 0.7;
    
    return `
      <div style="flex:1;min-width:20px;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="width:100%;height:100px;background:var(--surface2);border-radius:4px;display:flex;align-items:flex-end;overflow:hidden">
          <div style="width:100%;height:${height}%;background:var(--accent);opacity:${opacity};transition:all .3s" title="${hour}:00 - ${count} visits"></div>
        </div>
        <div style="font-size:.65rem;color:var(--text3)">${hour}</div>
      </div>
    `;
  }).join('');
}

// CLEAR VISIT LOG
window.clearVisitLog = function () {
  if (!confirm('Clear all visit history?')) return;
  
  localStorage.removeItem('pf_visits');
  renderAnalytics();
};

// =========================
// INTEGRATION MANAGEMENT
// =========================

// SAVE INTEGRATION SETTINGS
window.saveIntegration = function () {
  const apiKey = document.getElementById('int-api-key').value.trim();
  const model = document.getElementById('int-model').value;
  const maxTokens = document.getElementById('int-max-tokens').value;
  const systemPrompt = document.getElementById('int-system-prompt').value.trim();
  const stylePrompt = document.getElementById('int-style-prompt').value.trim();

  const err = document.getElementById('int-err');
  const ok = document.getElementById('int-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  // Validation
  if (!apiKey) {
    err.textContent = 'API Key is required.';
    err.style.display = 'block';
    return;
  }

  // Save to localStorage
  localStorage.setItem('pf_api_key', apiKey);
  localStorage.setItem('pf_model', model);
  localStorage.setItem('pf_max_tokens', maxTokens);
  localStorage.setItem('pf_system_prompt', systemPrompt);
  localStorage.setItem('pf_style_prompt', stylePrompt);

  ok.textContent = '✓ Integration settings saved successfully!';
  ok.style.display = 'block';

  updateIntegrationStatus();
};

// TOGGLE API KEY VISIBILITY
window.toggleApiKeyVisibility = function () {
  const input = document.getElementById('int-api-key');
  const btn = document.getElementById('int-key-eye');

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
};

// TEST API KEY - OpenAI
async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello from ProcessFlow!"' }],
      max_tokens: 20
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// TEST API KEY - Claude (Anthropic)
async function testClaude(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say "Hello from ProcessFlow!"' }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

// TEST API KEY - Perplexity
async function testPerplexity(apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: 'Say "Hello from ProcessFlow!"' }],
      max_tokens: 20
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// TEST API KEY - Gemini
async function testGemini(apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say "Hello from ProcessFlow!"' }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// TEST API CONNECTION
window.testApiKey = async function () {
  const apiKey = document.getElementById('int-api-key').value.trim();
  const err = document.getElementById('int-err');
  const ok = document.getElementById('int-ok');

  err.style.display = 'none';
  ok.style.display = 'none';

  if (!apiKey) {
    err.textContent = 'Please enter an API key first.';
    err.style.display = 'block';
    return;
  }

  // Detect API provider based on key prefix
  let provider = 'Unknown';
  let testFunction = null;

  if (apiKey.startsWith('sk-')) {
    provider = 'OpenAI';
    testFunction = testOpenAI;
  } else if (apiKey.startsWith('sk-ant-')) {
    provider = 'Claude (Anthropic)';
    testFunction = testClaude;
  } else if (apiKey.startsWith('pplx-')) {
    provider = 'Perplexity';
    testFunction = testPerplexity;
  } else if (apiKey.startsWith('AIza')) {
    provider = 'Google Gemini';
    testFunction = testGemini;
  } else {
    err.textContent = 'Unknown API key format. Supported: OpenAI (sk-...), Claude (sk-ant-...), Perplexity (pplx-...), Gemini (AIza...)';
    err.style.display = 'block';
    return;
  }

  ok.textContent = `⏳ Testing ${provider} connection...`;
  ok.style.display = 'block';

  try {
    const response = await testFunction(apiKey);
    ok.textContent = `✓ ${provider} connection successful! Response: "${response}"`;
    ok.style.display = 'block';
  } catch (error) {
    console.error('API test error:', error);
    err.textContent = `✗ ${provider} test failed: ${error.message}`;
    err.style.display = 'block';
  }
};

// CLEAR API KEY
window.clearApiKey = function () {
  if (!confirm('Remove API key and all integration settings?')) return;

  localStorage.removeItem('pf_api_key');
  localStorage.removeItem('pf_model');
  localStorage.removeItem('pf_max_tokens');
  localStorage.removeItem('pf_system_prompt');
  localStorage.removeItem('pf_style_prompt');

  document.getElementById('int-api-key').value = '';
  document.getElementById('int-model').value = 'gpt-4o';
  document.getElementById('int-max-tokens').value = '2000';
  document.getElementById('int-system-prompt').value = '';
  document.getElementById('int-style-prompt').value = '';

  const ok = document.getElementById('int-ok');
  ok.textContent = '✓ API key removed.';
  ok.style.display = 'block';

  updateIntegrationStatus();
};

// RESET SYSTEM PROMPT
window.resetSystemPrompt = function () {
  const defaultPrompt = `You are an expert process improvement consultant with deep knowledge of Lean Six Sigma, BPMN, and business process management. 

Your role is to analyze processes and provide actionable recommendations to:
- Reduce waste and inefficiency
- Improve quality and consistency
- Enhance customer satisfaction
- Optimize resource utilization

Always structure your analysis using clear frameworks (DMAIC, 5 Whys, Fishbone, etc.) and provide specific, measurable recommendations.`;

  document.getElementById('int-system-prompt').value = defaultPrompt;
  
  const ok = document.getElementById('int-ok');
  ok.textContent = '✓ System prompt reset to default.';
  ok.style.display = 'block';
};

// UPDATE INTEGRATION STATUS
window.updateIntegrationStatus = function () {
  const statusBody = document.getElementById('int-status-body');
  if (!statusBody) return;

  const apiKey = localStorage.getItem('pf_api_key');
  const model = localStorage.getItem('pf_model') || 'gpt-4o';
  const maxTokens = localStorage.getItem('pf_max_tokens') || '2000';
  const systemPrompt = localStorage.getItem('pf_system_prompt');

  let provider = 'Not configured';
  let providerColor = 'var(--text3)';

  if (apiKey) {
    if (apiKey.startsWith('sk-ant-')) {
      provider = '🤖 Claude (Anthropic)';
      providerColor = 'var(--accent4)';
    } else if (apiKey.startsWith('sk-')) {
      provider = '🤖 OpenAI';
      providerColor = 'var(--accent2)';
    } else if (apiKey.startsWith('pplx-')) {
      provider = '🤖 Perplexity';
      providerColor = 'var(--accent)';
    } else if (apiKey.startsWith('AIza')) {
      provider = '🤖 Google Gemini';
      providerColor = 'var(--warning)';
    }
  }

  const maskedKey = apiKey 
    ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
    : '—';

  statusBody.innerHTML = `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:.8rem">
      <div style="color:var(--text3)">Provider:</div>
      <div style="color:${providerColor};font-weight:600">${provider}</div>
      
      <div style="color:var(--text3)">API Key:</div>
      <div style="font-family:var(--mono);font-size:.82rem">${maskedKey}</div>
      
      <div style="color:var(--text3)">Model:</div>
      <div style="font-weight:500">${model}</div>
      
      <div style="color:var(--text3)">Max Tokens:</div>
      <div>${maxTokens}</div>
      
      <div style="color:var(--text3)">Custom Instructions:</div>
      <div>${systemPrompt ? '✓ Configured' : '✗ Using default'}</div>
      
      <div style="color:var(--text3)">Status:</div>
      <div style="color:${apiKey ? 'var(--success)' : 'var(--danger)'}">
        ${apiKey ? '✓ Ready for AI suggestions' : '✗ API key required'}
      </div>
    </div>
  `;
};

// LOAD INTEGRATION SETTINGS ON INIT
window.loadIntegrationSettings = function () {
  const apiKey = localStorage.getItem('pf_api_key');
  const model = localStorage.getItem('pf_model');
  const maxTokens = localStorage.getItem('pf_max_tokens');
  const systemPrompt = localStorage.getItem('pf_system_prompt');
  const stylePrompt = localStorage.getItem('pf_style_prompt');

  if (apiKey) document.getElementById('int-api-key').value = apiKey;
  if (model) document.getElementById('int-model').value = model;
  if (maxTokens) document.getElementById('int-max-tokens').value = maxTokens;
  if (systemPrompt) document.getElementById('int-system-prompt').value = systemPrompt;
  if (stylePrompt) document.getElementById('int-style-prompt').value = stylePrompt;

  updateIntegrationStatus();
};

// =========================
// CALL AI API (For use in AI section)
// =========================

// GENERIC AI API CALLER
window.callAI = async function (userMessage, processContext = '') {
  const apiKey = localStorage.getItem('pf_api_key');
  
  if (!apiKey) {
    throw new Error('API key not configured. Go to Config → Integration to set it up.');
  }

  const model = localStorage.getItem('pf_model') || 'gpt-4o';
  const maxTokens = parseInt(localStorage.getItem('pf_max_tokens') || '2000');
  const systemPrompt = localStorage.getItem('pf_system_prompt') || getDefaultSystemPrompt();
  const stylePrompt = localStorage.getItem('pf_style_prompt') || '';

  // Build full prompt
  let fullSystemPrompt = systemPrompt;
  if (stylePrompt) {
    fullSystemPrompt += '\n\n' + stylePrompt;
  }

  let fullUserMessage = userMessage;
  if (processContext) {
    fullUserMessage = `${processContext}\n\n${userMessage}`;
  }

  // Detect provider and call appropriate API
  if (apiKey.startsWith('sk-ant-')) {
    return await callClaudeAPI(apiKey, fullSystemPrompt, fullUserMessage, maxTokens);
  } else if (apiKey.startsWith('sk-')) {
    return await callOpenAI(apiKey, model, fullSystemPrompt, fullUserMessage, maxTokens);
  } else if (apiKey.startsWith('pplx-')) {
    return await callPerplexity(apiKey, fullSystemPrompt, fullUserMessage, maxTokens);
  } else if (apiKey.startsWith('AIza')) {
    return await callGemini(apiKey, fullSystemPrompt, fullUserMessage, maxTokens);
  } else {
    throw new Error('Unknown API key format');
  }
};

// CALL OPENAI
async function callOpenAI(apiKey, systemPrompt, userMessage, maxTokens) {
  const model = localStorage.getItem('pf_model') || 'gpt-4o';
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// CALL CLAUDE
async function callClaudeAPI(apiKey, systemPrompt, userMessage, maxTokens) {
  const model = localStorage.getItem('pf_model') || 'claude-3-5-sonnet-20241022';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API request failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

// CALL PERPLEXITY
async function callPerplexity(apiKey, systemPrompt, userMessage, maxTokens) {
  const model = localStorage.getItem('pf_model') || 'llama-3.1-sonar-large-128k-online';
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Perplexity API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// CALL GEMINI
async function callGemini(apiKey, systemPrompt, userMessage, maxTokens) {
  const model = localStorage.getItem('pf_model') || 'gemini-1.5-pro';
  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// DEFAULT SYSTEM PROMPT
function getDefaultSystemPrompt() {
  return `You are an expert process improvement consultant with deep knowledge of Lean Six Sigma, BPMN, and business process management. 

Your role is to analyze processes and provide actionable recommendations to:
- Reduce waste and inefficiency
- Improve quality and consistency
- Enhance customer satisfaction
- Optimize resource utilization

Always structure your analysis using clear frameworks (DMAIC, 5 Whys, Fishbone, etc.) and provide specific, measurable recommendations.`;
}

console.log('✅ admin.js loaded');
