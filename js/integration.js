// ===========================================================
// INTEGRATION - API Key Management
// ===========================================================

// SAVE INTEGRATION SETTINGS
window.saveIntegration = function() {
  const apiKey = document.getElementById('int-api-key')?.value.trim();
  const model = document.getElementById('int-model')?.value || 'gpt-4o';
  const maxTokens = document.getElementById('int-max-tokens')?.value || '2000';
  const systemPrompt = document.getElementById('int-system-prompt')?.value.trim() || '';
  const stylePrompt = document.getElementById('int-style-prompt')?.value.trim() || '';
  
  if (!apiKey) {
    showIntegrationMessage('Please enter an API key', 'error');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('ai_api_key', apiKey);
  localStorage.setItem('ai_model', model);
  localStorage.setItem('ai_max_tokens', maxTokens);
  localStorage.setItem('ai_system_prompt', systemPrompt);
  localStorage.setItem('ai_style_prompt', stylePrompt);
  
  showIntegrationMessage('✅ Settings saved successfully!', 'success');
  updateIntegrationStatus();
};

// TEST API CONNECTION
window.testApiKey = async function() {
  const apiKey = localStorage.getItem('ai_api_key');
  const model = localStorage.getItem('ai_model') || 'gpt-4o';
  
  if (!apiKey) {
    showIntegrationMessage('Please save your API key first', 'error');
    return;
  }
  
  showIntegrationMessage('🧪 Testing connection... Please wait.', 'info');
  
  try {
    let apiUrl, headers, requestBody;
    
    if (model.startsWith('gpt') || model.startsWith('o1')) {
      // OpenAI
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: model,
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Say "Test successful!"'
        }]
      };
    } else if (model.startsWith('claude')) {
      // Anthropic Claude
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: model,
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Say "Test successful!"'
        }]
      };
    } else if (model.startsWith('llama')) {
      // Perplexity
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: model,
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Say "Test successful!"'
        }]
      };
    } else if (model.startsWith('gemini')) {
      // Google Gemini
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
      requestBody = {
        contents: [{
          parts: [{
            text: 'Say "Test successful!"'
          }]
        }]
      };
    } else {
      showIntegrationMessage('❌ Unsupported model selected', 'error');
      return;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }
    
    // Extract response to verify
    let aiResponse = '';
    if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('llama')) {
      aiResponse = data.choices?.[0]?.message?.content || '';
    } else if (model.startsWith('claude')) {
      aiResponse = data.content?.[0]?.text || '';
    } else if (model.startsWith('gemini')) {
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    showIntegrationMessage(`✅ Connection successful! AI responded: "${aiResponse}"`, 'success');
    updateIntegrationStatus();
    
  } catch (error) {
    console.error('Test error:', error);
    showIntegrationMessage(`❌ Connection failed: ${error.message}`, 'error');
  }
};

// CLEAR API KEY
window.clearApiKey = function() {
  if (!confirm('Remove API key and all settings? This cannot be undone.')) {
    return;
  }
  
  localStorage.removeItem('ai_api_key');
  localStorage.removeItem('ai_model');
  localStorage.removeItem('ai_max_tokens');
  localStorage.removeItem('ai_system_prompt');
  localStorage.removeItem('ai_style_prompt');
  
  document.getElementById('int-api-key').value = '';
  document.getElementById('int-system-prompt').value = '';
  document.getElementById('int-style-prompt').value = '';
  
  showIntegrationMessage('✅ API key and settings removed', 'success');
  updateIntegrationStatus();
};

// TOGGLE API KEY VISIBILITY
window.toggleApiKeyVisibility = function() {
  const input = document.getElementById('int-api-key');
  const button = document.getElementById('int-key-eye');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁';
  }
};

// RESET SYSTEM PROMPT TO DEFAULT
window.resetSystemPrompt = function() {
  if (!confirm('Reset to default AI instructions?')) {
    return;
  }
  
  const defaultPrompt = `You are a senior business process improvement consultant with expertise in Lean Six Sigma, BPMN, and digital transformation.

Your role:
- Analyze business processes and identify improvement opportunities
- Provide specific, actionable recommendations with measurable impact
- Prioritize quick wins that can be implemented within 1 week
- Structure responses clearly with: Executive Summary, Key Issues, Recommendations, Quick Wins, Medium-term Actions, Success Metrics
- Be practical and data-driven, avoid generic advice

Always:
- Focus on highest-impact changes first
- Quantify expected benefits (time, cost, quality)
- Consider implementation effort and resources needed
- Align recommendations with business goals`;
  
  document.getElementById('int-system-prompt').value = defaultPrompt;
  showIntegrationMessage('✅ Reset to default instructions', 'success');
};

// UPDATE INTEGRATION STATUS DISPLAY
window.updateIntegrationStatus = function() {
  const statusBody = document.getElementById('int-status-body');
  if (!statusBody) return;
  
  const apiKey = localStorage.getItem('ai_api_key');
  const model = localStorage.getItem('ai_model') || 'Not set';
  const maxTokens = localStorage.getItem('ai_max_tokens') || 'Not set';
  
  if (!apiKey) {
    statusBody.innerHTML = `
      <div style="padding:1rem;text-align:center;color:#999;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">⚠️</div>
        <div>No API key configured</div>
        <div style="font-size:0.8rem;margin-top:0.3rem;">AI features will not work until you add an API key above</div>
      </div>
    `;
    return;
  }
  
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  const provider = model.startsWith('gpt') || model.startsWith('o1') ? 'OpenAI (ChatGPT)' : 
                   model.startsWith('claude') ? 'Anthropic (Claude)' :
                   model.startsWith('llama') ? 'Perplexity' :
                   model.startsWith('gemini') ? 'Google Gemini' : 'Unknown';
  
  const providerColor = provider.includes('OpenAI') ? '#10a37f' :
                       provider.includes('Claude') ? '#7c3aed' :
                       provider.includes('Perplexity') ? '#1fb6ff' :
                       provider.includes('Gemini') ? '#4285f4' : '#666';
  
  statusBody.innerHTML = `
    <div style="padding:1rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
        <div style="width:10px;height:10px;background:#10b981;border-radius:50%;"></div>
        <div style="font-weight:700;color:#10b981;">Connected</div>
      </div>
      
      <div style="display:grid;gap:0.8rem;">
        <div>
          <div style="font-size:0.75rem;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Provider</div>
          <div style="font-weight:600;color:${providerColor};">${provider}</div>
        </div>
        
        <div>
          <div style="font-size:0.75rem;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Model</div>
          <div style="font-weight:600;">${model}</div>
        </div>
        
        <div>
          <div style="font-size:0.75rem;color:#999;text-transform:uppercase;letter-spacing:0.05em;">API Key</div>
          <div style="font-family:monospace;font-size:0.9rem;">${maskedKey}</div>
        </div>
        
        <div>
          <div style="font-size:0.75rem;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Max Tokens</div>
          <div style="font-weight:600;">${maxTokens}</div>
        </div>
      </div>
    </div>
  `;
};

// SHOW INTEGRATION MESSAGE
function showIntegrationMessage(message, type) {
  const errDiv = document.getElementById('int-err');
  const okDiv = document.getElementById('int-ok');
  
  if (!errDiv || !okDiv) return;
  
  errDiv.style.display = 'none';
  okDiv.style.display = 'none';
  
  if (type === 'error') {
    errDiv.textContent = message;
    errDiv.style.display = 'block';
  } else if (type === 'success') {
    okDiv.textContent = message;
    okDiv.style.display = 'block';
    setTimeout(() => { okDiv.style.display = 'none'; }, 5000);
  } else {
    okDiv.textContent = message;
    okDiv.style.display = 'block';
  }
}

// LOAD SAVED SETTINGS ON PAGE LOAD
window.loadIntegrationSettings = function() {
  const apiKey = localStorage.getItem('ai_api_key');
  const model = localStorage.getItem('ai_model') || 'gpt-4o';
  const maxTokens = localStorage.getItem('ai_max_tokens') || '2000';
  const systemPrompt = localStorage.getItem('ai_system_prompt') || '';
  const stylePrompt = localStorage.getItem('ai_style_prompt') || '';
  
  if (apiKey) {
    const keyInput = document.getElementById('int-api-key');
    if (keyInput) keyInput.value = apiKey;
  }
  
  const modelSelect = document.getElementById('int-model');
  if (modelSelect) modelSelect.value = model;
  
  const tokensSelect = document.getElementById('int-max-tokens');
  if (tokensSelect) tokensSelect.value = maxTokens;
  
  const systemTextarea = document.getElementById('int-system-prompt');
  if (systemTextarea) systemTextarea.value = systemPrompt;
  
  const styleTextarea = document.getElementById('int-style-prompt');
  if (styleTextarea) styleTextarea.value = stylePrompt;
  
  updateIntegrationStatus();
};

// Auto-load settings when page loads
setTimeout(() => {
  if (document.getElementById('int-api-key')) {
    loadIntegrationSettings();
  }
}, 500);

console.log('✅ integration.js loaded');
