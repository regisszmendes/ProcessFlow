// ===========================================================
// GAP MANAGEMENT
// ===========================================================

// SAVE GAP
window.saveGap = async function () {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save gaps.');
    return;
  }

  const procId = document.getElementById('gap-proc-id')?.value;
  const title = document.getElementById('gap-title')?.value.trim();

  if (!procId) {
    alert('Please select a Process first.');
    return;
  }

  if (!title) {
    alert('Gap title is required.');
    return;
  }

  const gapData = {
    process_id: procId,
    step_id: document.getElementById('gap-step-id')?.value || null,
    title: title,
    category: document.getElementById('gap-cat')?.value || '',
    current_state: document.getElementById('gap-current')?.value.trim() || '',
    desired_state: document.getElementById('gap-desired')?.value.trim() || '',
    impact: document.getElementById('gap-impact')?.value.trim() || '',
    severity: document.getElementById('gap-severity')?.value || 'medium',
    action: document.getElementById('gap-action')?.value.trim() || '',
    owner: document.getElementById('gap-owner')?.value.trim() || '',
    target_date: document.getElementById('gap-target')?.value || null,
    status: document.getElementById('gap-status')?.value || 'open',
    created_by: window.currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('gaps')
    .insert([gapData])
    .select();

  if (error) {
    console.error('Error saving gap:', error);
    alert('Error saving gap: ' + error.message);
    return;
  }

  alert('✓ Gap saved successfully!');
  clearGapForm();
  await window.loadAllData();
  
  if (typeof window.renderGapsTable === 'function') {
    window.renderGapsTable();
  }
};

// ALIAS for HTML compatibility
window.addGap = window.saveGap;

// CLEAR GAP FORM
window.clearGapForm = function () {
  [
    'gap-title', 'gap-current', 'gap-desired', 'gap-impact', 
    'gap-action', 'gap-owner', 'gap-target'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const catEl = document.getElementById('gap-cat');
  if (catEl) catEl.value = '';
  
  const sevEl = document.getElementById('gap-severity');
  if (sevEl) sevEl.value = 'medium';
  
  const statusEl = document.getElementById('gap-status');
  if (statusEl) statusEl.value = 'open';
};

// ADD ROOT CAUSE ROW
window.addRCRow = function() {
  const container = document.getElementById('rc-rows');
  if (!container) return;
  
  const rowCount = container.children.length;
  const newRow = document.createElement('div');
  newRow.className = 'form-group full';
  newRow.innerHTML = `<input type="text" id="gap-rc-${rowCount + 1}" placeholder="Root cause ${rowCount + 1}"/>`;
  
  container.appendChild(newRow);
};

// RENDER GAPS TABLE
window.renderGapsTable = function() {
  const container = document.getElementById('gaps-display-container');
  
  // Create container if doesn't exist
  if (!container) {
    const gapsSection = document.getElementById('section-gaps');
    if (!gapsSection) return;
    
    const cards = gapsSection.querySelectorAll('.card');
    if (cards.length > 0) {
      const displayCard = document.createElement('div');
      displayCard.className = 'card';
      displayCard.style.marginTop = '1.5rem';
      displayCard.innerHTML = '<div class="card-header"><div class="card-icon" style="background:rgba(220,38,38,.1)">⚠</div><span class="card-title">Registered Gaps</span></div><div id="gaps-display-container" style="padding:1rem;"></div>';
      cards[0].parentNode.appendChild(displayCard);
    }
  }
  
  const displayContainer = document.getElementById('gaps-display-container');
  if (!displayContainer) return;
  
  if (window.gaps.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No gaps registered yet</div>';
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  const severityColors = {
    critical: '#dc2626',
    high: '#d97706',
    medium: '#0088ff',
    low: '#6b7280'
  };
  
  const html = window.gaps.map((gap, idx) => {
    const proc = window.processes.find(p => p.id === gap.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    const sevColor = severityColors[gap.severity] || '#6b7280';
    
    return `<div style="background:#fff;border-left:4px solid ${sevColor};border:1px solid #e5e5e5;border-left:4px solid ${sevColor};border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div style="font-weight:700;font-size:15px;">${gap.title}</div>
            <span style="font-size:11px;padding:3px 8px;background:${sevColor};color:white;border-radius:4px;text-transform:uppercase;font-weight:600;">${gap.severity}</span>
          </div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">Process: ${procName}</div>
          ${gap.current_state ? `<div style="font-size:13px;margin-top:8px;"><strong>Current:</strong> ${gap.current_state}</div>` : ''}
          ${gap.desired_state ? `<div style="font-size:13px;margin-top:5px;"><strong>Desired:</strong> ${gap.desired_state}</div>` : ''}
          ${gap.action ? `<div style="font-size:13px;margin-top:5px;color:#008f74;"><strong>Action:</strong> ${gap.action}</div>` : ''}
        </div>
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editGap('${gap.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteGap('${gap.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
  
  // Hide/show empty message
  if (typeof window.updateGapsEmptyMessage === 'function') {
    window.updateGapsEmptyMessage();
  }
};

// EDIT GAP
window.editGap = function(id) {
  const gap = window.gaps.find(g => g.id === id);
  if (!gap) return;
  
  const existing = document.getElementById('edit-gap-modal');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'edit-gap-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:600px;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  box.innerHTML = '<h2 style="margin-bottom:1.5rem;">✏ Edit Gap</h2><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Title *</label><input type="text" id="edit-gap-title" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Current State</label><textarea id="edit-gap-current" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"></textarea></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Desired State</label><textarea id="edit-gap-desired" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"></textarea></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Action</label><textarea id="edit-gap-action" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"></textarea></div><div style="margin-top:1.5rem;"><button id="save-gap-btn" style="background:#008f74;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">✓ Save Changes</button><button id="cancel-gap-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;margin-left:10px;font-size:14px;">Cancel</button></div>';
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  document.getElementById('edit-gap-title').value = gap.title || '';
  document.getElementById('edit-gap-current').value = gap.current_state || '';
  document.getElementById('edit-gap-desired').value = gap.desired_state || '';
  document.getElementById('edit-gap-action').value = gap.action || '';
  
  document.getElementById('save-gap-btn').onclick = async function() {
    const updates = {
      title: document.getElementById('edit-gap-title').value.trim(),
      current_state: document.getElementById('edit-gap-current').value.trim(),
      desired_state: document.getElementById('edit-gap-desired').value.trim(),
      action: document.getElementById('edit-gap-action').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await window.supabaseClient.from('gaps').update(updates).eq('id', id);
    
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    alert('✓ Gap updated successfully!');
    div.remove();
    await window.loadAllData();
  };
  
  document.getElementById('cancel-gap-btn').onclick = function() {
    div.remove();
  };
};

// DELETE GAP
window.deleteGap = async function(id) {
  if (!window.CAN_DELETE.includes(window.currentUser?.role)) {
    alert('You need Manager role or above to delete gaps.');
    return;
  }
  
  const gap = window.gaps.find(g => g.id === id);
  if (!gap) return;
  
  if (!confirm(`Delete gap "${gap.title}"?`)) return;
  
  const { error } = await window.supabaseClient.from('gaps').delete().eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Gap deleted successfully!');
  await window.loadAllData();
};

console.log('✅ gap.js loaded');

// UPDATE EMPTY MESSAGE VISIBILITY
window.updateGapsEmptyMessage = function() {
  const msg = document.getElementById('empty-gaps-msg');
  if (msg) {
    msg.style.display = window.gaps.length > 0 ? 'none' : 'block';
  }
};

// ROOT CAUSE ANALYSIS POPUP
window.openRootCauseAnalysis = function() {
  const existing = document.getElementById('rca-modal');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'rca-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:700px;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  box.innerHTML = `
    <h2 style="margin-bottom:1.5rem;">🐟 Root Cause Analysis (Ishikawa)</h2>
    
    <div style="margin:15px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Problem / Effect *</label>
      <input type="text" id="rca-problem" placeholder="What is the main problem?" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <h3 style="margin-top:20px;font-size:14px;font-weight:700;color:#666;">CAUSES (Multiple Categories)</h3>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">👥 People / Manpower</label>
      <textarea id="rca-people" rows="2" placeholder="Lack of training, insufficient staff..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">⚙️ Method / Process</label>
      <textarea id="rca-method" rows="2" placeholder="Unclear procedures, missing steps..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">🔧 Machine / Equipment</label>
      <textarea id="rca-machine" rows="2" placeholder="Old equipment, no maintenance..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">📦 Material / Input</label>
      <textarea id="rca-material" rows="2" placeholder="Poor quality, wrong specifications..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">📊 Measurement / Metrics</label>
      <textarea id="rca-measurement" rows="2" placeholder="No tracking, wrong KPIs..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">🌍 Environment</label>
      <textarea id="rca-environment" rows="2" placeholder="Temperature, noise, workspace..." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <h3 style="margin-top:20px;font-size:14px;font-weight:700;color:#666;">CONSEQUENCES</h3>
    <div style="margin:10px 0;">
      <textarea id="rca-consequences" rows="3" placeholder="Impact, costs, delays, quality issues..." style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:13px;"></textarea>
    </div>
    
    <div style="margin-top:1.5rem;display:flex;gap:10px;">
      <button id="generate-fishbone-btn" style="flex:1;background:#008f74;color:white;padding:12px;border:none;border-radius:6px;cursor:pointer;font-weight:700;">🐟 Generate Ishikawa Diagram</button>
      <button id="cancel-rca-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;">Cancel</button>
    </div>
  `;
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  document.getElementById('generate-fishbone-btn').onclick = function() {
    const rcaData = {
      problem: document.getElementById('rca-problem').value.trim(),
      people: document.getElementById('rca-people').value.trim(),
      method: document.getElementById('rca-method').value.trim(),
      machine: document.getElementById('rca-machine').value.trim(),
      material: document.getElementById('rca-material').value.trim(),
      measurement: document.getElementById('rca-measurement').value.trim(),
      environment: document.getElementById('rca-environment').value.trim(),
      consequences: document.getElementById('rca-consequences').value.trim()
    };
    
    if (!rcaData.problem) {
      alert('Please enter the main problem/effect');
      return;
    }
    
    // Store RCA data globally for the Graphs section
    window.currentRCA = rcaData;
    
    div.remove();
    alert('✓ Root Cause Analysis saved! Go to GRAPHS section to view the Ishikawa diagram.');
    
    // If graphs section exists, switch to it
    const graphsBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('Graphs'));
    if (graphsBtn) {
      graphsBtn.click();
    }
  };
  
  document.getElementById('cancel-rca-btn').onclick = function() {
    div.remove();
  };
};

// Alias for button compatibility
window.addRCRow = window.openRootCauseAnalysis;

// RENDER GAPS (WITH FILTER)
window.renderGaps = function() {
  const filterProc = document.getElementById('gap-filter-proc')?.value;
  
  const displayContainer = document.getElementById('gaps-display-container');
  if (!displayContainer) {
    window.renderGapsTable();
    return;
  }
  
  // Filter gaps by process if selected
  let filteredGaps = window.gaps;
  if (filterProc) {
    filteredGaps = window.gaps.filter(g => g.process_id === filterProc);
  }
  
  if (filteredGaps.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No gaps found for selected process</div>';
    if (typeof window.updateGapsEmptyMessage === 'function') window.updateGapsEmptyMessage();
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  const severityColors = {
    critical: '#dc2626',
    high: '#d97706',
    medium: '#0088ff',
    low: '#6b7280'
  };
  
  const html = filteredGaps.map((gap, idx) => {
    const proc = window.processes.find(p => p.id === gap.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    const sevColor = severityColors[gap.severity] || '#6b7280';
    
    return `<div style="background:#fff;border-left:4px solid ${sevColor};border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div style="font-weight:700;font-size:15px;">${gap.title}</div>
            <span style="font-size:11px;padding:3px 8px;background:${sevColor};color:white;border-radius:4px;text-transform:uppercase;font-weight:600;">${gap.severity}</span>
          </div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">Process: ${procName}</div>
          ${gap.current_state ? `<div style="font-size:13px;margin-top:8px;"><strong>Current:</strong> ${gap.current_state}</div>` : ''}
          ${gap.desired_state ? `<div style="font-size:13px;margin-top:5px;"><strong>Desired:</strong> ${gap.desired_state}</div>` : ''}
          ${gap.action ? `<div style="font-size:13px;margin-top:5px;color:#008f74;"><strong>Action:</strong> ${gap.action}</div>` : ''}
        </div>
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editGap('${gap.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteGap('${gap.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
  
  if (typeof window.updateGapsEmptyMessage === 'function') {
    window.updateGapsEmptyMessage();
  }
};
