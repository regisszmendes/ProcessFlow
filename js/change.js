// ===========================================================
// CHANGE MANAGEMENT - ADKAR
// ===========================================================

window.updateAdkarLabel = function (dim, val) {
  const label = document.getElementById(`chg-${dim}-val`);
  if (label) label.textContent = val;
};

window.populateChangeDropdowns = function () {
  // Company dropdown
  const coSel = document.getElementById('chg-company-id');
  const coOpts = companies.map(c => `<option value="${c.id}">[${c.biz_id}] ${c.name}</option>`).join('');
  if (coSel) {
    const v = coSel.value;
    coSel.innerHTML = '<option value="">— select company —</option>' + coOpts;
    if (v) coSel.value = v;
  }

  // Filter company dropdown
  const filterCoSel = document.getElementById('change-filter-company');
  if (filterCoSel) {
    const v = filterCoSel.value;
    filterCoSel.innerHTML = '<option value="">All Companies</option>' + coOpts;
    if (v) filterCoSel.value = v;
  }

  // Project dropdown
  const projSel = document.getElementById('chg-proj-id');
  if (projSel) {
    const projOpts = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const v = projSel.value;
    projSel.innerHTML = '<option value="">— none —</option>' + projOpts;
    if (v) projSel.value = v;
  }
};

window.filterChangeProcesses = function () {
  const companyId = document.getElementById('chg-company-id').value;
  const procSel = document.getElementById('chg-proc-id');
  if (!procSel) return;

  const filtered = companyId
    ? processes.filter(p => p.company_id == companyId)
    : processes;

  procSel.innerHTML = '<option value="">— select process —</option>' +
    filtered.map(p => `<option value="${p.id}">[${p.proc_id}] ${p.name}</option>`).join('');
};

window.filterChangeByCompany = function () {
  const companyId = document.getElementById('change-filter-company').value;
  const procSel = document.getElementById('change-filter-process');
  if (!procSel) return;

  const filtered = companyId
    ? processes.filter(p => p.company_id == companyId)
    : processes;

  const v = procSel.value;
  procSel.innerHTML = '<option value="">All Processes</option>' +
    filtered.map(p => `<option value="${p.id}">[${p.proc_id}] ${p.name}</option>`).join('');
  if (v) procSel.value = v;

  renderChangeEntries();
};

window.saveChangeEntry = async function () {
  if (!CAN_EDIT.includes(currentUser?.role)) {
    alert('Editors or above can register change assessments.');
    return;
  }

  const companyId = document.getElementById('chg-company-id').value;
  const procId = document.getElementById('chg-proc-id').value;
  const stakeholder = document.getElementById('chg-stakeholder').value.trim();

  if (!companyId || !procId || !stakeholder) {
    alert('Company, Process and Stakeholder are required.');
    return;
  }

  const changeData = {
    company_id: companyId,
    process_id: procId,
    stakeholder: stakeholder,
    assessment_date: document.getElementById('chg-date').value || new Date().toISOString().split('T')[0],
    assessor: document.getElementById('chg-assessor').value.trim() || currentUser.name,
    project_id: document.getElementById('chg-proj-id').value || null,
    awareness: parseInt(document.getElementById('chg-awareness').value),
    desire: parseInt(document.getElementById('chg-desire').value),
    knowledge: parseInt(document.getElementById('chg-knowledge').value),
    ability: parseInt(document.getElementById('chg-ability').value),
    reinforcement: parseInt(document.getElementById('chg-reinforcement').value),
    notes: document.getElementById('chg-notes').value.trim(),
    actions: document.getElementById('chg-actions').value.trim(),
    created_by: currentUser.id
  };

  const { data, error } = await window.supabaseClient
    .from('change_entries')
    .insert([changeData])
    .select();

  if (error) {
    console.error('Error saving change entry:', error);
    alert('Error saving assessment: ' + error.message);
    return;
  }

  alert('✓ Change assessment saved successfully!');
  changeEntries.unshift(data[0]);
  clearChangeForm();
  renderChangeEntries();
  document.getElementById('change-table-card').style.display = 'block';
};

window.clearChangeForm = function () {
  ['chg-stakeholder', 'chg-date', 'chg-assessor', 'chg-notes', 'chg-actions'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('chg-company-id').value = '';
  document.getElementById('chg-proc-id').innerHTML = '<option value="">— select process —</option>';
  document.getElementById('chg-proj-id').value = '';

  ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'].forEach(dim => {
    const slider = document.getElementById(`chg-${dim}`);
    const label = document.getElementById(`chg-${dim}-val`);
    if (slider) slider.value = 3;
    if (label) label.textContent = 3;
  });
};

window.deleteChangeEntry = async function (id) {
  if (!CAN_DELETE.includes(currentUser?.role)) {
    alert('Managers or above can delete.');
    return;
  }

  if (!confirm('Delete this change assessment?')) return;

  const { error } = await window.supabaseClient
    .from('change_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting change entry:', error);
    alert('Error deleting: ' + error.message);
    return;
  }

  changeEntries = changeEntries.filter(c => c.id !== id);
  renderChangeEntries();

  if (!changeEntries.length) {
    document.getElementById('change-table-card').style.display = 'none';
  }
};

window.renderChangeEntries = function () {
  const list = document.getElementById('change-entries-list');
  const tbody = document.getElementById('change-table-body');

  if (!list || !tbody) return;

  const filterCompany = document.getElementById('change-filter-company')?.value || '';
  const filterProcess = document.getElementById('change-filter-process')?.value || '';

  let filtered = changeEntries;
  if (filterCompany) {
    const companyProcs = processes.filter(p => p.company_id == filterCompany).map(p => p.id);
    filtered = filtered.filter(c => companyProcs.includes(c.process_id));
  }
  if (filterProcess) {
    filtered = filtered.filter(c => c.process_id == filterProcess);
  }

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">🔄</div><div class="es-text">No change assessments yet.</div></div>';
    document.getElementById('change-table-card').style.display = 'none';
    renderAdkarSummary();
    return;
  }

  document.getElementById('change-table-card').style.display = 'block';

  const ce = CAN_EDIT.includes(currentUser?.role);
  const cd = CAN_DELETE.includes(currentUser?.role);

  const dimColors = {
    awareness: '#0088ff',
    desire: '#00d4aa',
    knowledge: '#f59e0b',
    ability: '#a855f7',
    reinforcement: '#22c55e'
  };

  list.innerHTML = filtered.map(c => {
    const proc = processes.find(p => p.id == c.process_id);
    const co = proc?.companies;
    const avg = ((c.awareness + c.desire + c.knowledge + c.ability + c.reinforcement) / 5).toFixed(1);
    const avgPct = (avg / 5 * 100).toFixed(0);
    const avgColor = avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : '#dc2626';

    return `<div class="card" style="margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:.5rem">
            ${co ? `<span class="badge badge-teal" style="font-size:.65rem">${co.biz_id}</span>` : ''}
            ${proc ? `<span style="font-family:var(--mono);font-size:.75rem;color:var(--accent);font-weight:700">${proc.proc_id}</span>` : ''}
            <span style="font-size:.82rem;color:var(--text3)">·</span>
            <span style="font-size:.72rem;color:var(--text3)">Assessed ${c.assessment_date}</span>
          </div>
          <div style="font-weight:700;font-size:1rem;margin-bottom:.3rem">${c.stakeholder}</div>
          <div style="font-size:.78rem;color:var(--text3)">Assessed by <strong style="color:var(--text2)">${c.assessor}</strong></div>
        </div>
        <div style="text-align:center;padding:.8rem 1rem;background:${avgColor}10;border:2px solid ${avgColor}40;border-radius:var(--radius2)">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:${avgColor};font-weight:700;margin-bottom:4px">Overall</div>
          <div style="font-family:var(--mono);font-size:1.6rem;font-weight:900;color:${avgColor}">${avg}</div>
          <div style="font-size:.7rem;color:var(--text3)">${avgPct}%</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.6rem;margin-bottom:1rem">
        ${['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'].map(dim => {
      const score = c[dim];
      const pct = (score / 5 * 100).toFixed(0);
      const color = dimColors[dim];
      const label = dim.charAt(0).toUpperCase();
      return `<div style="text-align:center;padding:.6rem;background:${color}08;border:1px solid ${color}20;border-radius:6px">
            <div style="font-size:.7rem;font-weight:700;color:${color};margin-bottom:4px">${label}</div>
            <div style="font-family:var(--mono);font-size:1.2rem;font-weight:700;color:${color}">${score}</div>
            <div style="font-size:.65rem;color:var(--text3)">${pct}%</div>
          </div>`;
    }).join('')}
      </div>

      ${c.notes ? `<div style="margin-bottom:.8rem"><div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);margin-bottom:4px">Observations</div><div style="font-size:.83rem;color:var(--text2);line-height:1.6">${c.notes}</div></div>` : ''}
      ${c.actions ? `<div style="margin-bottom:.8rem"><div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent);margin-bottom:4px">Recommended Actions</div><div style="font-size:.83rem;color:var(--text2);line-height:1.6">${c.actions}</div></div>` : ''}

      ${cd ? `<button class="btn btn-danger" style="padding:4px 10px;font-size:.7rem" onclick="deleteChangeEntry(${c.id})">✕ Delete</button>` : ''}
    </div>`;
  }).join('');

  // Table
  tbody.innerHTML = filtered.map(c => {
    const proc = processes.find(p => p.id == c.process_id);
    const co = proc?.companies;
    const avg = ((c.awareness + c.desire + c.knowledge + c.ability + c.reinforcement) / 5).toFixed(1);

    return `<tr>
      <td>${co ? `<span style="font-family:var(--mono);font-size:.7rem;color:var(--accent2);font-weight:700">${co.biz_id}</span>` : '—'}</td>
      <td>${proc ? `<span style="font-family:var(--mono);font-size:.72rem;color:var(--accent);font-weight:700">${proc.proc_id}</span>` : '—'}</td>
      <td><strong>${c.stakeholder}</strong></td>
      <td style="font-size:.75rem">${c.assessment_date}</td>
      <td style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${dimColors.awareness}">${c.awareness}</td>
      <td style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${dimColors.desire}">${c.desire}</td>
      <td style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${dimColors.knowledge}">${c.knowledge}</td>
      <td style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${dimColors.ability}">${c.ability}</td>
      <td style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${dimColors.reinforcement}">${c.reinforcement}</td>
      <td style="font-family:var(--mono);font-size:.82rem;font-weight:700;color:var(--accent2)">${avg}</td>
      <td>${cd ? `<button class="btn btn-danger" style="padding:3px 9px" onclick="deleteChangeEntry(${c.id})">✕</button>` : '—'}</td>
    </tr>`;
  }).join('');

  renderAdkarSummary();
};

window.renderAdkarSummary = function () {
  const summaryGrid = document.getElementById('adkar-summary-grid');
  const progressBars = document.getElementById('adkar-progress-bars');

  if (!summaryGrid || !progressBars) return;

  const filterCompany = document.getElementById('change-filter-company')?.value || '';
  const filterProcess = document.getElementById('change-filter-process')?.value || '';

  let filtered = changeEntries;
  if (filterCompany) {
    const companyProcs = processes.filter(p => p.company_id == filterCompany).map(p => p.id);
    filtered = filtered.filter(c => companyProcs.includes(c.process_id));
  }
  if (filterProcess) {
    filtered = filtered.filter(c => c.process_id == filterProcess);
  }

  if (!filtered.length) {
    summaryGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:2rem">No assessments to display.</div>';
    progressBars.innerHTML = '';
    return;
  }

  const dims = ['awareness', 'desire', 'knowledge', 'ability', 'reinforcement'];
  const averages = {};

  dims.forEach(dim => {
    const sum = filtered.reduce((s, c) => s + c[dim], 0);
    averages[dim] = (sum / filtered.length).toFixed(1);
  });

  const overallAvg = (Object.values(averages).reduce((s, v) => s + parseFloat(v), 0) / 5).toFixed(1);

  const dimLabels = {
    awareness: { label: 'Awareness', color: '#0088ff', icon: 'A' },
    desire: { label: 'Desire', color: '#00d4aa', icon: 'D' },
    knowledge: { label: 'Knowledge', color: '#f59e0b', icon: 'K' },
    ability: { label: 'Ability', color: '#a855f7', icon: 'A' },
    reinforcement: { label: 'Reinforcement', color: '#22c55e', icon: 'R' }
  };

  summaryGrid.innerHTML = dims.map(dim => {
    const cfg = dimLabels[dim];
    const score = averages[dim];
    const pct = (score / 5 * 100).toFixed(0);
    return `<div class="summary-stat" style="align-items:center;text-align:center;border-color:${cfg.color}40;background:${cfg.color}08">
      <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:${cfg.color};margin-bottom:.4rem">${cfg.icon} — ${cfg.label}</div>
      <div class="summary-stat-val" style="color:${cfg.color}">${score}</div>
      <div style="font-size:.68rem;color:var(--text3)">${pct}% readiness</div>
    </div>`;
  }).join('') + `<div class="summary-stat" style="align-items:center;text-align:center;border-color:var(--accent2);background:rgba(0,136,255,.05)">
    <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--accent2);margin-bottom:.4rem">Overall</div>
    <div class="summary-stat-val" style="color:var(--accent2)">${overallAvg}</div>
    <div style="font-size:.68rem;color:var(--text3)">${(overallAvg / 5 * 100).toFixed(0)}% avg</div>
  </div>`;

  progressBars.innerHTML = dims.map(dim => {
    const cfg = dimLabels[dim];
    const score = averages[dim];
    const pct = (score / 5 * 100).toFixed(0);
    return `<div style="display:flex;align-items:center;gap:1rem">
      <div style="min-width:120px;font-size:.82rem;font-weight:600;color:${cfg.color}">${cfg.icon} — ${cfg.label}</div>
      <div style="flex:1;height:24px;background:var(--surface2);border-radius:12px;overflow:hidden;border:1px solid var(--border)">
        <div style="height:100%;background:${cfg.color};width:${pct}%;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;transition:width .5s">
          <span style="font-size:.7rem;font-weight:700;color:#fff">${score}/5</span>
        </div>
      </div>
      <span style="font-family:var(--mono);font-size:.78rem;min-width:40px;text-align:right;color:var(--text3)">${pct}%</span>
    </div>`;
  }).join('');
};
