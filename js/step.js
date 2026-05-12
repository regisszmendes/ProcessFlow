// ===========================================================
// STEP MANAGEMENT
// ===========================================================

// SAVE STEP
window.saveStep = async function () {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save steps.');
    return;
  }

  const procId = document.getElementById('step-proc-id').value;
  const name = document.getElementById('step-name').value.trim();

  if (!procId) {
    alert('Please select a Process first.');
    return;
  }

  if (!name) {
    alert('Step name is required.');
    return;
  }

  const stepData = {
    process_id: procId,
    name: name,
    description: document.getElementById('step-desc')?.value.trim() || '',
    responsible: document.getElementById('step-responsible')?.value.trim() || '',
    type: document.getElementById('step-type')?.value || 'task',
    system: document.getElementById('step-system')?.value.trim() || '',
    sla: document.getElementById('step-sla')?.value.trim() || '',
    status: document.getElementById('step-status')?.value || 'not-started',
    input: document.getElementById('step-input')?.value.trim() || '',
    output: document.getElementById('step-output')?.value.trim() || '',
    prev_step_id: document.getElementById('step-prev-id')?.value || null,
    is_start: document.getElementById('step-is-start')?.checked || false,
    is_end: document.getElementById('step-is-end')?.checked || false,
    branch_yes: document.getElementById('step-branch-yes')?.value.trim() || '',
    branch_no: document.getElementById('step-branch-no')?.value.trim() || '',
    created_by: window.currentUser.id
  };

  const { data, error} = await window.supabaseClient
    .from('steps')
    .insert([stepData])
    .select();

  if (error) {
    console.error('Error saving step:', error);
    alert('Error saving step: ' + error.message);
    return;
  }

  alert('✓ Step saved successfully!');
  clearStepForm();
  await window.loadAllData();
  
  // Render steps table
  if (typeof window.renderStepsTable === 'function') {
    window.renderStepsTable();
  }
};

// ALIAS for HTML compatibility
window.addStep = window.saveStep;

// CLEAR STEP FORM
window.clearStepForm = function () {
  [
    'step-name', 'step-desc', 'step-responsible', 'step-system',
    'step-sla', 'step-input', 'step-output', 'step-branch-yes', 'step-branch-no'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const typeEl = document.getElementById('step-type');
  if (typeEl) typeEl.value = 'task';
  
  const statusEl = document.getElementById('step-status');
  if (statusEl) statusEl.value = 'not-started';
  
  const startEl = document.getElementById('step-is-start');
  if (startEl) startEl.checked = false;
  
  const endEl = document.getElementById('step-is-end');
  if (endEl) endEl.checked = false;
};

// REFRESH PREVIOUS STEP DROPDOWN
window.refreshPrevStepDropdown = function () {
  const procId = document.getElementById('step-proc-id').value;
  const dropdown = document.getElementById('step-prev-id');
  
  if (!dropdown) return;
  
  if (!procId) {
    dropdown.innerHTML = '<option value="">— select process first —</option>';
    return;
  }
  
  const procSteps = window.steps.filter(s => s.process_id === procId);
  
  const opts = procSteps.map(s => 
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— none (first step) —</option>' + opts;
};

// TOGGLE DECISION FIELDS
window.toggleDecisionFields = function () {
  const type = document.getElementById('step-type')?.value;
  const decisionFields = document.getElementById('decision-fields');
  
  if (decisionFields) {
    decisionFields.style.display = (type === 'decision') ? 'contents' : 'none';
  }
};

// SIGNAL CHANGE
window.onSignalChange = function (signal) {
  if (signal === 'start') {
    const isStart = document.getElementById('step-is-start')?.checked;
    if (isStart) {
      const endEl = document.getElementById('step-is-end');
      if (endEl) endEl.checked = false;
    }
  } else if (signal === 'end') {
    const isEnd = document.getElementById('step-is-end')?.checked;
    if (isEnd) {
      const startEl = document.getElementById('step-is-start');
      if (startEl) startEl.checked = false;
    }
  }
};

// RENDER STEPS TABLE (WITH DECISION PATHS AND PROPER ORDERING)
window.renderStepsTable = function() {
  const container = document.getElementById('steps-display-container');
  
  // Create container if doesn't exist
  if (!container) {
    const stepsSection = document.getElementById('section-steps');
    if (!stepsSection) return;
    
    const cards = stepsSection.querySelectorAll('.card');
    if (cards.length > 0) {
      const displayCard = document.createElement('div');
      displayCard.className = 'card';
      displayCard.style.marginTop = '1.5rem';
      displayCard.innerHTML = '<div class="card-header"><div class="card-icon" style="background:rgba(0,143,116,.1)">📋</div><span class="card-title">Registered Steps</span></div><div id="steps-display-container" style="padding:1rem;"></div>';
      cards[0].parentNode.appendChild(displayCard);
    }
  }
  
  const displayContainer = document.getElementById('steps-display-container');
  if (!displayContainer) return;
  
  if (window.steps.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No steps registered yet</div>';
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  // SORT BY CREATION DATE (CHRONOLOGICAL ORDER)
  const sortedSteps = [...window.steps].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  const html = sortedSteps.map((step, idx) => {
    const proc = window.processes.find(p => p.id === step.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // DECISION PATHS DISPLAY
    let decisionPaths = '';
    if (step.type === 'decision') {
      const yesStep = window.steps.find(s => s.id === step.branch_yes);
      const noStep = window.steps.find(s => s.id === step.branch_no);
      decisionPaths = `
        <div style="margin-top:10px;padding:10px;background:#f0f9ff;border-left:3px solid #0088ff;border-radius:4px;">
          <div style="font-size:12px;font-weight:700;color:#0088ff;margin-bottom:5px;">🔀 Decision Paths:</div>
          ${step.branch_yes ? `<div style="font-size:12px;color:#059669;margin-top:3px;">✓ <strong>YES</strong> → ${yesStep ? yesStep.name : step.branch_yes}</div>` : '<div style="font-size:11px;color:#999;">✓ YES path not defined</div>'}
          ${step.branch_no ? `<div style="font-size:12px;color:#dc2626;margin-top:3px;">✗ <strong>NO</strong> → ${noStep ? noStep.name : step.branch_no}</div>` : '<div style="font-size:11px;color:#999;">✗ NO path not defined</div>'}
        </div>
      `;
    }
    
    return `<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:30px;height:30px;border-radius:50%;background:#008f74;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${idx + 1}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:15px;">${step.name}</div>
          <div style="font-size:12px;color:#666;margin-top:3px;">Process: ${procName}</div>
        </div>
        ${step.type ? `<span style="font-size:11px;padding:3px 8px;background:${step.type === 'decision' ? '#fef3c7' : '#e5e7eb'};color:${step.type === 'decision' ? '#92400e' : '#666'};border-radius:4px;text-transform:uppercase;font-weight:600;">${step.type}</span>` : ''}
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editStep('${step.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteStep('${step.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
      ${step.description ? `<div style="font-size:13px;color:#666;margin-top:10px;padding-left:40px;">${step.description}</div>` : ''}
      ${step.responsible ? `<div style="font-size:12px;color:#888;margin-top:5px;padding-left:40px;">👤 ${step.responsible}</div>` : ''}
      ${decisionPaths}
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
  
  // Hide/show empty message
  if (typeof window.updateStepsEmptyMessage === 'function') {
    window.updateStepsEmptyMessage();
  }
};

// EDIT STEP
window.editStep = function(id) {
  const step = window.steps.find(s => s.id === id);
  if (!step) return;
  
  const existing = document.getElementById('edit-step-modal');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'edit-step-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:600px;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  box.innerHTML = '<h2 style="margin-bottom:1.5rem;">✏ Edit Step</h2><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Step Name *</label><input type="text" id="edit-step-name" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Description</label><textarea id="edit-step-desc" rows="3" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea></div><div style="margin:10px 0;"><label style="display:block;margin-bottom:5px;font-weight:600;">Responsible</label><input type="text" id="edit-step-resp" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/></div><div style="margin-top:1.5rem;"><button id="save-step-btn" style="background:#008f74;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">✓ Save Changes</button><button id="cancel-step-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;margin-left:10px;font-size:14px;">Cancel</button></div>';
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  document.getElementById('edit-step-name').value = step.name || '';
  document.getElementById('edit-step-desc').value = step.description || '';
  document.getElementById('edit-step-resp').value = step.responsible || '';
  
  document.getElementById('save-step-btn').onclick = async function() {
    const updates = {
      name: document.getElementById('edit-step-name').value.trim(),
      description: document.getElementById('edit-step-desc').value.trim(),
      responsible: document.getElementById('edit-step-resp').value.trim(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await window.supabaseClient.from('steps').update(updates).eq('id', id);
    
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    alert('✓ Step updated successfully!');
    div.remove();
    await window.loadAllData();
  };
  
  document.getElementById('cancel-step-btn').onclick = function() {
    div.remove();
  };
};

// DELETE STEP
window.deleteStep = async function(id) {
  if (!window.CAN_DELETE.includes(window.currentUser?.role)) {
    alert('You need Manager role or above to delete steps.');
    return;
  }
  
  const step = window.steps.find(s => s.id === id);
  if (!step) return;
  
  if (!confirm(`Delete step "${step.name}"?`)) return;
  
  const { error } = await window.supabaseClient.from('steps').delete().eq('id', id);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  alert('✓ Step deleted successfully!');
  await window.loadAllData();
};

// UPDATE EMPTY MESSAGE VISIBILITY
window.updateStepsEmptyMessage = function() {
  const msg = document.getElementById('empty-steps-msg');
  if (msg) {
    msg.style.display = window.steps.length > 0 ? 'none' : 'block';
  }
};

// RENDER STEPS (WITH FILTER)
window.renderSteps = function() {
  const filterProc = document.getElementById('step-filter-proc')?.value;
  
  const displayContainer = document.getElementById('steps-display-container');
  if (!displayContainer) {
    window.renderStepsTable();
    return;
  }
  
  // Filter steps by process if selected
  let filteredSteps = window.steps;
  if (filterProc) {
    filteredSteps = window.steps.filter(s => s.process_id === filterProc);
  }
  
  if (filteredSteps.length === 0) {
    displayContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No steps found for selected process</div>';
    if (typeof window.updateStepsEmptyMessage === 'function') window.updateStepsEmptyMessage();
    return;
  }
  
  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);
  
  // SORT BY CREATION DATE
  const sortedSteps = [...filteredSteps].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  const html = sortedSteps.map((step, idx) => {
    const proc = window.processes.find(p => p.id === step.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // DECISION PATHS
    let decisionPaths = '';
    if (step.type === 'decision') {
      const yesStep = window.steps.find(s => s.id === step.branch_yes);
      const noStep = window.steps.find(s => s.id === step.branch_no);
      decisionPaths = `
        <div style="margin-top:10px;padding:10px;background:#f0f9ff;border-left:3px solid #0088ff;border-radius:4px;">
          <div style="font-size:12px;font-weight:700;color:#0088ff;margin-bottom:5px;">🔀 Decision Paths:</div>
          ${step.branch_yes ? `<div style="font-size:12px;color:#059669;margin-top:3px;">✓ <strong>YES</strong> → ${yesStep ? yesStep.name : step.branch_yes}</div>` : '<div style="font-size:11px;color:#999;">✓ YES path not defined</div>'}
          ${step.branch_no ? `<div style="font-size:12px;color:#dc2626;margin-top:3px;">✗ <strong>NO</strong> → ${noStep ? noStep.name : step.branch_no}</div>` : '<div style="font-size:11px;color:#999;">✗ NO path not defined</div>'}
        </div>
      `;
    }
    
    return `<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:30px;height:30px;border-radius:50%;background:#008f74;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${idx + 1}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:15px;">${step.name}</div>
          <div style="font-size:12px;color:#666;margin-top:3px;">Process: ${procName}</div>
        </div>
        ${step.type ? `<span style="font-size:11px;padding:3px 8px;background:${step.type === 'decision' ? '#fef3c7' : '#e5e7eb'};color:${step.type === 'decision' ? '#92400e' : '#666'};border-radius:4px;text-transform:uppercase;font-weight:600;">${step.type}</span>` : ''}
        <div style="display:flex;gap:5px;">
          ${canEdit ? `<button onclick="editStep('${step.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏</button>` : ''}
          ${canDelete ? `<button onclick="deleteStep('${step.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
        </div>
      </div>
      ${step.description ? `<div style="font-size:13px;color:#666;margin-top:10px;padding-left:40px;">${step.description}</div>` : ''}
      ${step.responsible ? `<div style="font-size:12px;color:#888;margin-top:5px;padding-left:40px;">👤 ${step.responsible}</div>` : ''}
      ${decisionPaths}
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
  
  if (typeof window.updateStepsEmptyMessage === 'function') {
    window.updateStepsEmptyMessage();
  }
};

console.log('✅ step.js with decision paths loaded');
