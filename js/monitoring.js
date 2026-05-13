// ===========================================================
// MONITORING SECTION - Track Improvement Plans & KPIs
// ===========================================================

// SAVE PLAN FROM AI (called from ai-complete.js)
window.savePlanToMonitoring = async function() {
  if (!window.currentAIPlan) {
    alert('No plan to save. Generate a plan first.');
    return;
  }

  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save plans.');
    return;
  }

  const proc = window.processes.find(p => p.id === window.currentAIPlan.process_id);
  const defaultTitle = `Improvement Plan - ${proc?.name || 'Process'} - ${new Date().toLocaleDateString()}`;

  const title = prompt('Enter a title for this improvement plan:', defaultTitle);
  if (!title) return;

  // Parse the AI content to extract sections
  const sections = parseAIPlan(window.currentAIPlan.content);

  const planData = {
    process_id: window.currentAIPlan.process_id,
    step_id: window.currentAIPlan.step_id,
    metric_id: window.currentAIPlan.metric_id,
    title: title,
    content: window.currentAIPlan.content,
    model: window.currentAIPlan.model,
    status: 'monitoring',
    executive_summary: sections.executiveSummary || '',
    key_issues: sections.keyIssues || '',
    recommendations: sections.recommendations || '',
    quick_wins: sections.quickWins || '',
    medium_term: sections.mediumTerm || '',
    success_metrics: sections.successMetrics || '',
    roadmap: sections.roadmap || '',
    created_by: window.currentUser.id,
    generated_at: window.currentAIPlan.generated_at
  };

  try {
    const { data, error } = await window.supabaseClient
      .from('improvement_plans')
      .insert([planData])
      .select();

    if (error) throw error;

    alert('✅ Plan saved to MONITORING section! You can now track progress and metrics.');
    
    window.currentAIPlan = null;
    await window.loadAllData();
    
    // Switch to monitoring section
    const monitoringBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('Monitor'));
    if (monitoringBtn) {
      monitoringBtn.click();
    }

  } catch (error) {
    console.error('Save error:', error);
    alert('Error saving plan: ' + error.message);
  }
};

// PARSE AI PLAN INTO SECTIONS
function parseAIPlan(content) {
  const sections = {};
  
  // Try to extract sections based on markdown headers
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent = [];
  
  lines.forEach(line => {
    if (line.match(/^##\s*(EXECUTIVE SUMMARY|Executive Summary)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'executiveSummary';
      currentContent = [];
    } else if (line.match(/^##\s*(KEY ISSUES|Key Issues Identified)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'keyIssues';
      currentContent = [];
    } else if (line.match(/^##\s*(IMPROVEMENT RECOMMENDATIONS|Recommendations)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'recommendations';
      currentContent = [];
    } else if (line.match(/^##\s*(QUICK WINS|Quick Wins)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'quickWins';
      currentContent = [];
    } else if (line.match(/^##\s*(MEDIUM-TERM|Medium-term Actions)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'mediumTerm';
      currentContent = [];
    } else if (line.match(/^##\s*(SUCCESS METRICS|Success Metrics)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'successMetrics';
      currentContent = [];
    } else if (line.match(/^##\s*(ROADMAP|Implementation Roadmap)/i)) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'roadmap';
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  });
  
  if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
  
  return sections;
}

// RENDER MONITORING DASHBOARD
window.renderMonitoringDashboard = function() {
  const container = document.getElementById('monitoring-dashboard');
  
  if (!container) return;
  
  if (!window.improvement_plans || window.improvement_plans.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#999;"><div style="font-size:3rem;margin-bottom:1rem;">📊</div><div style="font-size:1.2rem;font-weight:600;">No plans being monitored yet</div><div style="margin-top:0.5rem;">Generate an improvement plan in the IMPROVE section</div></div>';
    return;
  }

  const monitoringPlans = window.improvement_plans.filter(p => p.status === 'monitoring');
  
  if (monitoringPlans.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:#999;"><div style="font-size:3rem;margin-bottom:1rem;">📊</div><div style="font-size:1.2rem;font-weight:600;">No plans being monitored yet</div></div>';
    return;
  }

  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);

  const html = monitoringPlans.map(plan => {
    const proc = window.processes.find(p => p.id === plan.process_id);
    const procName = proc ? proc.name : 'Unknown Process';
    
    // Get KPI entries for this plan
    const kpis = window.plan_kpis ? window.plan_kpis.filter(k => k.plan_id === plan.id) : [];
    const completedKPIs = kpis.filter(k => k.status === 'achieved').length;
    const progress = kpis.length > 0 ? Math.round((completedKPIs / kpis.length) * 100) : 0;

    return `
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="card-header" style="cursor:pointer;" onclick="togglePlanDetails('${plan.id}')">
          <div style="display:flex;align-items:center;gap:1rem;flex:1;">
            <div class="card-icon" style="background:rgba(0,143,116,.1)">📋</div>
            <div style="flex:1;">
              <div class="card-title">${plan.title}</div>
              <div style="font-size:12px;color:#666;margin-top:4px;">
                📊 ${procName} • Generated: ${new Date(plan.generated_at).toLocaleDateString()}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:24px;font-weight:700;color:${progress >= 75 ? '#059669' : progress >= 50 ? '#0088ff' : progress >= 25 ? '#f59e0b' : '#dc2626'};">${progress}%</div>
              <div style="font-size:11px;color:#666;">Progress</div>
            </div>
          </div>
        </div>
        
        <div id="plan-details-${plan.id}" style="display:none;padding:1.5rem;border-top:1px solid #e5e5e5;">
          ${plan.executive_summary || plan.quick_wins || plan.medium_term ? `
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;">
            <!-- Left: Plan Sections -->
            <div>
              ${plan.executive_summary ? `
              <div style="margin-bottom:1.5rem;">
                <h4 style="color:#7c3aed;font-size:15px;margin-bottom:0.5rem;">Executive Summary</h4>
                <div style="font-size:13px;line-height:1.6;color:#333;">${escapeHtml(plan.executive_summary)}</div>
              </div>
              ` : ''}
              
              ${plan.quick_wins ? `
              <div style="margin-bottom:1.5rem;">
                <h4 style="color:#059669;font-size:15px;margin-bottom:0.5rem;">Quick Wins (1 Week)</h4>
                <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(plan.quick_wins)}</div>
              </div>
              ` : ''}
              
              ${plan.medium_term ? `
              <div style="margin-bottom:1.5rem;">
                <h4 style="color:#0088ff;font-size:15px;margin-bottom:0.5rem;">Medium-term Actions (1-3 Months)</h4>
                <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(plan.medium_term)}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- Right: KPIs & Actions -->
            <div>
              <div style="background:#f9f9f9;border-radius:8px;padding:1rem;margin-bottom:1rem;">
                <h4 style="font-size:14px;margin-bottom:1rem;">Success Metrics (KPIs)</h4>
                <div id="kpi-list-${plan.id}">
                  ${renderKPIList(plan.id, kpis)}
                </div>
                ${canEdit ? `<button onclick="addKPI('${plan.id}')" style="margin-top:1rem;width:100%;padding:8px;background:#008f74;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">+ Add KPI</button>` : ''}
              </div>
              
              <div style="display:flex;gap:0.5rem;flex-direction:column;">
                <button onclick="viewFullPlan('${plan.id}')" style="padding:10px;background:#0088ff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">👁 View Full Plan</button>
                ${canEdit ? `<button onclick="createProjectFromPlan('${plan.id}')" style="padding:10px;background:#7c3aed;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">🚀 Create Project</button>` : ''}
                ${canEdit ? `<button onclick="archivePlan('${plan.id}')" style="padding:10px;background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">📦 Archive</button>` : ''}
              </div>
            </div>
          </div>
          ` : `
          <!-- Single column when no parsed sections -->
          <div style="max-width:600px;">
            <div style="background:#f9f9f9;border-radius:8px;padding:1rem;margin-bottom:1rem;">
              <h4 style="font-size:14px;margin-bottom:1rem;">Success Metrics (KPIs)</h4>
              <div id="kpi-list-${plan.id}">
                ${renderKPIList(plan.id, kpis)}
              </div>
              ${canEdit ? `<button onclick="addKPI('${plan.id}')" style="margin-top:1rem;width:100%;padding:8px;background:#008f74;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">+ Add KPI</button>` : ''}
            </div>
            
            <div style="display:flex;gap:0.5rem;">
              <button onclick="viewFullPlan('${plan.id}')" style="flex:1;padding:10px;background:#0088ff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">👁 View Full Plan</button>
              ${canEdit ? `<button onclick="createProjectFromPlan('${plan.id}')" style="flex:1;padding:10px;background:#7c3aed;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">🚀 Create Project</button>` : ''}
              ${canEdit ? `<button onclick="archivePlan('${plan.id}')" style="flex:1;padding:10px;background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">📦 Archive</button>` : ''}
            </div>
          </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
};

// RENDER KPI LIST
function renderKPIList(planId, kpis) {
  if (kpis.length === 0) {
    return '<div style="text-align:center;padding:1rem;color:#999;font-size:12px;">No KPIs tracked yet</div>';
  }

  return kpis.map(kpi => {
    const statusColor = kpi.status === 'achieved' ? '#059669' : 
                       kpi.status === 'on_track' ? '#0088ff' : 
                       kpi.status === 'at_risk' ? '#f59e0b' : '#dc2626';
    
    const statusIcon = kpi.status === 'achieved' ? '✅' : 
                      kpi.status === 'on_track' ? '🟢' : 
                      kpi.status === 'at_risk' ? '🟡' : '🔴';

    return `
      <div style="background:white;border:1px solid #e5e5e5;border-radius:6px;padding:0.75rem;margin-bottom:0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:#333;">${kpi.name}</div>
            <div style="font-size:11px;color:#666;margin-top:2px;">Target: ${kpi.target}${kpi.unit || ''}</div>
          </div>
          <div style="font-size:16px;">${statusIcon}</div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:12px;">
          <div>
            <span style="color:#666;">Current:</span>
            <input type="text" value="${kpi.current || ''}" onchange="updateKPI('${kpi.id}', 'current', this.value)" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:4px;font-size:11px;margin-top:2px;"/>
          </div>
          <div>
            <span style="color:#666;">Status:</span>
            <select onchange="updateKPI('${kpi.id}', 'status', this.value)" style="width:100%;padding:4px;border:1px solid #ccc;border-radius:4px;font-size:11px;margin-top:2px;">
              <option value="not_started" ${kpi.status === 'not_started' ? 'selected' : ''}>Not Started</option>
              <option value="at_risk" ${kpi.status === 'at_risk' ? 'selected' : ''}>At Risk</option>
              <option value="on_track" ${kpi.status === 'on_track' ? 'selected' : ''}>On Track</option>
              <option value="achieved" ${kpi.status === 'achieved' ? 'selected' : ''}>Achieved</option>
            </select>
          </div>
        </div>
        
        <div style="font-size:10px;color:#999;margin-top:0.5rem;">
          Last updated: ${kpi.last_updated ? new Date(kpi.last_updated).toLocaleString() : 'Never'}
        </div>
      </div>
    `;
  }).join('');
}

// TOGGLE PLAN DETAILS
window.togglePlanDetails = function(planId) {
  const details = document.getElementById(`plan-details-${planId}`);
  if (details) {
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  }
};

// ADD KPI
window.addKPI = function(planId) {
  const name = prompt('KPI Name (e.g., "Process Time", "Customer Satisfaction"):');
  if (!name) return;
  
  const target = prompt('Target Value (e.g., "30 minutes", "95%"):');
  if (!target) return;
  
  const unit = prompt('Unit (optional, e.g., "minutes", "%", "$"):', '');

  const kpiData = {
    plan_id: planId,
    name: name,
    target: target,
    unit: unit,
    current: '',
    status: 'not_started',
    created_by: window.currentUser.id,
    last_updated: new Date().toISOString()
  };

  window.supabaseClient
    .from('plan_kpis')
    .insert([kpiData])
    .select()
    .then(({ data, error }) => {
      if (error) {
        alert('Error adding KPI: ' + error.message);
        return;
      }
      
      alert('✅ KPI added!');
      window.loadAllData().then(() => renderMonitoringDashboard());
    });
};

// UPDATE KPI
window.updateKPI = async function(kpiId, field, value) {
  const updates = {
    [field]: value,
    last_updated: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from('plan_kpis')
    .update(updates)
    .eq('id', kpiId);

  if (error) {
    alert('Error updating KPI: ' + error.message);
    return;
  }

  await window.loadAllData();
  renderMonitoringDashboard();
};

// VIEW FULL PLAN
window.viewFullPlan = function(planId) {
  const plan = window.improvement_plans.find(p => p.id === planId);
  if (!plan) return;

  const existing = document.getElementById('view-plan-modal');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'view-plan-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;';

  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:900px;max-width:100%;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <h2 style="margin:0;">${plan.title}</h2>
      <button onclick="document.getElementById('view-plan-modal').remove()" style="background:#e5e7eb;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;">Close</button>
    </div>
    
    <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;">${formatAIOutput(plan.content)}</div>
  `;

  div.appendChild(box);
  document.body.appendChild(div);
};

// CREATE PROJECT FROM PLAN
window.createProjectFromPlan = async function(planId) {
  const plan = window.improvement_plans.find(p => p.id === planId);
  if (!plan) return;

  if (!confirm(`Create a project from "${plan.title}"?\n\nThis will:\n• Create a new project\n• Convert roadmap items into tasks\n• Link all tasks to the project`)) {
    return;
  }

  const proc = window.processes.find(p => p.id === plan.process_id);
  
  // Create project
  const projectData = {
    name: `${plan.title} - Implementation`,
    process_id: plan.process_id,
    description: plan.executive_summary || `Implementation of improvement plan: ${plan.title}`,
    status: 'planning',
    created_by: window.currentUser.id
  };

  try {
    const { data: projectResult, error: projectError } = await window.supabaseClient
      .from('projects')
      .insert([projectData])
      .select();

    if (projectError) throw projectError;

    const project = projectResult[0];

    // Parse roadmap and create tasks
    const tasks = parseRoadmapToTasks(plan, project.id);
    
    if (tasks.length > 0) {
      const { error: tasksError } = await window.supabaseClient
        .from('tasks')
        .insert(tasks);

      if (tasksError) throw tasksError;
    }

    alert(`✅ Project created with ${tasks.length} tasks!\n\nGo to PROJECT section to view and manage tasks.`);
    
    await window.loadAllData();

    // Switch to project section
    const projectBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.includes('Project'));
    if (projectBtn) projectBtn.click();

  } catch (error) {
    console.error('Error creating project:', error);
    alert('Error creating project: ' + error.message);
  }
};

// PARSE ROADMAP TO TASKS
function parseRoadmapToTasks(plan, projectId) {
  const tasks = [];
  
  // Extract quick wins
  if (plan.quick_wins) {
    const lines = plan.quick_wins.split('\n').filter(l => l.trim());
    lines.forEach((line, i) => {
      const text = line.replace(/^[-•*]\s*/, '').trim();
      if (text && text.length > 5) {
        tasks.push({
          project_id: projectId,
          title: text.substring(0, 200),
          description: `Quick Win from: ${plan.title}`,
          phase: 'quick-win',
          priority: 'high',
          kanban: 'backlog',
          created_by: window.currentUser.id
        });
      }
    });
  }

  // Extract medium-term actions
  if (plan.medium_term) {
    const lines = plan.medium_term.split('\n').filter(l => l.trim());
    lines.forEach((line, i) => {
      const text = line.replace(/^[-•*]\s*/, '').trim();
      if (text && text.length > 5) {
        tasks.push({
          project_id: projectId,
          title: text.substring(0, 200),
          description: `Medium-term Action from: ${plan.title}`,
          phase: 'short-term',
          priority: 'medium',
          kanban: 'backlog',
          created_by: window.currentUser.id
        });
      }
    });
  }

  // Extract from recommendations
  if (plan.recommendations) {
    const lines = plan.recommendations.split('\n').filter(l => l.trim() && l.includes('-'));
    lines.slice(0, 5).forEach((line, i) => {
      const text = line.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim();
      if (text && text.length > 5) {
        tasks.push({
          project_id: projectId,
          title: text.substring(0, 200),
          description: `Recommendation from: ${plan.title}`,
          phase: 'long-term',
          priority: 'medium',
          kanban: 'backlog',
          created_by: window.currentUser.id
        });
      }
    });
  }

  return tasks;
}

// ARCHIVE PLAN
window.archivePlan = async function(planId) {
  if (!confirm('Archive this plan? It will be moved to archived plans.')) {
    return;
  }

  const { error } = await window.supabaseClient
    .from('improvement_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', planId);

  if (error) {
    alert('Error: ' + error.message);
    return;
  }

  alert('✅ Plan archived!');
  await window.loadAllData();
  renderMonitoringDashboard();
};

// FORMAT AI OUTPUT
function formatAIOutput(text) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/^## (.+)$/gm, '<h4 style="color:#7c3aed;font-size:16px;margin-top:1.5rem;margin-bottom:0.5rem;">$1</h4>');
  formatted = formatted.replace(/^### (.+)$/gm, '<h5 style="color:#008f74;font-size:14px;margin-top:1rem;margin-bottom:0.5rem;">$1</h5>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#333;">$1</strong>');
  return formatted;
}

// ESCAPE HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

console.log('✅ monitoring.js loaded');
