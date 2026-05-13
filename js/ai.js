// ===========================================================
// AI IMPROVEMENT - Complete System with Save Functionality
// ===========================================================

// REFRESH PROCESS DROPDOWN FOR AI
window.refreshAIProcessDropdown = function () {
  const dropdown = document.getElementById('ai-proc-id');
  
  if (!dropdown) {
    console.warn('⚠️ ai-proc-id dropdown not found');
    return;
  }
  
  if (!window.processes || window.processes.length === 0) {
    dropdown.innerHTML = '<option value="">— no processes available —</option>';
    return;
  }
  
  const opts = window.processes.map(p => 
    `<option value="${p.id}">${p.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— select process —</option>' + opts;
  console.log(`✅ Loaded ${window.processes.length} processes into AI dropdown`);
};

// REFRESH STEP DROPDOWN WHEN PROCESS IS SELECTED
window.refreshAIStepDropdown = function () {
  const procId = document.getElementById('ai-proc-id')?.value;
  const dropdown = document.getElementById('ai-step-id');
  
  if (!dropdown) {
    console.warn('⚠️ ai-step-id dropdown not found');
    return;
  }
  
  if (!procId) {
    dropdown.innerHTML = '<option value="">— select process first —</option>';
    return;
  }
  
  const procSteps = window.steps.filter(s => s.process_id === procId);
  
  if (procSteps.length === 0) {
    dropdown.innerHTML = '<option value="">— no steps for this process —</option>';
    return;
  }
  
  const opts = procSteps.map(s => 
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all steps —</option>' + opts;
  console.log(`✅ Loaded ${procSteps.length} steps for AI analysis`);
  
  // Also refresh metrics dropdown
  refreshAIMetricsDropdown();
};

// REFRESH METRICS DROPDOWN WHEN PROCESS IS SELECTED
window.refreshAIMetricsDropdown = function () {
  const procId = document.getElementById('ai-proc-id')?.value;
  const dropdown = document.getElementById('ai-metric-id');
  
  if (!dropdown) return;
  
  if (!procId) {
    dropdown.innerHTML = '<option value="">— select process first —</option>';
    return;
  }
  
  const procMetrics = window.metrics.filter(m => m.process_id === procId);
  
  if (procMetrics.length === 0) {
    dropdown.innerHTML = '<option value="">— no metrics for this process —</option>';
    return;
  }
  
  const opts = procMetrics.map(m => 
    `<option value="${m.id}">${m.name}</option>`
  ).join('');
  
  dropdown.innerHTML = '<option value="">— all metrics —</option>' + opts;
  console.log(`✅ Loaded ${procMetrics.length} metrics for AI analysis`);
};

// GENERATE IMPROVEMENT PLAN
window.generateImprovementPlan = async function() {
  if (!window.CAN_AI.includes(window.currentUser?.role)) {
    alert('You need Manager role or above to use AI features.');
    return;
  }

  const procId = document.getElementById('ai-proc-id')?.value;
  
  if (!procId) {
    alert('Please select a process first.');
    return;
  }

  const proc = window.processes.find(p => p.id === procId);
  if (!proc) {
    alert('Process not found.');
    return;
  }

  // Get selected filters (optional)
  const selectedStepId = document.getElementById('ai-step-id')?.value;
  const selectedMetricId = document.getElementById('ai-metric-id')?.value;

  // Get related data
  let procSteps = window.steps.filter(s => s.process_id === procId);
  let procGaps = window.gaps.filter(g => g.process_id === procId);
  let procMetrics = window.metrics.filter(m => m.process_id === procId);

  // Filter by selected step if specified
  if (selectedStepId) {
    procSteps = procSteps.filter(s => s.id === selectedStepId);
    procGaps = procGaps.filter(g => g.step_id === selectedStepId);
  }

  // Filter by selected metric if specified
  if (selectedMetricId) {
    procMetrics = procMetrics.filter(m => m.id === selectedMetricId);
  }

  // Build context
  let context = `PROCESS: ${proc.name}\n`;
  if (proc.description) context += `Description: ${proc.description}\n`;
  context += `\n`;

  if (procSteps.length > 0) {
    context += `STEPS (${procSteps.length}):\n`;
    procSteps.forEach((s, i) => {
      context += `${i+1}. ${s.name}`;
      if (s.type) context += ` [${s.type}]`;
      if (s.responsible) context += ` - Responsible: ${s.responsible}`;
      if (s.sla) context += ` - SLA: ${s.sla}`;
      context += `\n`;
      if (s.description) context += `   ${s.description}\n`;
    });
    context += `\n`;
  }

  if (procGaps.length > 0) {
    context += `IDENTIFIED GAPS (${procGaps.length}):\n`;
    procGaps.forEach((g, i) => {
      context += `${i+1}. ${g.title}`;
      if (g.severity) context += ` [${g.severity.toUpperCase()}]`;
      context += `\n`;
      if (g.current_state) context += `   Current: ${g.current_state}\n`;
      if (g.desired_state) context += `   Desired: ${g.desired_state}\n`;
      if (g.impact) context += `   Impact: ${g.impact}\n`;
    });
    context += `\n`;
  }

  if (procMetrics.length > 0) {
    context += `CURRENT METRICS (${procMetrics.length}):\n`;
    procMetrics.forEach((m, i) => {
      context += `${i+1}. ${m.name}`;
      if (m.current) context += ` - Current: ${m.current}${m.unit || ''}`;
      if (m.target) context += ` - Target: ${m.target}${m.unit || ''}`;
      if (m.trend) context += ` [${m.trend}]`;
      context += `\n`;
    });
    context += `\n`;
  }

  // Show loading
  const outputDiv = document.getElementById('ai-output');
  const saveBtn = document.getElementById('save-plan-btn');
  
  if (outputDiv) {
    outputDiv.innerHTML = '<div class="ai-thinking"><div class="spinner"></div>🤖 Analyzing process and generating improvement plan...</div>';
    outputDiv.style.display = 'block';
  }
  
  if (saveBtn) {
    saveBtn.style.display = 'none';
  }

  // Get API key and model from localStorage
  const apiKey = localStorage.getItem('ai_api_key');
  const model = localStorage.getItem('ai_model') || 'claude-3-5-sonnet-20241022';
  const maxTokens = parseInt(localStorage.getItem('ai_max_tokens') || '4000');

  if (!apiKey) {
    if (outputDiv) {
      outputDiv.innerHTML = '<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:8px;color:#c00;">⚠️ No API key configured. Go to CONFIG → Integration to add your API key.</div>';
    }
    return;
  }

  // Determine provider from model name
  let apiUrl, headers, requestBody;
  
  if (model.startsWith('claude')) {
    // Anthropic Claude
    apiUrl = 'https://api.anthropic.com/v1/messages';
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    requestBody = {
      model: model,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: `You are a senior business process improvement consultant with expertise in Lean, Six Sigma, and digital transformation. Analyze this business process and provide a comprehensive, structured improvement plan.

${context}

Provide a detailed improvement plan with the following structure:

## EXECUTIVE SUMMARY
Brief 2-3 sentence overview of the current state and key opportunities.

## KEY ISSUES IDENTIFIED
Prioritized list of the top 3-5 issues found, with severity and impact assessment.

## IMPROVEMENT RECOMMENDATIONS
For each recommendation, provide:
- **Action**: Specific change to implement
- **Expected Impact**: Quantified benefit (time, cost, quality)
- **Effort**: Low/Medium/High
- **Priority**: Critical/High/Medium/Low

## QUICK WINS (1 Week)
List 3-5 actions that can be implemented immediately with minimal resources.

## MEDIUM-TERM ACTIONS (1-3 Months)
List 3-5 strategic improvements requiring planning and resources.

## SUCCESS METRICS
Define 3-5 KPIs to track improvement progress with current baseline and target values.

## IMPLEMENTATION ROADMAP
High-level timeline with phases and key milestones.

Be specific, practical, and data-driven. Focus on the highest-impact changes first.`
      }]
    };
  } else if (model.startsWith('gpt')) {
    // OpenAI
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    requestBody = {
      model: model,
      max_tokens: maxTokens,
      messages: [{
        role: 'system',
        content: 'You are a senior business process improvement consultant with expertise in Lean, Six Sigma, and digital transformation.'
      }, {
        role: 'user',
        content: `Analyze this business process and provide a comprehensive improvement plan.

${context}

Structure: Executive Summary, Key Issues, Recommendations (with impact/effort/priority), Quick Wins, Medium-term Actions, Success Metrics, Implementation Roadmap.`
      }]
    };
  } else {
    if (outputDiv) {
      outputDiv.innerHTML = '<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:8px;color:#c00;">⚠️ Unsupported model selected. Please choose Claude or GPT model.</div>';
    }
    return;
  }

  try {
    // Call AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API request failed');
    }

    // Extract text based on provider
    let aiText;
    if (model.startsWith('claude')) {
      aiText = data.content[0].text;
    } else if (model.startsWith('gpt')) {
      aiText = data.choices[0].message.content;
    }

    // Store the plan temporarily for saving
    window.currentAIPlan = {
      process_id: procId,
      step_id: selectedStepId || null,
      metric_id: selectedMetricId || null,
      content: aiText,
      model: model,
      generated_at: new Date().toISOString()
    };

    // Display result
    if (outputDiv) {
      outputDiv.innerHTML = `
        <div class="ai-output">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:1rem;border-bottom:2px solid rgba(124,58,237,.2);">
            <h3 style="margin:0;">🚀 AI-Generated Improvement Plan</h3>
            <button onclick="savePlanToDatabase()" style="padding:10px 20px;background:#008f74;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;">💾 Save Plan</button>
          </div>
          <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;">${formatAIOutput(aiText)}</div>
          <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(124,58,237,.2);font-size:.75rem;color:#999;">
            Generated by ${model} • ${new Date().toLocaleString()}
          </div>
        </div>
      `;
    }

  } catch (error) {
    console.error('AI generation error:', error);
    if (outputDiv) {
      outputDiv.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:8px;color:#c00;">⚠️ Error: ${error.message}<br><br>Check your API key and model configuration in CONFIG section.</div>`;
    }
  }
};

// FORMAT AI OUTPUT (convert markdown-style to HTML)
function formatAIOutput(text) {
  let formatted = escapeHtml(text);
  
  // Convert headers
  formatted = formatted.replace(/^## (.+)$/gm, '<h4 style="color:#7c3aed;font-size:16px;margin-top:1.5rem;margin-bottom:0.5rem;">$1</h4>');
  formatted = formatted.replace(/^### (.+)$/gm, '<h5 style="color:#008f74;font-size:14px;margin-top:1rem;margin-bottom:0.5rem;">$1</h5>');
  
  // Convert bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#333;">$1</strong>');
  
  // Convert bullet points
  formatted = formatted.replace(/^- (.+)$/gm, '• $1');
  formatted = formatted.replace(/^• (.+)$/gm, '<div style="margin-left:1rem;margin-top:0.3rem;">• $1</div>');
  
  return formatted;
}

// SAVE PLAN TO DATABASE
window.savePlanToDatabase = async function() {
  if (!window.currentAIPlan) {
    alert('No plan to save. Generate a plan first.');
    return;
  }

  if (!window.CAN_EDIT.includes(window.currentUser?.role)) {
    alert('You need Editor role or above to save plans.');
    return;
  }

  // Ask for plan title
  const title = prompt('Enter a title for this improvement plan:', 
    `Improvement Plan - ${window.processes.find(p => p.id === window.currentAIPlan.process_id)?.name || 'Process'} - ${new Date().toLocaleDateString()}`
  );

  if (!title) return;

  const planData = {
    process_id: window.currentAIPlan.process_id,
    step_id: window.currentAIPlan.step_id,
    metric_id: window.currentAIPlan.metric_id,
    title: title,
    content: window.currentAIPlan.content,
    model: window.currentAIPlan.model,
    status: 'pending',
    created_by: window.currentUser.id,
    generated_at: window.currentAIPlan.generated_at
  };

  try {
    const { data, error } = await window.supabaseClient
      .from('improvement_plans')
      .insert([planData])
      .select();

    if (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan: ' + error.message);
      return;
    }

    alert('✓ Improvement plan saved successfully!');
    
    // Clear the temporary plan
    window.currentAIPlan = null;
    
    // Reload data
    await window.loadAllData();
    
    // Render saved plans
    if (typeof window.renderSavedPlans === 'function') {
      window.renderSavedPlans();
    }

  } catch (error) {
    console.error('Save error:', error);
    alert('Error saving plan: ' + error.message);
  }
};

// RENDER SAVED PLANS
window.renderSavedPlans = function() {
  const container = document.getElementById('saved-plans-container');
  
  if (!container) return;
  
  if (!window.improvement_plans || window.improvement_plans.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No saved improvement plans yet.</div>';
    return;
  }

  const canEdit = window.CAN_EDIT.includes(window.currentUser?.role);
  const canDelete = window.CAN_DELETE.includes(window.currentUser?.role);

  const html = window.improvement_plans
    .sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at))
    .map(plan => {
      const proc = window.processes.find(p => p.id === plan.process_id);
      const procName = proc ? proc.name : 'Unknown Process';
      
      const statusColors = {
        pending: '#f59e0b',
        in_progress: '#0088ff',
        completed: '#059669',
        archived: '#6b7280'
      };
      
      const statusColor = statusColors[plan.status] || '#6b7280';

      return `
        <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="flex:1;">
              <div style="font-weight:700;font-size:15px;margin-bottom:5px;">${plan.title}</div>
              <div style="font-size:12px;color:#666;margin-bottom:5px;">📋 ${procName}</div>
              <div style="font-size:11px;color:#999;">
                Generated: ${new Date(plan.generated_at).toLocaleString()} • Model: ${plan.model}
              </div>
              <div style="margin-top:8px;">
                <span style="font-size:11px;padding:3px 8px;background:${statusColor};color:white;border-radius:4px;text-transform:uppercase;font-weight:600;">${plan.status}</span>
              </div>
            </div>
            <div style="display:flex;gap:5px;">
              <button onclick="viewPlan('${plan.id}')" style="padding:5px 12px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">👁 View</button>
              ${canEdit ? `<button onclick="updatePlanStatus('${plan.id}')" style="padding:5px 12px;background:#0088ff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✏ Status</button>` : ''}
              ${canDelete ? `<button onclick="deletePlan('${plan.id}')" style="padding:5px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✕</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

  container.innerHTML = html;
};

// VIEW PLAN
window.viewPlan = function(planId) {
  const plan = window.improvement_plans.find(p => p.id === planId);
  if (!plan) return;

  const existing = document.getElementById('view-plan-modal');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'view-plan-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;';

  const box = document.createElement('div');
  box.style.cssText = 'background:white;width:900px;max-width:100%;max-height:90vh;overflow-y:auto;border-radius:12px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

  const proc = window.processes.find(p => p.id === plan.process_id);
  const procName = proc ? proc.name : 'Unknown Process';

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <h2 style="margin:0;">${plan.title}</h2>
      <button onclick="document.getElementById('view-plan-modal').remove()" style="background:#e5e7eb;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;">Close</button>
    </div>
    
    <div style="font-size:13px;color:#666;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #e5e5e5;">
      <div><strong>Process:</strong> ${procName}</div>
      <div><strong>Generated:</strong> ${new Date(plan.generated_at).toLocaleString()}</div>
      <div><strong>Model:</strong> ${plan.model}</div>
      <div><strong>Status:</strong> <span style="text-transform:uppercase;font-weight:600;">${plan.status}</span></div>
    </div>
    
    <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;">${formatAIOutput(plan.content)}</div>
  `;

  div.appendChild(box);
  document.body.appendChild(div);
};

// UPDATE PLAN STATUS
window.updatePlanStatus = async function(planId) {
  const plan = window.improvement_plans.find(p => p.id === planId);
  if (!plan) return;

  const newStatus = prompt('Enter new status (pending, in_progress, completed, archived):', plan.status);
  
  if (!newStatus || !['pending', 'in_progress', 'completed', 'archived'].includes(newStatus)) {
    alert('Invalid status. Use: pending, in_progress, completed, or archived');
    return;
  }

  const { error } = await window.supabaseClient
    .from('improvement_plans')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', planId);

  if (error) {
    alert('Error updating status: ' + error.message);
    return;
  }

  alert('✓ Status updated!');
  await window.loadAllData();
  window.renderSavedPlans();
};

// DELETE PLAN
window.deletePlan = async function(planId) {
  const plan = window.improvement_plans.find(p => p.id === planId);
  if (!plan) return;

  if (!confirm(`Delete plan "${plan.title}"?`)) return;

  const { error } = await window.supabaseClient
    .from('improvement_plans')
    .delete()
    .eq('id', planId);

  if (error) {
    alert('Error deleting plan: ' + error.message);
    return;
  }

  alert('✓ Plan deleted!');
  await window.loadAllData();
  window.renderSavedPlans();
};

// INITIALIZE AI SECTION
window.initAISection = function() {
  console.log('🤖 Initializing AI Section...');
  
  // Refresh process dropdown
  if (typeof window.refreshAIProcessDropdown === 'function') {
    window.refreshAIProcessDropdown();
  }
  
  // Initialize step and metric dropdowns
  const stepDropdown = document.getElementById('ai-step-id');
  if (stepDropdown) {
    stepDropdown.innerHTML = '<option value="">— select process first —</option>';
  }
  
  const metricDropdown = document.getElementById('ai-metric-id');
  if (metricDropdown) {
    metricDropdown.innerHTML = '<option value="">— select process first —</option>';
  }
  
  // Render saved plans
  if (window.improvement_plans) {
    window.renderSavedPlans();
  }
};

// Set up event listener for process dropdown
setTimeout(() => {
  const procDropdown = document.getElementById('ai-proc-id');
  if (procDropdown) {
    procDropdown.addEventListener('change', window.refreshAIStepDropdown);
    console.log('✅ Event listener added to ai-proc-id');
  }
}, 1000);

// Helper function
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

console.log('✅ ai.js with complete save functionality loaded');
