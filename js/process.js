// ===========================================================
// PROCESS MANAGEMENT - Supabase Integration
// ===========================================================

// SAVE PROCESS
window.saveProcess = async function () {
  if (!CAN_EDIT.includes(currentUser?.role)) {
    alert('You need Editor role or above to save processes.');
    return;
  }

  const companyId = document.getElementById('proc-company-id').value;
  const procId = document.getElementById('proc-id').value.trim();
  const name = document.getElementById('proc-name').value.trim();
  const desc = document.getElementById('proc-desc').value.trim();

  if (!companyId) {
    alert('Please select a Company first.');
    return;
  }

  if (!procId || !name || !desc) {
    alert('Process ID, Name and Description are required.');
    return;
  }

  // Check for duplicate Process ID within same company
  const { data: existing } = await window.supabaseClient
    .from('processes')
    .select('id')
    .eq('proc_id', procId)
    .eq('company_id', companyId)
    .single();

  if (existing) {
    alert('Process ID already exists for this company. Use a unique ID.');
    return;
  }

  const processData = {
    company_id: companyId,
    proc_id: procId,
    name: name,
    description: desc,
    department: document.getElementById('proc-dept').value.trim(),
    owner: document.getElementById('proc-owner').value.trim(),
    version: document.getElementById('proc-version').value.trim() || '1.0',
    status: document.getElementById('proc-status').value,
    start_date: document.getElementById('proc-start').value,
    end_date: document.getElementById('proc-end').value,
    priority: document.getElementById('proc-priority').value,
    type: document.getElementById('proc-type').value,
    duration: document.getElementById('proc-duration').value.trim(),
    frequency: document.getElementById('proc-frequency').value,
    input: document.getElementById('proc-input').value.trim(),
    output: document.getElementById('proc-output').value.trim(),
    stakeholders: document.getElementById('proc-stakeholders').value.trim(),
    tools: document.getElementById('proc-tools').value.trim(),
    kpis: document.getElementById('proc-kpis').value.trim(),
    risks: document.getElementById('proc-risks').value.trim(),
    rag: currentRAG,
    rag_notes: document.getElementById('proc-rag-notes').value.trim(),
    rag_date: document.getElementById('proc-rag-date').value,
    rag_by: document.getElementById('proc-rag-by').value.trim(),
    created_by: currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('processes')
    .insert([processData])
    .select();

  if (error) {
    console.error('Error saving process:', error);
    alert('Error saving process: ' + error.message);
    return;
  }

  alert('✓ Process saved successfully!');
  clearProcessForm();
  await loadProcesses();
  renderProcessTable();
  populateProcessDropdowns();
  document.getElementById('process-table-card').style.display = 'block';
};

// LOAD PROCESSES
window.loadProcesses = async function () {
  const { data, error } = await window.supabaseClient
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

  if (error) {
    console.error('Error loading processes:', error);
    return;
  }

  window.processes = data || [];
};

// DELETE PROCESS
window.deleteProcess = async function (id) {
  if (!CAN_DELETE.includes(currentUser?.role)) {
    alert('Managers or above can delete.');
    return;
  }

  const proc = processes.find(p => p.id === id);
  if (!proc) return;

  // Check for linked data
  const { data: linkedSteps } = await window.supabaseClient
    .from('steps')
    .select('id')
    .eq('process_id', id);

  const { data: linkedMetrics } = await window.supabaseClient
    .from('metrics')
    .select('id')
    .eq('process_id', id);

  const { data: linkedGaps } = await window.supabaseClient
    .from('gaps')
    .select('id')
    .eq('process_id', id);

  const summary = [];
  if (linkedSteps?.length) summary.push(`${linkedSteps.length} step(s)`);
  if (linkedMetrics?.length) summary.push(`${linkedMetrics.length} metric(s)`);
  if (linkedGaps?.length) summary.push(`${linkedGaps.length} gap(s)`);

  const detail = summary.length
    ? `\n\nThis will also permanently delete: ${summary.join(', ')}.`
    : '';

  if (!confirm(`⚠ Deletion cannot be undone.${detail}\n\nProcess: "${proc.proc_id} — ${proc.name}"\n\nAre you sure?`)) {
    return;
  }

  const { error } = await window.supabaseClient
    .from('processes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting process:', error);
    alert('Error deleting process: ' + error.message);
    return;
  }

  await loadProcesses();
  renderProcessTable();
  populateProcessDropdowns();
};

// CLEAR FORM
window.clearProcessForm = function () {
  [
    'proc-id', 'proc-name', 'proc-dept', 'proc-owner', 'proc-version',
    'proc-start', 'proc-end', 'proc-duration', 'proc-input', 'proc-output',
    'proc-stakeholders', 'proc-tools', 'proc-kpis', 'proc-risks', 'proc-desc',
    'proc-rag-notes', 'proc-rag-date', 'proc-rag-by'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('proc-company-id').value = '';
  document.getElementById('proc-status').value = 'draft';
  document.getElementById('proc-priority').value = 'medium';
  document.getElementById('proc-type').value = 'operational';
  document.getElementById('proc-frequency').value = '';

  currentRAG = null;
  ['green', 'amber', 'red'].forEach(c => {
    document.getElementById('rag-' + c)?.classList.remove('sel-green', 'sel-amber', 'sel-red');
  });
};

// RENDER PROCESS TABLE
window.renderProcessTable = function () {
  const tbody = document.getElementById('process-table-body');
  if (!tbody) return;

  const ce = CAN_EDIT.includes(currentUser?.role);
  const cd = CAN_DELETE.includes(currentUser?.role);

  const priBadge = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange', critical: 'badge-red' };
  const staBadge = { draft: 'badge-gray', active: 'badge-green', 'under-review': 'badge-orange', deprecated: 'badge-gray' };
  const RC = { green: '#16a34a', amber: '#d97706', red: '#dc2626' };

  tbody.innerHTML = processes.map(p => {
    const co = p.companies;
    return `<tr>
      <td>${co ? `<span style="font-family:var(--mono);font-size:.7rem;color:var(--accent2);font-weight:700">${co.biz_id}</span>` : '—'}</td>
      <td><span style="font-family:var(--mono);font-size:.72rem;color:var(--accent);font-weight:700">${p.proc_id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.department || '—'}</td>
      <td>${p.owner || '—'}</td>
      <td><span class="badge ${priBadge[p.priority] || 'badge-gray'}">${p.priority}</span></td>
      <td><span class="badge ${staBadge[p.status] || 'badge-gray'}">${p.status}</span></td>
      <td>${p.rag ? `<div style="display:flex;align-items:center;gap:5px"><div style="width:11px;height:11px;border-radius:50%;background:${RC[p.rag]}"></div><span style="font-size:.7rem;color:${RC[p.rag]};font-weight:700;text-transform:uppercase">${p.rag}</span></div>` : '—'}</td>
      <td style="display:flex;gap:4px">
        ${ce ? `<button class="btn btn-secondary" style="padding:3px 9px;font-size:.68rem" onclick="openEditProcModal(${p.id})">✏ Edit</button>` : ''}
        ${cd ? `<button class="btn btn-danger" style="padding:3px 9px" onclick="deleteProcess(${p.id})">✕</button>` : '—'}
      </td>
    </tr>`;
  }).join('');
};

// GENERATE PROCESS ID
window.generateProcId = function () {
  const companyId = document.getElementById('proc-company-id').value;
  if (!companyId) {
    alert('Please select a company first.');
    return;
  }

  const co = companies.find(c => c.id == companyId);
  const prefix = co ? co.biz_id : 'PRC';
  const yr = new Date().getFullYear();
  const companyProcs = processes.filter(p => p.company_id == companyId);
  const seq = String(companyProcs.length + 1).padStart(3, '0');

  document.getElementById('proc-id').value = `${prefix}-${yr}-${seq}`;
};

// RAG SELECTION
window.selectRAG = function (color) {
  currentRAG = color;
  ['green', 'amber', 'red'].forEach(c => {
    const el = document.getElementById('rag-' + c);
    el?.classList.remove('sel-green', 'sel-amber', 'sel-red');
    if (c === color) el?.classList.add('sel-' + color);
  });
};
