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

  const bizId = document.getElementById('biz-id').value.trim().toUpperCase();
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
  if (!bizId || !name) {
    err.textContent = 'Company ID and Name are required.';
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

// GENERATE COMPANY ID
window.generateBizId = function () {
  const nameInput = document.getElementById('biz-name').value.trim().toUpperCase();
  
  if (!nameInput) {
    alert('Please enter Company Name first.');
    return;
  }

  // Extract first letters of each word, max 4 chars
  const words = nameInput.split(/\s+/);
  let bizId = '';
  
  if (words.length === 1) {
    bizId = words[0].substring(0, 4);
  } else {
    bizId = words.map(w => w[0]).join('').substring(0, 4);
  }

  document.getElementById('biz-id').value = bizId;
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

  const company = companies.find(c => c.id === id);
  if (!company) return;

  // Check for linked processes
  const linkedProcs = processes.filter(p => p.company_id === id);

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

  await loadAllData();
  renderCompanyTable();
};

// RENDER COMPANY TABLE
window.renderCompanyTable = function () {
  const tbody = document.getElementById('biz-table-body');
  if (!tbody) return;

  const cd = window.CAN_DELETE.includes(window.currentUser?.role);
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
      <td>${cd ? `<button class="btn btn-danger" style="padding:3px 9px" onclick="deleteCompany(${c.id})">✕</button>` : '—'}</td>
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
      <td>
        ${!isCurrentUser ? `
          <button class="btn btn-secondary" style="padding:3px 9px;font-size:.68rem" onclick="toggleUserStatus(${u.id}, ${!u.active})">
            ${u.active ? '🔒 Deactivate' : '🔓 Activate'}
          </button>
        ` : '—'}
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

  const { error } = await window.supabaseClient
    .from('users')
    .update({ active: newStatus })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    alert('Error updating user status: ' + error.message);
    return;
  }

  renderUserTable();
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

console.log('✅ admin.js loaded');
