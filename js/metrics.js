// ===========================================================
// METRICS MANAGEMENT - FIXED FOR YOUR HTML
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

  if (!name) {
    alert('Metric name is required.');
    return;
  }

  const metricData = {
    process_id: procId,
    step_id: document.getElementById('metric-step-id')?.value || null,
    name: name,
    category: document.getElementById('metric-cat')?.value || '',
    current: document.getElementById('metric-val')?.value.trim() || '',
    unit: document.getElementById('metric-unit')?.value.trim() || '',
    target: target || '',
    trend: document.getElementById('metric-trend')?.value || '',
    notes: document.getElementById('metric-notes')?.value.trim() || '',
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
  
  // Refresh display
  if (typeof window.renderMetricsTable === 'function') {
    window.renderMetricsTable();
  }
};

// CLEAR METRIC FORM
window.clearMetricForm = function () {
  ['metric-name', 'metric-val', 'metric-unit', 'metric-target', 'metric-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const catEl = document.getElementById('metric-cat');
  if (catEl) catEl.value = 'time';
  
  const trendEl = document.getElementById('metric-trend');
  if (trendEl) trendEl.value = '';
};

// ALIAS for HTML compatibility
window.addMetric = window.saveMetric;

// REFRESH PROCESS DROPDOWN FOR METRICS
window.refreshMetricProcessDropdown = function () {
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
  console.log(`✅ Loaded ${window.processes.length} processes into dropdown`);
};

// REFRESH STEP DROPDOWN WHEN PROCESS IS SELECTED
window.refreshMetricStepDropdown = function () {
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
  
  dropdown.innerHTML = '<option value="">— none / process-level —</option>' + opts;
  console.log(`✅ Loaded ${procSteps.length} steps for selected process`);
};

// RENDER METRICS GRID
window.renderMetrics = function() {
  const filterProc = document.getElementById('metric-filter-proc')?.value;
  const grid = document.getElementById('metrics-grid');
  
  if (!grid) return;
  
  let filteredMetrics = window.metrics || [];
  if (filterProc) {
    filteredMetrics = filteredMetrics.filter(m => m.process_id === filterProc);
  }
  
  if (filteredMetrics.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">📊</div><div class="es-text">No metrics yet.</div></div>';
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  const html = filteredMetrics.map(metric => {
    const proc = window.processes.find(p => p.id === metric.process_id);
    const procName = proc ? proc.name : 'Unknown';
    
    let progressPercent = 0;
    let progressColor = '#6b7280';
    let gapText = '—';
    
    if (metric.current && metric.target) {
      const current = parseFloat(metric.current);
      const target = parseFloat(metric.target);
      
      if (!isNaN(current) && !isNaN(target) && target !== 0) {
        progressPercent = Math.round((current / target) * 100);
        const gap = target - current;
        gapText = gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1);
        
        if (progressPercent >= 100) progressColor = '#059669';
        else if (progressPercent >= 75) progressColor = '#0088ff';
        else if (progressPercent >= 50) progressColor = '#f59e0b';
        else progressColor = '#dc2626';
      }
    }
    
    const trendIcon = metric.trend === 'improving' ? '↑' : metric.trend === 'worsening' ? '↓' : '→';
    const trendColor = metric.trend === 'improving' ? '#059669' : metric.trend === 'worsening' ? '#dc2626' : '#6b7280';
    
    return `
      <div class="metric-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${metric.name}</div>
            <div style="font-size:12px;color:#666;">📋 ${procName}</div>
            ${metric.category ? `<span style="display:inline-block;margin-top:4px;font-size:11px;padding:2px 6px;background:#e5e7eb;border-radius:3px;">${metric.category}</span>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            ${canEdit ? `<button onclick="editMetric('${metric.id}')" style="padding:4px 8px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">✏</button>` : ''}
            ${canDelete ? `<button onclick="deleteMetric('${metric.id}')" style="padding:4px 8px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">✕</button>` : ''}
          </div>
        </div>
        
        <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;">
          ${metric.current ? `
          <div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Current</div>
            <div style="font-size:18px;font-weight:700;color:${progressColor};">${metric.current}${metric.unit || ''}</div>
          </div>
          ` : ''}
          ${metric.target ? `
          <div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Target</div>
            <div style="font-size:18px;font-weight:700;color:#008f74;">${metric.target}${metric.unit || ''}</div>
          </div>
          ` : ''}
          ${metric.current && metric.target ? `
          <div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Progress</div>
            <div style="font-size:18px;font-weight:700;color:${progressColor};">${progressPercent}%</div>
          </div>
          ` : ''}
          ${metric.trend ? `
          <div>
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Trend</div>
            <div style="font-size:18px;font-weight:700;color:${trendColor};">${trendIcon}</div>
          </div>
          ` : ''}
        </div>
        
        ${metric.current && metric.target ? `
        <div style="margin-top:12px;background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden;">
          <div style="width:${Math.min(progressPercent, 100)}%;height:100%;background:${progressColor};transition:width 0.3s;"></div>
        </div>
        ` : ''}
        
        ${metric.notes ? `<div style="margin-top:8px;font-size:12px;color:#666;">${metric.notes}</div>` : ''}
      </div>
    `;
  }).join('');
  
  grid.innerHTML = html;
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
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Current Value</label>
        <input type="number" id="edit-metric-current" step="any" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Target Value</label>
        <input type="number" id="edit-metric-target" step="any" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Unit</label>
        <input type="text" id="edit-metric-unit" placeholder="%, hours, $..." style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Trend</label>
        <select id="edit-metric-trend" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
          <option value="">Unknown</option>
          <option value="improving">Improving ↑</option>
          <option value="stable">Stable →</option>
          <option value="worsening">Worsening ↓</option>
        </select>
      </div>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Notes</label>
      <textarea id="edit-metric-notes" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
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
  document.getElementById('edit-metric-current').value = metric.current || '';
  document.getElementById('edit-metric-target').value = metric.target || '';
  document.getElementById('edit-metric-unit').value = metric.unit || '';
  document.getElementById('edit-metric-trend').value = metric.trend || '';
  document.getElementById('edit-metric-notes').value = metric.notes || '';
  
  // Save button
  document.getElementById('save-metric-btn').onclick = async function() {
    const updates = {
      name: document.getElementById('edit-metric-name').value.trim(),
      current: document.getElementById('edit-metric-current').value.trim(),
      target: document.getElementById('edit-metric-target').value.trim(),
      unit: document.getElementById('edit-metric-unit').value.trim(),
      trend: document.getElementById('edit-metric-trend').value,
      notes: document.getElementById('edit-metric-notes').value.trim(),
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

// INITIALIZE METRICS SECTION
window.initMetricsSection = function() {
  console.log('🔧 Initializing Metrics Section...');
  
  // Refresh process dropdown
  if (typeof window.refreshMetricProcessDropdown === 'function') {
    window.refreshMetricProcessDropdown();
  }
  
  // Also refresh the filter dropdown
  const filterDropdown = document.getElementById('metric-filter-proc');
  if (filterDropdown && window.processes) {
    const opts = window.processes.map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
    filterDropdown.innerHTML = '<option value="">All Processes</option>' + opts;
  }
  
  // Initialize step dropdown
  const stepDropdown = document.getElementById('metric-step-id');
  if (stepDropdown) {
    stepDropdown.innerHTML = '<option value="">— select process first —</option>';
  }
  
  // Render metrics
  if (window.metrics && window.metrics.length > 0) {
    window.renderMetrics();
  }
};

// Set up event listener for process dropdown
setTimeout(() => {
  const procDropdown = document.getElementById('metric-proc-id');
  if (procDropdown) {
    procDropdown.addEventListener('change', window.refreshMetricStepDropdown);
    console.log('✅ Event listener added to metric-proc-id');
  }
}, 1000);

console.log('✅ metrics.js loaded');
