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
    branch_yes: document.getElementById('step-branch-yes-id')?.value || null,
    branch_no: document.getElementById('step-branch-no-id')?.value || null,
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
    'step-sla', 'step-input', 'step-output'
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
  
  // Clear branch dropdowns
  const yesDropdown = document.getElementById('step-branch-yes-id');
  if (yesDropdown) yesDropdown.value = '';
  
  const noDropdown = document.getElementById('step-branch-no-id');
  if (noDropdown) noDropdown.value = '';
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

// TOGGLE DECISION FIELDS - NOW ONLY SHOWS YES/NO WHEN TYPE = DECISION
window.toggleDecisionFields = function () {
  const type = document.getElementById('step-type')?.value;
  const branchFields = document.getElementById('branch-fields');
  
  if (branchFields) {
    // Only show if type is 'decision'
    branchFields.style.display = (type === 'decision') ? 'contents' : 'none';
  }
  
  // Populate branch dropdowns with existing steps from same process
  if (type === 'decision') {
    const procId = document.getElementById('step-proc-id')?.value;
    if (procId) {
      const procSteps = window.steps.filter(s => s.process_id === procId);
      
      const opts = procSteps.map(s => 
        `<option value="${s.id}">${s.name}</option>`
      ).join('');
      
      const yesDropdown = document.getElementById('step-branch-yes-id');
      const noDropdown = document.getElementById('step-branch-no-id');
      
      if (yesDropdown) {
        yesDropdown.innerHTML = '<option value="">— select YES step —</option>' + opts;
      }
      if (noDropdown) {
        noDropdown.innerHTML = '<option value="">— select NO step —</option>' + opts;
      }
    }
  }
};

// SIGNAL CHANGE - PREVENTS SELECTING BOTH START AND END
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
  
  // SORT BY CREATION DATE
  const sortedSteps = [...window.steps].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  const html = sortedSteps.map((step, idx) => {
    const proc = window.processes.find(p => p.id === step.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // DECISION PATHS - ONLY FOR DECISION TYPE
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

// EDIT STEP - NOW WITH ALL FIELDS INCLUDING SYSTEM, SLA, INPUT, OUTPUT, STATUS, TYPE, BRANCHES
window.editStep = function(id) {
  const step = window.steps.find(s => s.id === id);
  if (!step) return;
  
  const existing = document.getElementById('edit-step-modal');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'edit-step-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:700px;max-width:100%;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  
  // Get all steps from same process for branch dropdowns
  const procSteps = window.steps.filter(s => s.process_id === step.process_id && s.id !== id);
  const branchOpts = procSteps.map(s => 
    `<option value="${s.id}" ${step.branch_yes === s.id || step.branch_no === s.id ? 'selected' : ''}>${s.name}</option>`
  ).join('');
  
  box.innerHTML = `
    <h2 style="margin-bottom:1.5rem;">✏ Edit Step</h2>
    
    <!-- Name -->
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Step Name *</label>
      <input type="text" id="edit-step-name" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <!-- Description -->
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Description</label>
      <textarea id="edit-step-desc" rows="3" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
    </div>
    
    <!-- Two columns: Responsible | System -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Responsible</label>
        <input type="text" id="edit-step-resp" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">System</label>
        <input type="text" id="edit-step-system" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
      </div>
    </div>
    
    <!-- Two columns: Type | Status -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Type</label>
        <select id="edit-step-type" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;" onchange="toggleEditBranchFields()">
          <option value="task">Task</option>
          <option value="decision">Decision</option>
          <option value="automation">Automation</option>
          <option value="approval">Approval</option>
        </select>
      </div>
      <div>
        <label style="display:block;margin-bottom:5px;font-weight:600;">Status</label>
        <select id="edit-step-status" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>
    
    <!-- SLA -->
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">SLA (e.g., 2 hours, 1 day)</label>
      <input type="text" id="edit-step-sla" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;"/>
    </div>
    
    <!-- Input -->
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Input</label>
      <textarea id="edit-step-input" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
    </div>
    
    <!-- Output -->
    <div style="margin:10px 0;">
      <label style="display:block;margin-bottom:5px;font-weight:600;">Output</label>
      <textarea id="edit-step-output" rows="2" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
    </div>
    
    <!-- Start/End checkboxes -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0;">
      <div>
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="edit-step-is-start" style="margin-right:8px;" onchange="onEditSignalChange('start')"/>
          <span style="font-weight:600;">Start Point</span>
        </label>
      </div>
      <div>
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="edit-step-is-end" style="margin-right:8px;" onchange="onEditSignalChange('end')"/>
          <span style="font-weight:600;">End Point</span>
        </label>
      </div>
    </div>
    
    <!-- DECISION BRANCHES - SHOWN ONLY IF TYPE = DECISION -->
    <div id="edit-branch-fields" style="display:none;margin:15px 0;padding:15px;background:#f0f9ff;border-radius:8px;border:2px solid #0088ff;">
      <h3 style="margin:0 0 10px 0;font-size:14px;color:#0088ff;font-weight:700;">🔀 Decision Paths</h3>
      
      <div style="margin:10px 0;">
        <label style="display:block;margin-bottom:5px;font-weight:600;color:#059669;">✓ YES Path</label>
        <select id="edit-step-branch-yes" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
          <option value="">— select YES step —</option>
          ${branchOpts}
        </select>
      </div>
      
      <div style="margin:10px 0;">
        <label style="display:block;margin-bottom:5px;font-weight:600;color:#dc2626;">✗ NO Path</label>
        <select id="edit-step-branch-no" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;">
          <option value="">— select NO step —</option>
          ${branchOpts}
        </select>
      </div>
    </div>
    
    <!-- Buttons -->
    <div style="margin-top:1.5rem;display:flex;gap:10px;">
      <button id="save-step-btn" style="flex:1;background:#008f74;color:white;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">✓ Save Changes</button>
      <button id="cancel-step-btn" style="background:#e5e7eb;color:#333;padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;">Cancel</button>
    </div>
  `;
  
  div.appendChild(box);
  document.body.appendChild(div);
  
  // Populate fields with current values
  document.getElementById('edit-step-name').value = step.name || '';
  document.getElementById('edit-step-desc').value = step.description || '';
  document.getElementById('edit-step-resp').value = step.responsible || '';
  document.getElementById('edit-step-system').value = step.system || '';
  document.getElementById('edit-step-type').value = step.type || 'task';
  document.getElementById('edit-step-status').value = step.status || 'not-started';
  document.getElementById('edit-step-sla').value = step.sla || '';
  document.getElementById('edit-step-input').value = step.input || '';
  document.getElementById('edit-step-output').value = step.output || '';
  document.getElementById('edit-step-is-start').checked = step.is_start || false;
  document.getElementById('edit-step-is-end').checked = step.is_end || false;
  
  // Set branch values if they exist
  if (step.branch_yes) {
    document.getElementById('edit-step-branch-yes').value = step.branch_yes;
  }
  if (step.branch_no) {
    document.getElementById('edit-step-branch-no').value = step.branch_no;
  }
  
  // Show/hide branch fields based on type
  toggleEditBranchFields();
  
  // Save button
  document.getElementById('save-step-btn').onclick = async function() {
    const updates = {
      name: document.getElementById('edit-step-name').value.trim(),
      description: document.getElementById('edit-step-desc').value.trim(),
      responsible: document.getElementById('edit-step-resp').value.trim(),
      system: document.getElementById('edit-step-system').value.trim(),
      type: document.getElementById('edit-step-type').value,
      status: document.getElementById('edit-step-status').value,
      sla: document.getElementById('edit-step-sla').value.trim(),
      input: document.getElementById('edit-step-input').value.trim(),
      output: document.getElementById('edit-step-output').value.trim(),
      is_start: document.getElementById('edit-step-is-start').checked,
      is_end: document.getElementById('edit-step-is-end').checked,
      branch_yes: document.getElementById('edit-step-branch-yes').value || null,
      branch_no: document.getElementById('edit-step-branch-no').value || null,
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
  
  // Cancel button
  document.getElementById('cancel-step-btn').onclick = function() {
    div.remove();
  };
};

// TOGGLE BRANCH FIELDS IN EDIT MODAL
window.toggleEditBranchFields = function() {
  const type = document.getElementById('edit-step-type')?.value;
  const branchFields = document.getElementById('edit-branch-fields');
  
  if (branchFields) {
    branchFields.style.display = (type === 'decision') ? 'block' : 'none';
  }
};

// SIGNAL CHANGE FOR EDIT MODAL - PREVENTS SELECTING BOTH START AND END
window.onEditSignalChange = function (signal) {
  if (signal === 'start') {
    const isStart = document.getElementById('edit-step-is-start')?.checked;
    if (isStart) {
      const endEl = document.getElementById('edit-step-is-end');
      if (endEl) endEl.checked = false;
    }
  } else if (signal === 'end') {
    const isEnd = document.getElementById('edit-step-is-end')?.checked;
    if (isEnd) {
      const startEl = document.getElementById('edit-step-is-start');
      if (startEl) startEl.checked = false;
    }
  }
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
    
    // DECISION PATHS - ONLY FOR DECISION TYPE
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

console.log('✅ step.js with YES/NO buttons and extended edit fields loaded');
