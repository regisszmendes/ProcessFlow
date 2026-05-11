// ===========================================================
// GAP MANAGEMENT
// ===========================================================

// SAVE GAP
window.saveGap = async function () {
  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save gaps.');
    return;
  }

  const procId = document.getElementById('gap-proc-id').value;
  const title = document.getElementById('gap-title').value.trim();
  const desc = document.getElementById('gap-desc').value.trim();

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
    title: title,
    description: desc,
    category: document.getElementById('gap-category').value,
    severity: document.getElementById('gap-severity').value,
    impact: document.getElementById('gap-impact').value.trim(),
    root_cause: document.getElementById('gap-cause').value.trim(),
    recommendation: document.getElementById('gap-recommendation').value.trim(),
    status: document.getElementById('gap-status').value,
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
};

// CLEAR GAP FORM
window.clearGapForm = function () {
  [
    'gap-title', 'gap-desc', 'gap-impact', 'gap-cause', 'gap-recommendation'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('gap-category').value = '';
  document.getElementById('gap-severity').value = 'medium';
  document.getElementById('gap-status').value = 'open';
};

console.log('✅ gap.js loaded');
