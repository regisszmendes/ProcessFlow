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

console.log('✅ gap.js loaded');
