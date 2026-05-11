// ===========================================================
// GRAPHS & VISUALIZATIONS
// ===========================================================

// RENDER ISHIKAWA (FISHBONE) DIAGRAM
window.renderIshikawa = function() {
  const canvas = document.getElementById('ishikawa-canvas');
  if (!canvas) {
    console.error('Ishikawa canvas not found');
    return;
  }
  
  if (!window.currentRCA || !window.currentRCA.problem) {
    canvas.innerHTML = '<div style="text-align:center;padding:3rem;color:#999;"><h3>🐟 Ishikawa Diagram</h3><p style="margin-top:10px;">No Root Cause Analysis data available.</p><p style="margin-top:10px;"><em>Go to GAPS section → click "Add Root Cause" button</em></p></div>';
    return;
  }
  
  const rca = window.currentRCA;
  const width = 1000;
  const height = 600;
  
  // Build SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background:#f9fafb;">`;
  
  // Main spine (horizontal line)
  svg += `<line x1="100" y1="300" x2="800" y2="300" stroke="#374151" stroke-width="3"/>`;
  
  // Problem box (fish head)
  svg += `<rect x="800" y="270" width="180" height="60" rx="8" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>`;
  svg += `<text x="890" y="305" text-anchor="middle" font-size="14" font-weight="bold" fill="white">PROBLEM</text>`;
  
  const problemText = rca.problem.length > 25 ? rca.problem.substring(0, 25) + '...' : rca.problem;
  svg += `<text x="890" y="322" text-anchor="middle" font-size="12" fill="white">${escapeXml(problemText)}</text>`;
  
  // Categories (bones)
  const categories = [
    { name: 'People', data: rca.people, y: 150, angle: -30 },
    { name: 'Method', data: rca.method, y: 200, angle: -15 },
    { name: 'Machine', data: rca.machine, y: 250, angle: -8 },
    { name: 'Material', data: rca.material, y: 350, angle: 8 },
    { name: 'Measurement', data: rca.measurement, y: 400, angle: 15 },
    { name: 'Environment', data: rca.environment, y: 450, angle: 30 }
  ];
  
  categories.forEach((cat, idx) => {
    if (!cat.data) return;
    
    const isTop = cat.y < 300;
    const x = 150 + (idx * 110);
    
    // Bone line
    svg += `<line x1="${x}" y1="300" x2="${x}" y2="${cat.y}" stroke="#6b7280" stroke-width="2"/>`;
    
    // Category label box
    const boxY = isTop ? cat.y - 40 : cat.y + 10;
    svg += `<rect x="${x - 60}" y="${boxY}" width="120" height="30" rx="4" fill="#0088ff" stroke="#0066cc" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${boxY + 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="white">${cat.name}</text>`;
    
    // Causes (split by comma or newline)
    const causes = cat.data.split(/[,\n]/).filter(c => c.trim()).slice(0, 2);
    causes.forEach((cause, i) => {
      const causeY = isTop ? boxY - 15 - (i * 15) : boxY + 40 + (i * 15);
      const causeText = cause.trim().substring(0, 20);
      svg += `<text x="${x}" y="${causeY}" text-anchor="middle" font-size="9" fill="#374151">• ${escapeXml(causeText)}</text>`;
    });
  });
  
  // Consequences box at bottom
  if (rca.consequences) {
    svg += `<rect x="100" y="520" width="700" height="60" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>`;
    svg += `<text x="110" y="540" font-size="11" font-weight="bold" fill="#92400e">Consequences:</text>`;
    const consText = rca.consequences.substring(0, 100);
    svg += `<text x="110" y="560" font-size="10" fill="#78350f">${escapeXml(consText)}</text>`;
  }
  
  svg += `</svg>`;
  
  canvas.innerHTML = svg;
};

// Helper to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// EXPORT ISHIKAWA AS SVG
window.exportIshikawa = function() {
  const canvas = document.getElementById('ishikawa-canvas');
  const svg = canvas.querySelector('svg');
  
  if (!svg) {
    alert('No diagram to export. Generate an Ishikawa diagram first.');
    return;
  }
  
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ishikawa-diagram.svg';
  a.click();
  
  URL.revokeObjectURL(url);
  alert('✓ Ishikawa diagram exported!');
};

console.log('✅ graphs.js loaded');
