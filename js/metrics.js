// ===========================================================
// METRICS MANAGEMENT
// ===========================================================

// SAVE METRIC
window.saveMetric = async function () {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save metrics.');
    return;
  }

  const procId = document.getElementById('metric-proc-id').value;
  const name = document.getElementById('metric-name').value.trim();
  const target = document.getElementById('metric-target').value.trim();

  if (!procId) {
    alert('Please select a Process first.');
    return;
  }

  if (!name || !target) {
    alert('Metric name and target are required.');
    return;
  }

  const metricData = {
    process_id: procId,
    name: name,
    description: document.getElementById('metric-desc').value.trim(),
    target: target,
    current: document.getElementById('metric-current').value.trim(),
    unit: document.getElementById('metric-unit').value.trim(),
    frequency: document.getElementById('metric-frequency').value,
    created_by: window.currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('metrics')
    .insert([metricData])
    .select();

  if (error) {
    console.error('Error saving metric:', error);
    alert('Error saving metric: ' + error.message);
    return;
  }

  alert('✓ Metric saved successfully!');
  clearMetricForm();
  await window.loadAllData();
};

// CLEAR METRIC FORM
window.clearMetricForm = function () {
  [
    'metric-name', 'metric-desc', 'metric-target', 'metric-current', 'metric-unit'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  document.getElementById('metric-frequency').value = '';
};

console.log('✅ metrics.js loaded');

// ALIAS for HTML compatibility
window.addMetric = window.saveMetric;

// REFRESH STEP DROPDOWN WHEN PROCESS IS SELECTED
window.refreshMetricStepDropdown = function () {
  const procId = document.getElementById('metric-proc-id')?.value;
  const dropdown = document.getElementById('metric-step-id');
  
  if (!dropdown) return;
  
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
  
  dropdown.innerHTML = '<option value="">— none (process-level metric) —</option>' + opts;
};

// RENDER METRICS TABLE
window.renderMetricsTable = function() {
  const container = document.getElementById('metrics-display-container');
  
  // Create container if doesn't exist
  if (!container) {
    const metricsSection = document.getElementById('section-metrics');
    if (!metricsSection) return;
    
    const cards = metricsSection.querySelectorAll('.card');
    if (cards.length > 0) {
      const displayCard = document.createElement('div');
      displayCard.className = 'card';
      displayCard.style.marginTop = '1.5rem';
      displayCard.innerHTML = '<div class="card-header"><div class="card-icon" style="background:rgba(0,143,116,.1)">📊</div><span class="card-title">Registered Metrics</span></div><div id="metrics-display-container" style="padding:1rem;"></div>';
      cards[0].parentNode.appendChild(displayCard);
    }
  }
  
  const displayContainer = document.getElementById('metrics-display-container');
  if (!displayContainer) return;
  
  if (window.metrics.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No metrics registered yet</div>';
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  const html = window.metrics.map((metric, idx) => {
    const proc = window.processes.find(p => p.id === metric.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // Calculate progress percentage
    let progressPercent = 0;
    let progressColor = '#6b7280';
    if (metric.current && metric.target) {
      const current = parseFloat(metric.current);
      const target = parseFloat(metric.target);
      if (!isNaN(current) && !isNaN(target) && target !== 0) {
        progressPercent = Math.round((current / target) * 100);
        
        // Color based on progress
        if (progressPercent >= 100) {
          progressColor = '#059669'; // Green - target met
        } else if (progressPercent >= 75) {
          progressColor = '#0088ff'; // Blue - on track
        } else if (progressPercent >= 50) {
          progressColor = '#f59e0b'; // Orange - needs attention
        } else {
          progressColor = '#dc2626'; // Red - critical
        }
      }
    }
    
    return `<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:15px;margin-bottom:5px;">${metric.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">Process: ${procName}</div>
          ${metric.description ? `<div style="font-size:13px;color:#666;margin-bottom:8px;">${metric.description}</div>` : ''}
          
          <div style="display:flex;gap:20px;margin-top:10px;flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Target</div>
              <div style="font-size:16px;font-weight:700;color:#008f74;">${metric.target}${metric.unit ? ' ' + metric.unit : ''}</div>
            </div>
            ${metric.current ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Current</div>
              <div style="font-size:16px;font-weight:700;color:${progressColor};">${metric.current}${metric.unit ? ' ' + metric.unit : ''}</div>
            </div>
            ` : ''}
            ${metric.current && metric.target ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Progress</div>
              <div style="font-size:16px;font-weight:700;color:${progressColor};">${progressPercent}%</div>
            </div>
            ` : ''}
            ${metric.frequency ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Frequency</div>
              <div style="font-size:13px;font-weight:600;color:#666;">${metric.frequency}</div>
            </div>
            ` : ''}
          </div>
          
          ${metric.current && metric.target ? `
          <div style="margin-top:10px;background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden;">
            <div style="width:${Math.min(progressPercent, 100)}%;height:100%;background:${progressColor};transition:width 0.3s;"></div>
          </div>
          ` : ''}
        </div>
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editMetric('${metric.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteMetric('${metric.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
};

// EDIT METRIC
window.editMetric = function(id) {
  const metric = window.metrics.find(m => m.id === id);
  if (!metric) return;
  
  const existing = document.getElementById('edit-metric-modal');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'edit-metric-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:600px;max-width:100%;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  box.innerHTML = `
    <h2 style="margin-bottom:1.5rem;">✏ Edit Metric</h2>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Metric Name *</label>
      <input type="text" id="edit-metric-name" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Description</label>
      <textarea id="edit-metric-desc" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Target Value *</label>
        <input type="text" id="edit-metric-target" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Current Value</label>
        <input type="text" id="edit-metric-current" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Unit</label>
        <input type="text" id="edit-metric-unit" placeholder="%, hours, $..." style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Frequency</label>
        <select id="edit-metric-frequency" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
          <option value="">Select...</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
    </div>
    
    <div style="margin-top:1.5rem;display:flex;gap:10px;">
      <button id="save-metric-btn" style="flex:1;background:#008f74;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">✓ Save Changes</button>
      <button id="cancel-metric-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Cancel</button>
    </div>
  `;
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  // Populate fields
  document.getElementById('edit-metric-name').value = metric.name || '';
  document.getElementById('edit-metric-desc').value = metric.description || '';
  document.getElementById('edit-metric-target').value = metric.target || '';
  document.getElementById('edit-metric-current').value = metric.current || '';
  document.getElementById('edit-metric-unit').value = metric.unit || '';
  document.getElementById('edit-metric-frequency').value = metric.frequency || '';
  
  // Save button
  document.getElementById('save-metric-btn').onclick = async function() {
    const updates = {
      name: document.getElementById('edit-metric-name').value.trim(),
      description: document.getElementById('edit-metric-desc').value.trim(),
      target: document.getElementById('edit-metric-target').value.trim(),
      current: document.getElementById('edit-metric-current').value.trim(),
      unit: document.getElementById('edit-metric-unit').value.trim(),
      frequency: document.getElementById('edit-metric-frequency').value,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await window.supabaseClient.from('metrics').update(updates).eq('id', id);
    
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    alert('✓ Metric updated successfully!');
    div.remove();
    await window.loadAllData();
  };
  
  // Cancel button
  document.getElementById('cancel-metric-btn').onclick = function() {
    div.remove();
  };
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
  
  const { error } = await window.supabaseClient.from('metrics').delete().eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Metric deleted successfully!');
  await window.loadAllData();
};

// RENDER METRICS (WITH FILTER)
window.renderMetrics = function() {
  const filterProc = document.getElementById('metric-filter-proc')?.value;
  
  const displayContainer = document.getElementById('metrics-display-container');
  if (!displayContainer) {
    window.renderMetricsTable();
    return;
  }
  
  // Filter metrics by process if selected
  let filteredMetrics = window.metrics;
  if (filterProc) {
    filteredMetrics = window.metrics.filter(m => m.process_id === filterProc);
  }
  
  if (filteredMetrics.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No metrics found for selected process</div>';
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  const html = filteredMetrics.map((metric) => {
    const proc = window.processes.find(p => p.id === metric.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // Calculate progress percentage
    let progressPercent = 0;
    let progressColor = '#6b7280';
    if (metric.current && metric.target) {
      const current = parseFloat(metric.current);
      const target = parseFloat(metric.target);
      if (!isNaN(current) && !isNaN(target) && target !== 0) {
        progressPercent = Math.round((current / target) * 100);
        
        if (progressPercent >= 100) {
          progressColor = '#059669';
        } else if (progressPercent >= 75) {
          progressColor = '#0088ff';
        } else if (progressPercent >= 50) {
          progressColor = '#f59e0b';
        } else {
          progressColor = '#dc2626';
        }
      }
    }
    
    return `<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:15px;margin-bottom:5px;">${metric.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">Process: ${procName}</div>
          ${metric.description ? `<div style="font-size:13px;color:#666;margin-bottom:8px;">${metric.description}</div>` : ''}
          
          <div style="display:flex;gap:20px;margin-top:10px;flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Target</div>
              <div style="font-size:16px;font-weight:700;color:#008f74;">${metric.target}${metric.unit ? ' ' + metric.unit : ''}</div>
            </div>
            ${metric.current ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Current</div>
              <div style="font-size:16px;font-weight:700;color:${progressColor};">${metric.current}${metric.unit ? ' ' + metric.unit : ''}</div>
            </div>
            ` : ''}
            ${metric.current && metric.target ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Progress</div>
              <div style="font-size:16px;font-weight:700;color:${progressColor};">${progressPercent}%</div>
            </div>
            ` : ''}
            ${metric.frequency ? `
            <div>
              <div style="font-size:11px;color:#888;text-transform:uppercase;">Frequency</div>
              <div style="font-size:13px;font-weight:600;color:#666;">${metric.frequency}</div>
            </div>
            ` : ''}
          </div>
          
          ${metric.current && metric.target ? `
          <div style="margin-top:10px;background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden;">
            <div style="width:${Math.min(progressPercent, 100)}%;height:100%;background:${progressColor};transition:width 0.3s;"></div>
          </div>
          ` : ''}
        </div>
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editMetric('${metric.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteMetric('${metric.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
};
