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

  if (!target) {
    alert('Please enter a target value.');
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
  const emptyState = document.querySelector('#metrics-grid .empty-state');

  if (!tbody) return;

  if (!window.metrics || window.metrics.length === 0) {
    if (tableCard) tableCard.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (tableCard) tableCard.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

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

// EDIT METRIC - WITH MODAL
window.editMetric = function(id) {
  const metric = window.metrics.find(m => m.id === id);
  if (!metric) return;

  // Remove existing modal if any
  const existing = document.getElementById('metric-edit-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'metric-edit-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:600px;max-width:90%;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:80vh;overflow-y:auto;';

  box.innerHTML = `
    <h3 style="margin:0 0 1.5rem 0;color:#333;">Edit Metric</h3>
    
    <div style="margin-bottom:1rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Process *</label>
      <select id="edit-metric-proc" onchange="editMetricRefreshSteps()" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
        ${window.processes.map(p => `<option value="${p.id}" ${p.id === metric.process_id ? 'selected' : ''}>${p.name}</option>`).join('')}
      </select>
    </div>
    
    <div style="margin-bottom:1rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Step (optional)</label>
      <select id="edit-metric-step" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
        <option value="">— process level —</option>
      </select>
    </div>
    
    <div style="margin-bottom:1rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Metric Name *</label>
      <input type="text" id="edit-metric-name" value="${metric.name}" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <div style="margin-bottom:1rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Target Value *</label>
      <input type="text" id="edit-metric-target" value="${metric.target || ''}" placeholder="e.g., 95%, 30 minutes, $10000" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <div style="margin-bottom:1rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Current Value</label>
      <input type="text" id="edit-metric-current" value="${metric.current || ''}" placeholder="e.g., 87%, 45 minutes" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <div style="margin-bottom:1.5rem;">
      <label style="display:block;font-size:13px;font-weight:600;color:#666;margin-bottom:0.5rem;">Unit (optional)</label>
      <input type="text" id="edit-metric-unit" value="${metric.unit || ''}" placeholder="e.g., %, minutes, $" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <div id="edit-metric-error" style="display:none;padding:10px;background:#fee;border:1px solid #fcc;border-radius:6px;color:#c00;font-size:13px;margin-bottom:1rem;"></div>
    
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button onclick="document.getElementById('metric-edit-modal').remove()" style="padding:10px 20px;background:#e5e7eb;color:#333;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Cancel</button>
      <button onclick="saveEditedMetric('${id}')" style="padding:10px 20px;background:#0088ff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">💾 Update Metric</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  // Populate steps dropdown
  setTimeout(() => {
    editMetricRefreshSteps();
    if (metric.step_id) {
      document.getElementById('edit-metric-step').value = metric.step_id;
    }
  }, 100);

  document.getElementById('edit-metric-name').focus();
};

// REFRESH STEPS IN EDIT MODAL
window.editMetricRefreshSteps = function() {
  const procId = document.getElementById('edit-metric-proc')?.value;
  const stepSelect = document.getElementById('edit-metric-step');
  
  if (!stepSelect || !procId) return;
  
  const procSteps = window.steps.filter(s => s.process_id === procId);
  
  stepSelect.innerHTML = '<option value="">— process level —</option>' + 
    procSteps.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
};

// SAVE EDITED METRIC
window.saveEditedMetric = async function(id) {
  const procId = document.getElementById('edit-metric-proc').value;
  const stepId = document.getElementById('edit-metric-step').value || null;
  const name = document.getElementById('edit-metric-name').value.trim();
  const target = document.getElementById('edit-metric-target').value.trim();
  const current = document.getElementById('edit-metric-current').value.trim();
  const unit = document.getElementById('edit-metric-unit').value.trim();
  const errorDiv = document.getElementById('edit-metric-error');

  if (!name) {
    errorDiv.textContent = 'Please enter a metric name';
    errorDiv.style.display = 'block';
    return;
  }

  if (!target) {
    errorDiv.textContent = 'Please enter a target value';
    errorDiv.style.display = 'block';
    return;
  }

  const updates = {
    process_id: procId,
    step_id: stepId,
    name: name,
    target: target,
    current: current || null,
    unit: unit || null
  };

  try {
    const { error } = await window.supabaseClient
      .from('metrics')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    document.getElementById('metric-edit-modal').remove();
    alert('✅ Metric updated!');
    await window.loadAllData();

  } catch (error) {
    console.error('Error updating metric:', error);
    errorDiv.textContent = 'Error: ' + error.message;
    errorDiv.style.display = 'block';
  }
};

// UPDATE METRIC
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
