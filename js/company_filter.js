// ===========================================================
// COMPANY FILTERS FOR METRICS, AI, AND MONITORING
// ===========================================================

// METRICS SECTION FILTERS
// ========================================

// Refresh company dropdown in metrics
window.refreshMetricCompanyDropdown = function() {
  const dropdown = document.getElementById('metric-company-id');
  
  if (!dropdown) return;
  
  if (!window.companies || window.companies.length === 0) {
    dropdown.innerHTML = '<option value="">— no companies available —</option>';
    return;
  }
  
  const opts = window.companies.map(c => 
    `<option value="${c.id}">${c.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all companies —</option>' + opts;
  console.log(`✅ Loaded ${window.companies.length} companies into metrics filter`);
};

// When company changes, filter processes
window.onMetricCompanyChange = function() {
  refreshMetricProcessDropdown();
  refreshMetricStepDropdown();
};

// Update process dropdown to filter by company
window.refreshMetricProcessDropdown = function() {
  const companyId = document.getElementById('metric-company-id')?.value;
  const dropdown = document.getElementById('metric-proc-id');
  
  if (!dropdown) return;
  
  let filteredProcesses = window.processes || [];
  
  // Filter by company if selected
  if (companyId) {
    filteredProcesses = filteredProcesses.filter(p => p.company_id === companyId);
  }
  
  if (filteredProcesses.length === 0) {
    dropdown.innerHTML = '<option value="">— no processes available —</option>';
    refreshMetricStepDropdown();
    return;
  }
  
  const opts = filteredProcesses.map(p => 
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  refreshMetricStepDropdown();
};


// AI SECTION FILTERS
// ========================================

// Refresh company dropdown in AI
window.refreshAICompanyDropdown = function() {
  const dropdown = document.getElementById('ai-company-id');
  
  if (!dropdown) return;
  
  if (!window.companies || window.companies.length === 0) {
    dropdown.innerHTML = '<option value="">— no companies available —</option>';
    return;
  }
  
  const opts = window.companies.map(c => 
    `<option value="${c.id}">${c.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all companies —</option>' + opts;
  console.log(`✅ Loaded ${window.companies.length} companies into AI filter`);
};

// When company changes in AI, filter processes
window.onAICompanyChange = function() {
  refreshAIProcessDropdown();
  refreshAIStepDropdown();
  refreshAIMetricsDropdown();
};

// Update AI process dropdown to filter by company
window.refreshAIProcessDropdown = function() {
  const companyId = document.getElementById('ai-company-id')?.value;
  const dropdown = document.getElementById('ai-proc-id');
  
  if (!dropdown) return;
  
  let filteredProcesses = window.processes || [];
  
  if (companyId) {
    filteredProcesses = filteredProcesses.filter(p => p.company_id === companyId);
  }
  
  if (filteredProcesses.length === 0) {
    dropdown.innerHTML = '<option value="">— no processes available —</option>';
    return;
  }
  
  const opts = filteredProcesses.map(p => 
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— select process —</option>' + opts;
};


// MONITORING SECTION FILTERS
// ========================================

// Refresh company dropdown in monitoring
window.refreshMonitoringCompanyDropdown = function() {
  const dropdown = document.getElementById('monitoring-company-id');
  
  if (!dropdown) return;
  
  if (!window.companies || window.companies.length === 0) {
    dropdown.innerHTML = '<option value="">— no companies available —</option>';
    return;
  }
  
  const opts = window.companies.map(c => 
    `<option value="${c.id}">${c.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all companies —</option>' + opts;
  console.log(`✅ Loaded ${window.companies.length} companies into monitoring filter`);
};

// When company changes in monitoring, re-render dashboard
window.onMonitoringCompanyChange = function() {
  if (typeof renderMonitoringDashboard === 'function') {
    renderMonitoringDashboard();
  }
};

// Update renderMonitoringDashboard to filter by company
window.renderMonitoringDashboardFiltered = function() {
  const companyId = document.getElementById('monitoring-company-id')?.value;
  const container = document.getElementById('monitoring-dashboard');
  
  if (!container) return;
  
  if (!window.improvement_plans || window.improvement_plans.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#999;"><div style="font-size:3rem;margin-bottom:1rem;">📊</div><div style="font-size:1.2rem;font-weight:600;">No plans being monitored yet</div><div style="margin-top:0.5rem;">Generate an improvement plan in the IMPROVE section</div></div>';
    return;
  }

  let filteredPlans = window.improvement_plans.filter(p => p.status === 'monitoring');
  
  // Filter by company if selected
  if (companyId) {
    filteredPlans = filteredPlans.filter(p => {
      const proc = window.processes.find(pr => pr.id === p.process_id);
      return proc && proc.company_id === companyId;
    });
  }
  
  if (filteredPlans.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#999;"><div style="font-size:3rem;margin-bottom:1rem;">📊</div><div style="font-size:1.2rem;font-weight:600;">No plans for selected filter</div></div>';
    return;
  }

  // Call original rendering with filtered plans
  const originalPlans = window.improvement_plans;
  window.improvement_plans = filteredPlans;
  renderMonitoringDashboard();
  window.improvement_plans = originalPlans;
};

console.log('✅ company-filters.js loaded');
