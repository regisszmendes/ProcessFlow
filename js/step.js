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
    step_type: document.getElementById('step-type')?.value || 'task',
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
    order_num: window.steps.filter(s => s.process_id === procId).length + 1,
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

console.log('✅ step.js loaded');
