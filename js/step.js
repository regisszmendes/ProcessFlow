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

  const { data, error } = await window.supabaseClient
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

// RENDER STEPS TABLE
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
  
  const html = window.steps.map((step, idx) => {
    const proc = window.processes.find(p => p.id === step.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    return `<div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:30px;height:30px;border-radius:50%;background:#008f74;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${idx + 1}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:15px;">${step.name}</div>
          <div style="font-size:12px;color:#666;margin-top:3px;">Process: ${procName}</div>
        </div>
        ${step.type ? `<span style="font-size:11px;padding:3px 8px;background:#e5e7eb;border-radius:4px;text-transform:uppercase;font-weight:600;color:#666;">${step.type}</span>` : ''}
      </div>
      ${step.description ? `<div style="font-size:13px;color:#666;margin-top:10px;padding-left:40px;">${step.description}</div>` : ''}
      ${step.responsible ? `<div style="font-size:12px;color:#888;margin-top:8px;padding-left:40px;">👤 Responsible: ${step.responsible}</div>` : ''}
      ${step.sla ? `<div style="font-size:12px;color:#888;margin-top:3px;padding-left:40px;">⏱ SLA: ${step.sla}</div>` : ''}
    </div>`;
  }).join('');
  
  displayContainer.innerHTML = html;
};

console.log('✅ step.js loaded');
