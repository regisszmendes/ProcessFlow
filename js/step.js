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
  const desc = document.getElementById('step-desc').value.trim();

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
    description: desc,
    actor: document.getElementById('step-actor').value.trim(),
    duration: document.getElementById('step-duration').value.trim(),
    tools: document.getElementById('step-tools').value.trim(),
    inputs: document.getElementById('step-inputs').value.trim(),
    outputs: document.getElementById('step-outputs').value.trim(),
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

// CLEAR STEP FORM
window.clearStepForm = function () {
  [
    'step-name', 'step-desc', 'step-actor', 'step-duration',
    'step-tools', 'step-inputs', 'step-outputs'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
};

console.log('✅ step.js loaded');
