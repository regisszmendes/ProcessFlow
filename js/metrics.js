// ===========================================================
// METRICS SECTION - Complete with Dropdowns and CRUD
// ===========================================================

// REFRESH PROCESS DROPDOWN
window.refreshMetricProcessDropdown = function() {
  const dropdown = document.getElementById('metric-proc-id');
  
  if (!dropdown) {
    console.warn('⚠️ metric-proc-id dropdown not found');
    return;
  }
  
  if (!window.processes || window.processes.length === 0) {
    dropdown.innerHTML = '<option value="">— no processes available —</option>';
    return;
  }
  
  const opts = window.processes.map(p => 
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  console.log(`✅ Loaded ${window.processes.length} processes into metrics dropdown`);
};

// REFRESH STEP DROPDOWN WHEN PROCESS IS SELECTED
window.refreshMetricStepDropdown = function() {
  const procId = document.getElementById('metric-proc-id')?.value;
  const dropdown = document.getElementById('metric-step-id');
  
  if (!dropdown) {
    console.warn('⚠️ metric-step-id dropdown not found');
    return;
  }
  
  if (!procId) {
    dropdown.innerHTML = '<option value="">— select process first —</option>';
    return;
  }
  
  const procSteps = window.steps.filter(s => s.process_id === procId);
  
  if (procSteps.length === 0) {
    dropdown.innerHTML = '<option value="">— no steps for this process —</option>';
    return;
  }
  
  const opts = procSteps.map(s => 
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all steps (optional) —</option>' + opts;
  console.log(`✅ Loaded ${procSteps.length} steps for metrics`);
};

// SAVE METRIC
window.saveMetric = async function() {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save metrics.');
    return;
  }

  const procId = document.getElementById('metric-proc-id')?.value;
  const stepId = document.getElementById('metric-step-id')?.value || null;
  const name = document.getElementById('metric-name')?.value.trim();
  const target = document.getElementById('metric-target')?.value.trim();
  const current = document.getElementById('metric-current')?.value.trim();
  const unit = document.getElementById('metric-unit')?.value.trim();

  if (!procId) {
    alert('Please select a process.');
    return;
  }

  if (!name) {
    alert('Please enter a metric name.');
    return;
  }

  const metricData = {
    process_id: procId,
    step_id: stepId,
    name: name,
    target: target || null,
    current: current || null,
    unit: unit || null,
    created_by: window.currentUser.id
  };

  try {
    const { data, error } = await window.supabaseClient
      .from('metrics')
      .insert([metricData])
      .select();

    if (error) throw error;

    alert('✅ Metric saved!');
    clearMetricForm();
    await window.loadAllData();
    renderMetricsTable();

  } catch (error) {
    console.error('Error saving metric:', error);
    alert('Error: ' + error.message);
  }
};

// CLEAR METRIC FORM
window.clearMetricForm = function() {
  const fields = ['metric-name', 'metric-target', 'metric-current', 'metric-unit'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const procDropdown = document.getElementById('metric-proc-id');
  if (procDropdown) procDropdown.value = '';

  const stepDropdown = document.getElementById('metric-step-id');
  if (stepDropdown) stepDropdown.innerHTML = '<option value="">— select process first —</option>';
};

// RENDER METRICS TABLE
window.renderMetricsTable = function() {
  const tbody = document.getElementById('metrics-table-body');
  const tableCard = document.getElementById('metrics-table-card');

  if (!tbody) return;

  if (!window.metrics || window.metrics.length === 0) {
    if (tableCard) tableCard.style.display = 'none';
    return;
  }

  if (tableCard) tableCard.style.display = 'block';

  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);

  const html = window.metrics.map(m => {
    const proc = window.processes.find(p => p.id === m.process_id);
    const step = m.step_id ? window.steps.find(s => s.id === m.step_id) : null;
    
    const procName = proc ? proc.name : 'Unknown Process';
    const stepName = step ? step.name : '—';

    return `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${procName}</td>
        <td>${stepName}</td>
        <td>${m.target || '—'}${m.unit ? ' ' + m.unit : ''}</td>
        <td>${m.current || '—'}${m.unit ? ' ' + m.unit : ''}</td>
        <td>${m.unit || '—'}</td>
        <td>
          ${canEdit ? `<button class="btn btn-primary" style="padding:5px 12px;font-size:12px;" onclick="editMetric('${m.id}')">✎</button>` : '—'}
          ${canDelete ? `<button class="btn btn-danger" style="padding:5px 12px;font-size:12px;margin-left:5px;" onclick="deleteMetric('${m.id}')">✕</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;
};

// EDIT METRIC
window.editMetric = async function(id) {
  const metric = window.metrics.find(m => m.id === id);
  if (!metric) return;

  document.getElementById('metric-proc-id').value = metric.process_id;
  refreshMetricStepDropdown();
  
  setTimeout(() => {
    if (metric.step_id) {
      document.getElementById('metric-step-id').value = metric.step_id;
    }
  }, 100);

  document.getElementById('metric-name').value = metric.name;
  document.getElementById('metric-target').value = metric.target || '';
  document.getElementById('metric-current').value = metric.current || '';
  document.getElementById('metric-unit').value = metric.unit || '';

  const saveBtn = document.querySelector('button[onclick*="saveMetric"]');
  if (saveBtn) {
    saveBtn.textContent = '✓ Update Metric';
    saveBtn.onclick = () => updateMetric(id);
  }

  document.getElementById('metric-name').scrollIntoView({ behavior: 'smooth' });
};

// UPDATE METRIC
window.updateMetric = async function(id) {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above.');
    return;
  }

  const procId = document.getElementById('metric-proc-id')?.value;
  const stepId = document.getElementById('metric-step-id')?.value || null;
  const name = document.getElementById('metric-name')?.value.trim();
  const target = document.getElementById('metric-target')?.value.trim();
  const current = document.getElementById('metric-current')?.value.trim();
  const unit = document.getElementById('metric-unit')?.value.trim();

  if (!procId || !name) {
    alert('Process and name are required.');
    return;
  }

  const updates = {
    process_id: procId,
    step_id: stepId,
    name: name,
    target: target || null,
    current: current || null,
    unit: unit || null
  };

  try {
    const { error } = await window.supabaseClient
      .from('metrics')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    alert('✅ Metric updated!');
    clearMetricForm();
    await window.loadAllData();
    renderMetricsTable();

    const saveBtn = document.querySelector('button[onclick*="updateMetric"]');
    if (saveBtn) {
      saveBtn.textContent = '💾 Save Metric';
      saveBtn.onclick = saveMetric;
    }

  } catch (error) {
    console.error('Error updating metric:', error);
    alert('Error: ' + error.message);
  }
};

// DELETE METRIC
window.deleteMetric = async function(id) {
  if (!window.CAN_DELETE.includes(window.currentUser?.role)) {
    alert('You need Manager role or above to delete metrics.');
    return;
  }

  const metric = window.metrics.find(m => m.id === id);
  if (!metric) return;

  if (!confirm(`Delete metric "${metric.name}"?`)) return;

  try {
    const { error } = await window.supabaseClient
      .from('metrics')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('✅ Metric deleted!');
    await window.loadAllData();
    renderMetricsTable();

  } catch (error) {
    console.error('Error deleting metric:', error);
    alert('Error: ' + error.message);
  }
};

console.log('✅ metrics.js loaded');
