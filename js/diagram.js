// ===========================================================
// DIAGRAM GENERATION
// ===========================================================

// REFRESH DIAGRAM
window.refreshDiagram = function () {
  const procId = document.getElementById('diagram-filter-proc').value;
  const canvas = document.getElementById('diagram-canvas');

  if (!procId) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">Select a process to view its diagram</div>';
    return;
  }

  const proc = window.processes.find(p => p.id === procId);
  const procSteps = window.steps.filter(s => s.process_id === procId);

  if (!proc) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">Process not found</div>';
    return;
  }

  if (procSteps.length === 0) {
    canvas.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)">No steps registered for this process</div>';
    return;
  }

  // Generate simple SVG diagram
  const width = 800;
  const stepHeight = 80;
  const stepWidth = 180;
  const gap = 40;
  const height = (procSteps.length * (stepHeight + gap)) + 100;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Title
  svg += `<text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--text)">${proc.name}</text>`;
  
  // Steps
  procSteps.forEach((step, idx) => {
    const y = 60 + (idx * (stepHeight + gap));
    const x = 310;
    
    // Step box
    svg += `<rect x="${x}" y="${y}" width="${stepWidth}" height="${stepHeight}" rx="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`;
    
    // Step number
    svg += `<circle cx="${x + 20}" cy="${y + 20}" r="14" fill="var(--accent)"/>`;
    svg += `<text x="${x + 20}" y="${y + 25}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${idx + 1}</text>`;
    
    // Step name
    svg += `<text x="${x + 45}" y="${y + 25}" font-size="13" font-weight="600" fill="var(--text)">${step.name}</text>`;
    
    // Step actor
    if (step.actor) {
      svg += `<text x="${x + 45}" y="${y + 45}" font-size="11" fill="var(--text3)">Actor: ${step.actor}</text>`;
    }
    
    // Step duration
    if (step.duration) {
      svg += `<text x="${x + 45}" y="${y + 60}" font-size="11" fill="var(--text3)">Duration: ${step.duration}</text>`;
    }
    
    // Arrow to next step
    if (idx < procSteps.length - 1) {
      const arrowY = y + stepHeight;
      svg += `<line x1="${x + stepWidth/2}" y1="${arrowY}" x2="${x + stepWidth/2}" y2="${arrowY + gap}" stroke="var(--accent)" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }
  });
  
  // Arrowhead marker
  svg += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="var(--accent)"/></marker></defs>`;
  
  svg += `</svg>`;
  
  canvas.innerHTML = svg;
};

// EXPORT DIAGRAM AS SVG
window.exportDiagram = function () {
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
  a.download = 'process-diagram.svg';
  a.click();
  
  URL.revokeObjectURL(url);
  alert('✓ Diagram exported!');
};

console.log('✅ diagram.js loaded');
