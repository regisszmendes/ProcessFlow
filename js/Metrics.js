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
