// ===========================================================
// COMPANY FILTER FOR STEPS AND GAPS SECTIONS
// ===========================================================

// FILTER PROCESSES BY COMPANY (FOR STEPS SECTION)
window.filterProcessesByCompany = function() {
  const companyId = document.getElementById('step-company-filter')?.value;
  const procDropdown = document.getElementById('step-proc-id');
  
  if (!procDropdown) return;
  
  let filteredProcs = window.processes;
  if (companyId) {
    filteredProcs = window.processes.filter(p => p.company_id == companyId); // Use == to handle both string and number
  }
  
  const opts = filteredProcs.map(p => 
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
  
  procDropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  
  // Clear previous step dropdown
  const prevStepDropdown = document.getElementById('step-prev-id');
  if (prevStepDropdown) {
    prevStepDropdown.innerHTML = '<option value="">— select process first —</option>';
  }
  
  console.log('✅ Filtered processes for company:', filteredProcs.length);
};

// POPULATE COMPANY DROPDOWNS
window.populateCompanyDropdowns = function() {
  // Step section company filter
  const stepCompanyFilter = document.getElementById('step-company-filter');
  if (stepCompanyFilter && window.companies) {
    const opts = window.companies.map(c => 
      `<option value="${c.id}">${c.name}</option>`
    ).join('');
    stepCompanyFilter.innerHTML = '<option value="">All Companies</option>' + opts;
  }
  
  // Gap section company filter (if exists)
  const gapCompanyFilter = document.getElementById('gap-company-filter');
  if (gapCompanyFilter && window.companies) {
    const opts = window.companies.map(c => 
      `<option value="${c.id}">${c.name}</option>`
    ).join('');
    gapCompanyFilter.innerHTML = '<option value="">All Companies</option>' + opts;
  }
  
  console.log('✅ Company dropdowns populated');
};

console.log('✅ company_filter.js loaded');
