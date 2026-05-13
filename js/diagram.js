// ===========================================================
// DIAGRAM - BPMN STYLE WITH DECISION BRANCHES (COMPLETE REWRITE)
// ===========================================================

// REFRESH/RENDER DIAGRAM
window.refreshDiagram = function () {
  const procId = document.getElementById('diagram-filter-proc')?.value;
  const canvas = document.getElementById('diagram-canvas');

  if (!canvas) return;

  if (!procId) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">Select a process to view its diagram</div>';
    return;
  }

  const proc = window.processes.find(p => p.id === procId);
  const procSteps = window.steps.filter(s => s.process_id === procId);

  if (!proc) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">Process not found</div>';
    return;
  }

  if (procSteps.length === 0) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No steps registered for this process</div>';
    return;
  }

  // Build the flow - show ALL steps in creation order
  const sortedSteps = [...procSteps].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  // Constants
  const stepWidth = 200;
  const stepHeight = 80;
  const verticalGap = 70;
  const horizontalBranchGap = 350;
  const startX = 200;
  const startY = 80;
  
  // Calculate canvas size
  const hasDecisions = sortedSteps.some(s => s.type === 'decision');
  const width = hasDecisions ? 1400 : 1000;
  const height = Math.max(800, sortedSteps.length * 180 + 300);

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f9fafb;">`;
  
  // Define arrow markers
  svg += `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#374151" />
    </marker>
    <marker id="arrowhead-yes" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#059669" />
    </marker>
    <marker id="arrowhead-no" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#dc2626" />
    </marker>
  </defs>`;

  // Track positions and drawn elements
  const positions = {};
  const branchStepIds = new Set(); // Track steps that are part of branches
  let currentY = startY;

  // Find start step or use first
  const startStep = sortedSteps.find(s => s.is_start) || sortedSteps[0];
  
  // Draw START circle
  svg += `<circle cx="${startX}" cy="${currentY}" r="32" fill="#10b981" stroke="#059669" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${currentY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">START</text>`;
  
  currentY += 90;
  
  // Draw connector from START to first step
  svg += `<line x1="${startX}" y1="${startY + 32}" x2="${startX}" y2="${currentY - 10}" stroke="#374151" stroke-width="2.5" marker-end="url(#arrowhead)"/>`;

  // Collect all branch target IDs
  sortedSteps.forEach(step => {
    if (step.branch_yes) branchStepIds.add(step.branch_yes);
    if (step.branch_no) branchStepIds.add(step.branch_no);
  });

  // Draw all steps in sequence
  sortedSteps.forEach((step, idx) => {
    const stepIndex = idx + 1;
    
    if (step.type === 'decision') {
      // ===== DECISION DIAMOND =====
      const diamondSize = 110;
      const centerX = startX;
      const centerY = currentY + diamondSize/2;
      
      positions[step.id] = { x: centerX, y: centerY };
      
      // Draw diamond
      svg += `<polygon points="${centerX},${centerY - diamondSize/2} ${centerX + diamondSize/2},${centerY} ${centerX},${centerY + diamondSize/2} ${centerX - diamondSize/2},${centerY}" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>`;
      
      // Decision text (wrapped)
      const lines = wrapText(step.name, 15);
      const textStartY = centerY - (lines.length - 1) * 7;
      lines.forEach((line, i) => {
        svg += `<text x="${centerX}" y="${textStartY + i * 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#92400e">${escapeHtml(line)}</text>`;
      });
      
      // Step number badge
      svg += `<circle cx="${centerX - diamondSize/2 - 25}" cy="${centerY}" r="14" fill="#f59e0b"/>`;
      svg += `<text x="${centerX - diamondSize/2 - 25}" y="${centerY + 5}" text-anchor="middle" font-size="12" font-weight="700" fill="white">${stepIndex}</text>`;
      
      const branchStartY = currentY + diamondSize + 60;
      
      // ===== YES BRANCH (RIGHT) =====
      if (step.branch_yes) {
        const yesStep = sortedSteps.find(s => s.id === step.branch_yes);
        if (yesStep) {
          const yesX = startX + horizontalBranchGap;
          const yesY = branchStartY;
          
          // YES label
          svg += `<text x="${centerX + diamondSize/2 + 35}" y="${centerY}" font-size="14" font-weight="700" fill="#059669">YES ✓</text>`;
          
          // Horizontal line to the right
          svg += `<line x1="${centerX + diamondSize/2}" y1="${centerY}" x2="${yesX}" y2="${centerY}" stroke="#059669" stroke-width="3" marker-end="url(#arrowhead-yes)"/>`;
          
          // Vertical line down
          svg += `<line x1="${yesX}" y1="${centerY}" x2="${yesX}" y2="${yesY - 10}" stroke="#059669" stroke-width="3" marker-end="url(#arrowhead-yes)"/>`;
          
          // Draw YES step box
          const yesBoxX = yesX - stepWidth/2;
          svg += `<rect x="${yesBoxX}" y="${yesY}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>`;
          
          // YES step text
          const yesLines = wrapText(yesStep.name, 22);
          const yesTextY = yesY + stepHeight/2 - (yesLines.length - 1) * 7;
          yesLines.forEach((line, i) => {
            svg += `<text x="${yesX}" y="${yesTextY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="#166534">${escapeHtml(line)}</text>`;
          });
          
          // YES step number
          const yesStepIndex = sortedSteps.indexOf(yesStep) + 1;
          svg += `<circle cx="${yesBoxX + 18}" cy="${yesY + 18}" r="14" fill="#16a34a"/>`;
          svg += `<text x="${yesBoxX + 18}" y="${yesY + 23}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${yesStepIndex}</text>`;
        }
      }
      
      // ===== NO BRANCH (DOWN - CONTINUES MAIN FLOW) =====
      if (step.branch_no) {
        const noStep = sortedSteps.find(s => s.id === step.branch_no);
        if (noStep) {
          // NO label
          svg += `<text x="${centerX - 50}" y="${centerY + diamondSize/2 + 25}" font-size="14" font-weight="700" fill="#dc2626">NO ✗</text>`;
          
          // Vertical line down
          svg += `<line x1="${centerX}" y1="${centerY + diamondSize/2}" x2="${centerX}" y2="${branchStartY - 10}" stroke="#dc2626" stroke-width="3" marker-end="url(#arrowhead-no)"/>`;
          
          // Draw NO step box
          const noBoxX = startX - stepWidth/2;
          svg += `<rect x="${noBoxX}" y="${branchStartY}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>`;
          
          // NO step text
          const noLines = wrapText(noStep.name, 22);
          const noTextY = branchStartY + stepHeight/2 - (noLines.length - 1) * 7;
          noLines.forEach((line, i) => {
            svg += `<text x="${startX}" y="${noTextY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="#991b1b">${escapeHtml(line)}</text>`;
          });
          
          // NO step number
          const noStepIndex = sortedSteps.indexOf(noStep) + 1;
          svg += `<circle cx="${noBoxX + 18}" cy="${branchStartY + 18}" r="14" fill="#dc2626"/>`;
          svg += `<text x="${noBoxX + 18}" y="${branchStartY + 23}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${noStepIndex}</text>`;
        }
      }
      
      currentY += diamondSize + stepHeight + verticalGap + 60;
      
    } else {
      // ===== REGULAR TASK BOX =====
      // Skip if this step is already drawn as a branch target
      if (branchStepIds.has(step.id) && idx > 0) {
        return; // Skip drawing, already shown in branch
      }
      
      const boxX = startX - stepWidth/2;
      
      positions[step.id] = { x: startX, y: currentY + stepHeight/2 };
      
      // Determine color based on type
      let fillColor = '#e0f2fe';
      let strokeColor = '#0284c7';
      let textColor = '#075985';
      let badgeColor = '#0284c7';
      
      if (step.type === 'automation') {
        fillColor = '#f3e8ff';
        strokeColor = '#9333ea';
        textColor = '#581c87';
        badgeColor = '#9333ea';
      } else if (step.type === 'approval') {
        fillColor = '#fef3c7';
        strokeColor = '#eab308';
        textColor = '#713f12';
        badgeColor = '#eab308';
      }
      
      svg += `<rect x="${boxX}" y="${currentY}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5"/>`;
      
      // Wrap text inside box
      const lines = wrapText(step.name, 22);
      const textStartY = currentY + stepHeight/2 - (lines.length - 1) * 7;
      lines.forEach((line, i) => {
        svg += `<text x="${startX}" y="${textStartY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="${textColor}">${escapeHtml(line)}</text>`;
      });
      
      // Step number badge
      svg += `<circle cx="${boxX + 18}" cy="${currentY + 18}" r="14" fill="${badgeColor}"/>`;
      svg += `<text x="${boxX + 18}" y="${currentY + 23}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${stepIndex}</text>`;
      
      currentY += stepHeight + verticalGap;
      
      // Draw connector to next step (if not last and next isn't a branch target)
      if (idx < sortedSteps.length - 1) {
        const nextStep = sortedSteps[idx + 1];
        if (!branchStepIds.has(nextStep.id)) {
          svg += `<line x1="${startX}" y1="${currentY - verticalGap}" x2="${startX}" y2="${currentY - 10}" stroke="#374151" stroke-width="2.5" marker-end="url(#arrowhead)"/>`;
        }
      }
    }
  });
  
  // Draw END circle
  const endY = currentY + 40;
  svg += `<line x1="${startX}" y1="${currentY - verticalGap}" x2="${startX}" y2="${endY - 32}" stroke="#374151" stroke-width="2.5" marker-end="url(#arrowhead)"/>`;
  svg += `<circle cx="${startX}" cy="${endY}" r="32" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${endY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">END</text>`;
  
  svg += `</svg>`;
  
  canvas.innerHTML = svg;

  // ====== HELPER FUNCTIONS ======

  function wrapText(text, maxLength) {
    if (!text) return [''];
    const words = text.split(' ');
    let line = '';
    let lines = [];
    
    words.forEach(word => {
      const testLine = line + (line ? ' ' : '') + word;
      if (testLine.length > maxLength) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    
    return lines.length > 0 ? lines : [''];
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ALIAS for HTML compatibility
window.renderDiagram = window.refreshDiagram;

// EXPORT DIAGRAM AS SVG
window.exportDiagram = function() {
  const canvas = document.getElementById('diagram-canvas');
  const svg = canvas.querySelector('svg');
  
  if (!svg) {
    alert('No diagram to export. Generate a diagram first.');
    return;
  }
  
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'process-diagram-bpmn.svg';
  a.click();
  
  URL.revokeObjectURL(url);
  alert('✓ Diagram exported as SVG!');
};

console.log('✅ diagram.js with complete step visualization loaded');
