// ===========================================================
// DIAGRAM - BPMN STYLE WITH DECISION BRANCHES (IMPROVED)
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
  const procSteps = window.steps.filter(s => s.process_id === procId).sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  if (!proc) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">Process not found</div>';
    return;
  }

  if (procSteps.length === 0) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">No steps registered for this process</div>';
    return;
  }

  // Build execution flow tree
  const flowTree = buildFlowTree(procSteps);
  const { width, height } = calculateDiagramSize(flowTree);
  
  const startX = 150;
  const startY = 80;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f9fafb;">`;
  
  // Define arrow marker
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

  // Track positions for all elements
  const positions = {};
  let currentY = startY;
  const stepWidth = 180;
  const stepHeight = 80;
  const verticalGap = 60;
  const horizontalBranchGap = 300;

  // Find start step
  const startStep = procSteps.find(s => s.is_start) || procSteps[0];
  
  // Draw START circle
  svg += `<circle cx="${startX}" cy="${currentY}" r="30" fill="#10b981" stroke="#059669" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${currentY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">START</text>`;
  
  currentY += 80;
  
  // Draw connector from START to first step
  svg += `<line x1="${startX}" y1="${startY + 30}" x2="${startX}" y2="${currentY - 10}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  
  // Draw all steps recursively
  const drawnSteps = new Set();
  const result = drawStepRecursive(startStep, startX, currentY, 0);
  svg += result.svg;
  
  // Draw END circle
  const endY = result.maxY + 80;
  svg += `<line x1="${startX}" y1="${result.maxY}" x2="${startX}" y2="${endY - 30}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  svg += `<circle cx="${startX}" cy="${endY}" r="30" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${endY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">END</text>`;
  
  svg += `</svg>`;
  
  canvas.innerHTML = svg;

  // ====== HELPER FUNCTIONS ======

  function drawStepRecursive(step, x, y, depth) {
    if (!step || drawnSteps.has(step.id)) {
      return { svg: '', maxY: y };
    }
    
    drawnSteps.add(step.id);
    let localSvg = '';
    let maxY = y;
    
    positions[step.id] = { x, y: y + stepHeight/2 };
    
    if (step.type === 'decision') {
      // ===== DECISION DIAMOND =====
      const diamondSize = 100;
      const centerX = x;
      const centerY = y + diamondSize/2;
      
      positions[step.id] = { x: centerX, y: centerY };
      
      localSvg += `<polygon points="${centerX},${centerY - diamondSize/2} ${centerX + diamondSize/2},${centerY} ${centerX},${centerY + diamondSize/2} ${centerX - diamondSize/2},${centerY}" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>`;
      
      // Decision text (wrap if needed)
      const lines = wrapText(step.name, 15);
      const textStartY = centerY - (lines.length - 1) * 6;
      lines.forEach((line, i) => {
        localSvg += `<text x="${centerX}" y="${textStartY + i * 12}" text-anchor="middle" font-size="11" font-weight="600" fill="#92400e">${line}</text>`;
      });
      
      const nextY = y + diamondSize + verticalGap;
      
      // ===== YES BRANCH (RIGHT) =====
      if (step.branch_yes) {
        const yesStep = procSteps.find(s => s.id === step.branch_yes);
        if (yesStep) {
          const yesX = x + horizontalBranchGap;
          
          // YES label
          localSvg += `<text x="${centerX + diamondSize/2 + 30}" y="${centerY}" font-size="13" font-weight="700" fill="#059669">YES</text>`;
          
          // Horizontal line to the right
          localSvg += `<line x1="${centerX + diamondSize/2}" y1="${centerY}" x2="${yesX}" y2="${centerY}" stroke="#059669" stroke-width="2.5" marker-end="url(#arrowhead-yes)"/>`;
          
          // Draw YES branch recursively
          const yesResult = drawStepRecursive(yesStep, yesX, centerY + 40, depth + 1);
          localSvg += yesResult.svg;
          maxY = Math.max(maxY, yesResult.maxY);
        }
      }
      
      // ===== NO BRANCH (DOWN - MAIN PATH) =====
      if (step.branch_no) {
        const noStep = procSteps.find(s => s.id === step.branch_no);
        if (noStep) {
          // NO label
          localSvg += `<text x="${centerX - 40}" y="${centerY + diamondSize/2 + 20}" font-size="13" font-weight="700" fill="#dc2626">NO</text>`;
          
          // Vertical line down
          localSvg += `<line x1="${centerX}" y1="${centerY + diamondSize/2}" x2="${centerX}" y2="${nextY - 10}" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrowhead-no)"/>`;
          
          // Draw NO branch recursively
          const noResult = drawStepRecursive(noStep, x, nextY, depth + 1);
          localSvg += noResult.svg;
          maxY = Math.max(maxY, noResult.maxY);
        }
      } else {
        // If no NO branch, just continue down
        maxY = nextY;
      }
      
    } else {
      // ===== REGULAR TASK BOX =====
      const boxX = x - stepWidth/2;
      
      localSvg += `<rect x="${boxX}" y="${y}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>`;
      
      // Wrap text inside box
      const lines = wrapText(step.name, 20);
      const textStartY = y + stepHeight/2 - (lines.length - 1) * 6;
      lines.forEach((line, i) => {
        localSvg += `<text x="${x}" y="${textStartY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="#075985">${line}</text>`;
      });
      
      // Step number badge
      const stepIndex = procSteps.indexOf(step);
      localSvg += `<circle cx="${boxX + 15}" cy="${y + 15}" r="12" fill="#0284c7"/>`;
      localSvg += `<text x="${boxX + 15}" y="${y + 20}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${stepIndex + 1}</text>`;
      
      maxY = y + stepHeight + verticalGap;
      
      // Find next step in sequence (if not branching)
      const nextStep = findNextStep(step, procSteps);
      if (nextStep) {
        localSvg += `<line x1="${x}" y1="${y + stepHeight}" x2="${x}" y2="${y + stepHeight + verticalGap - 10}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
        
        const nextResult = drawStepRecursive(nextStep, x, maxY, depth);
        localSvg += nextResult.svg;
        maxY = nextResult.maxY;
      }
    }
    
    return { svg: localSvg, maxY };
  }

  function findNextStep(currentStep, allSteps) {
    // Find step that has current step as prev_step_id
    return allSteps.find(s => s.prev_step_id === currentStep.id && !drawnSteps.has(s.id));
  }

  function wrapText(text, maxLength) {
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
    
    return lines;
  }

  function buildFlowTree(steps) {
    const startStep = steps.find(s => s.is_start) || steps[0];
    return startStep;
  }

  function calculateDiagramSize(flowTree) {
    // Calculate based on number of decision branches
    const decisions = procSteps.filter(s => s.type === 'decision').length;
    const regularSteps = procSteps.filter(s => s.type !== 'decision').length;
    
    const baseWidth = 800;
    const branchWidth = decisions * horizontalBranchGap;
    const width = Math.max(baseWidth, baseWidth + branchWidth);
    
    const height = Math.max(800, (regularSteps + decisions) * 150 + 300);
    
    return { width, height };
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

console.log('✅ diagram.js with full YES/NO branch rendering loaded');
