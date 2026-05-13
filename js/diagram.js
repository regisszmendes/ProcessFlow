// ===========================================================
// DIAGRAM - BPMN STYLE WITH DECISION BRANCHES
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

  // Generate BPMN SVG
  const width = 1200;
  const height = Math.max(600, procSteps.length * 120);
  const startX = 100;
  const startY = 100;
  const stepWidth = 180;
  const stepHeight = 80;
  const verticalGap = 40;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f9fafb;">`;
  
  // Define arrow marker
  svg += `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#374151" />
    </marker>
  </defs>`;

  let currentY = startY;
  const positions = {}; // Store positions for connecting lines
  
  // Find start step
  const startStep = procSteps.find(s => s.is_start) || procSteps[0];
  
  // Draw START circle
  svg += `<circle cx="${startX}" cy="${currentY}" r="30" fill="#10b981" stroke="#059669" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${currentY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">START</text>`;
  
  currentY += 80;
  
  // Draw connector from START to first step
  svg += `<line x1="${startX}" y1="${startY + 30}" x2="${startX}" y2="${currentY - 10}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  
  // Draw steps
  procSteps.forEach((step, idx) => {
    const x = startX - stepWidth/2;
    const y = currentY;
    
    positions[step.id] = { x: startX, y: currentY + stepHeight/2 };
    
    if (step.type === 'decision') {
      // DECISION DIAMOND
      const diamondSize = 100;
      const centerX = startX;
      const centerY = currentY + diamondSize/2;
      
      positions[step.id] = { x: centerX, y: centerY };
      
      svg += `<polygon points="${centerX},${centerY - diamondSize/2} ${centerX + diamondSize/2},${centerY} ${centerX},${centerY + diamondSize/2} ${centerX - diamondSize/2},${centerY}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>`;
      
      // Decision text (wrap if needed)
      const words = step.name.split(' ');
      let line = '';
      let lines = [];
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > 15) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      lines.push(line);
      
      const textStartY = centerY - (lines.length - 1) * 6;
      lines.forEach((line, i) => {
        svg += `<text x="${centerX}" y="${textStartY + i * 12}" text-anchor="middle" font-size="11" font-weight="600" fill="#92400e">${line}</text>`;
      });
      
      // YES branch (right)
      if (step.branch_yes) {
        const yesStep = procSteps.find(s => s.id === step.branch_yes);
        if (yesStep) {
          const yesY = currentY + diamondSize + 100;
          const yesX = startX + 250;
          
          // YES label
          svg += `<text x="${centerX + diamondSize/2 + 20}" y="${centerY - 5}" font-size="12" font-weight="700" fill="#059669">YES</text>`;
          
          // Line to YES branch
          svg += `<line x1="${centerX + diamondSize/2}" y1="${centerY}" x2="${yesX}" y2="${centerY}" stroke="#059669" stroke-width="2"/>`;
          svg += `<line x1="${yesX}" y1="${centerY}" x2="${yesX}" y2="${yesY - 10}" stroke="#059669" stroke-width="2" marker-end="url(#arrowhead)"/>`;
          
          // Draw YES step
          svg += `<rect x="${yesX - stepWidth/2}" y="${yesY}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>`;
          
          // YES step text
          const yesWords = yesStep.name.split(' ');
          let yesLine = '';
          let yesLines = [];
          yesWords.forEach(word => {
            const testLine = yesLine + (yesLine ? ' ' : '') + word;
            if (testLine.length > 20) {
              yesLines.push(yesLine);
              yesLine = word;
            } else {
              yesLine = testLine;
            }
          });
          yesLines.push(yesLine);
          
          const yesTextY = yesY + stepHeight/2 - (yesLines.length - 1) * 6;
          yesLines.forEach((line, i) => {
            svg += `<text x="${yesX}" y="${yesTextY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="#166534">${line}</text>`;
          });
        }
      }
      
      // NO branch (continue down)
      if (step.branch_no) {
        svg += `<text x="${centerX - diamondSize/2 - 20}" y="${centerY + 5}" font-size="12" font-weight="700" fill="#dc2626" text-anchor="end">NO</text>`;
      }
      
      currentY += diamondSize + 60;
      
    } else {
      // REGULAR TASK BOX
      svg += `<rect x="${x}" y="${y}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>`;
      
      // Wrap text inside box
      const words = step.name.split(' ');
      let line = '';
      let lines = [];
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > 20) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });
      lines.push(line);
      
      const textStartY = y + stepHeight/2 - (lines.length - 1) * 6;
      lines.forEach((line, i) => {
        svg += `<text x="${startX}" y="${textStartY + i * 14}" text-anchor="middle" font-size="12" font-weight="600" fill="#075985">${line}</text>`;
      });
      
      // Step number badge
      svg += `<circle cx="${x + 15}" cy="${y + 15}" r="12" fill="#0284c7"/>`;
      svg += `<text x="${x + 15}" y="${y + 20}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${idx + 1}</text>`;
      
      currentY += stepHeight + verticalGap;
      
      // Draw connector to next step
      if (idx < procSteps.length - 1 && procSteps[idx + 1].type !== 'decision') {
        svg += `<line x1="${startX}" y1="${y + stepHeight}" x2="${startX}" y2="${currentY - 10}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
      }
    }
  });
  
  // Draw END circle
  const endStep = procSteps.find(s => s.is_end) || procSteps[procSteps.length - 1];
  svg += `<line x1="${startX}" y1="${currentY - verticalGap}" x2="${startX}" y2="${currentY + 20}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  
  currentY += 50;
  svg += `<circle cx="${startX}" cy="${currentY}" r="30" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>`;
  svg += `<text x="${startX}" y="${currentY + 5}" text-anchor="middle" font-size="14" font-weight="bold" fill="white">END</text>`;
  
  svg += `</svg>`;
  
  canvas.innerHTML = svg;
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
  alert('✓ Diagram exported!');
};

console.log('✅ diagram.js with BPMN decision branches loaded');
