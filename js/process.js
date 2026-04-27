// SAVE FUNCTION
window.saveProcess = async function () {
  if (!window.supabaseClient) {
    alert('Supabase not ready');
    return;
  }

  const data = {
    proc_id:       document.getElementById('proc-id').value,
    proc_name:     document.getElementById('proc-name').value,
    proc_dept:     document.getElementById('proc-dept').value,
    proc_owner:    document.getElementById('proc-owner').value,
    proc_priority: document.getElementById('proc-priority').value,
    proc_status:   document.getElementById('proc-status').value,
    proc_start:    document.getElementById('proc-start').value,
    proc_end:      document.getElementById('proc-end').value,
    proc_desc:     document.getElementById('proc-desc').value
  };

  const { error } = await window.supabaseClient
    .from('processes').insert([data]);

  if (error) {
    console.error('ERROR:', error);
    alert('Error saving process');
  } else {
    alert('Process saved!');
  }
};
