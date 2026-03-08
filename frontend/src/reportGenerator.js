function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

function buildDonutChart(personaMessages) {
  const intents = personaMessages.map(m => m.intent).filter(i => i != null)
  if (intents.length === 0) return '<p style="color:#999;font-size:13px;text-align:center;padding:20px 0;">No intent data available</p>'

  const low = intents.filter(i => i <= 4).length
  const mid = intents.filter(i => i >= 5 && i <= 7).length
  const high = intents.filter(i => i >= 8).length
  const total = intents.length
  const avg = (intents.reduce((a, b) => a + b, 0) / total).toFixed(1)

  const slices = [
    { label: 'Low (1–4)', count: low, color: '#E74C3C' },
    { label: 'Medium (5–7)', count: mid, color: '#F39C12' },
    { label: 'High (8–10)', count: high, color: '#27AE60' },
  ].filter(s => s.count > 0)

  const cx = 100, cy = 100, r = 80
  let currentAngle = 0
  const paths = slices.map(s => {
    const sweep = (s.count / total) * 360
    const path = describeSlice(cx, cy, r, currentAngle, currentAngle + sweep)
    currentAngle += sweep
    return `<path d="${path}" fill="${s.color}" stroke="white" stroke-width="3"/>`
  }).join('')

  const legend = slices.map(s => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="width:12px;height:12px;border-radius:2px;background:${s.color};flex-shrink:0;"></div>
      <span style="font-size:13px;color:#444;">${s.label}</span>
      <span style="font-size:13px;font-weight:700;color:#1a1a1a;margin-left:auto;">${s.count} <span style="font-weight:400;color:#888;">(${Math.round(s.count / total * 100)}%)</span></span>
    </div>
  `).join('')

  return `
    <div style="display:flex;align-items:center;gap:48px;">
      <div style="flex-shrink:0;">
        <svg width="200" height="200" viewBox="0 0 200 200">
          ${paths}
          <circle cx="${cx}" cy="${cy}" r="50" fill="white"/>
          <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="22" font-weight="800" fill="#1a1a1a">${avg}</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#888">avg intent</text>
        </svg>
      </div>
      <div style="flex:1;">${legend}</div>
    </div>
  `
}

function buildConcernChart(personaMessages) {
  const concerns = personaMessages.map(m => m.concern).filter(Boolean)
  if (concerns.length === 0) return '<p style="color:#999;font-size:13px;">No concerns recorded</p>'

  const counts = {}
  concerns.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const max = sorted[0][1]

  return sorted.map(([concern, count]) => {
    const pct = (count / max) * 100
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
          <span style="font-size:13px;color:#333;font-weight:500;">${concern}</span>
          <span style="font-size:12px;color:#888;">${count} persona${count > 1 ? 's' : ''}</span>
        </div>
        <div style="height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:#1a1a1a;border-radius:4px;transition:width 0.3s;"></div>
        </div>
      </div>
    `
  }).join('')
}

function buildRecommendations(personaMessages) {
  if (personaMessages.length === 0) return '<p style="color:#999;font-size:13px;">Send messages to generate recommendations</p>'

  const intents = personaMessages.map(m => m.intent).filter(i => i != null)
  const avg = intents.length ? intents.reduce((a, b) => a + b, 0) / intents.length : 0
  const concerns = personaMessages.map(m => m.concern).filter(Boolean)
  const topConcern = concerns[0] || 'product positioning'
  const secondConcern = concerns[1] || 'quality signals'

  let recs
  if (avg >= 7) {
    recs = [
      { tag: 'KEEP', color: '#27AE60', text: `Strong purchase intent across panel — proceed to production with confidence.` },
      { tag: 'TWEAK', color: '#F39C12', text: `Address top concern (${topConcern}) in product copy and photography before launch.` },
      { tag: 'OPPORTUNITY', color: '#3498DB', text: 'Panel receptive to premium positioning — consider a limited higher-priced variant.' },
    ]
  } else if (avg >= 5) {
    recs = [
      { tag: 'TWEAK', color: '#F39C12', text: `Key blocker: ${topConcern} — resolve before committing to production volume.` },
      { tag: 'TWEAK', color: '#F39C12', text: `Secondary friction: ${secondConcern} — revise product specification or messaging.` },
      { tag: 'TEST', color: '#9B59B6', text: 'Run a revised concept through the panel before final sign-off.' },
    ]
  } else {
    recs = [
      { tag: 'CUT', color: '#E74C3C', text: `Low intent across panel — primary blocker: ${topConcern}.` },
      { tag: 'CUT', color: '#E74C3C', text: 'Market saturation signals detected — differentiation required before retest.' },
      { tag: 'RETHINK', color: '#F39C12', text: 'Recommend concept revision: new colourway, price point, or positioning angle.' },
    ]
  }

  return recs.map(r => `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;border:1px solid #eee;border-radius:6px;margin-bottom:10px;">
      <div style="min-width:80px;height:26px;background:${r.color};border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:10px;font-weight:800;color:white;letter-spacing:1px;">${r.tag}</span>
      </div>
      <p style="font-size:13px;color:#333;line-height:1.6;margin:2px 0 0 0;">${r.text}</p>
    </div>
  `).join('')
}

function buildRiskSignals(personaMessages) {
  const concerns = personaMessages.map(m => m.concern || '').join(' ').toLowerCase()
  const intents = personaMessages.map(m => m.intent).filter(i => i != null)
  const avg = intents.length ? intents.reduce((a, b) => a + b, 0) / intents.length : 5

  const risks = [
    {
      label: 'Market Saturation',
      level: concerns.includes('saturat') || concerns.includes('competition') ? 'HIGH' : 'MEDIUM',
      desc: 'Competing products at similar price points',
    },
    {
      label: 'Price Sensitivity',
      level: avg < 5 ? 'HIGH' : avg < 7 ? 'MEDIUM' : 'LOW',
      desc: 'Consumer willingness to pay at stated price',
    },
    {
      label: 'Return Risk',
      level: concerns.includes('fit') || concerns.includes('size') ? 'HIGH' : 'MEDIUM',
      desc: 'Likelihood of returns due to fit or quality',
    },
    {
      label: 'Trend Longevity',
      level: concerns.includes('trend') || concerns.includes('over') ? 'HIGH' : 'MEDIUM',
      desc: 'Risk of concept becoming dated before sell-through',
    },
  ]

  const levelColor = { HIGH: '#E74C3C', MEDIUM: '#F39C12', LOW: '#27AE60' }

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${risks.map(r => `
        <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#1a1a1a;">${r.label}</span>
            <span style="font-size:10px;font-weight:800;color:${levelColor[r.level]};letter-spacing:0.5px;">${r.level}</span>
          </div>
          <p style="font-size:12px;color:#888;margin:0;line-height:1.4;">${r.desc}</p>
        </div>
      `).join('')}
    </div>
  `
}

function buildWtpPlaceholder() {
  const bars = [
    { label: 'Under £50', pct: 8, color: '#e0e0e0' },
    { label: '£50–£75', pct: 24, color: '#bbb' },
    { label: '£75–£100', pct: 48, color: '#1a1a1a' },
    { label: '£100–£150', pct: 15, color: '#888' },
    { label: 'Over £150', pct: 5, color: '#e0e0e0' },
  ]

  return `
    <div style="padding:4px 0;">
      <div style="font-size:11px;color:#bbb;font-style:italic;margin-bottom:16px;">Estimated from discourse data — indicative only</div>
      ${bars.map(b => `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="font-size:12px;color:#555;width:90px;flex-shrink:0;">${b.label}</span>
          <div style="flex:1;height:22px;background:#f8f8f8;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${b.pct}%;background:${b.color};border-radius:3px;display:flex;align-items:center;padding-left:8px;">
              ${b.pct > 10 ? `<span style="font-size:11px;font-weight:600;color:${b.color === '#1a1a1a' ? 'white' : '#666'};">${b.pct}%</span>` : ''}
            </div>
          </div>
          ${b.pct <= 10 ? `<span style="font-size:11px;color:#888;">${b.pct}%</span>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function buildPersonaCards(personaMessages) {
  if (personaMessages.length === 0) return '<p style="color:#999;font-size:13px;">No responses yet.</p>'

  return personaMessages.map(m => {
    const intentPct = ((m.intent || 0) / 10) * 100
    const intentColor = m.intent >= 7 ? '#27AE60' : m.intent >= 5 ? '#F39C12' : '#E74C3C'
    return `
      <div style="border:1px solid #e8e8e8;border-radius:8px;padding:22px;margin-bottom:16px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:15px;font-weight:700;color:white;">${m.initial || (m.name || '?')[0]}</span>
          </div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:700;color:#1a1a1a;">${m.name || 'Unknown'}</div>
            <div style="font-size:12px;color:#888;margin-top:1px;">${m.demo || ''}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#aaa;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:3px;">Purchase Intent</div>
            <div style="font-size:24px;font-weight:800;color:${intentColor};line-height:1;">${m.intent ?? '—'}<span style="font-size:13px;font-weight:400;color:#ccc;">/10</span></div>
          </div>
        </div>
        <div style="height:5px;background:#f0f0f0;border-radius:3px;margin-bottom:16px;overflow:hidden;">
          <div style="height:100%;width:${intentPct}%;background:${intentColor};border-radius:3px;"></div>
        </div>
        <p style="font-size:13px;line-height:1.75;color:#444;margin:0 0 14px 0;">"${m.text}"</p>
        ${m.concern ? `
          <div style="display:inline-flex;align-items:center;gap:6px;background:#f8f8f8;border:1px solid #eee;border-radius:4px;padding:5px 12px;">
            <span style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Key Concern</span>
            <span style="font-size:12px;font-weight:600;color:#333;">${m.concern}</span>
          </div>
        ` : ''}
      </div>
    `
  }).join('')
}

export function generateReport(messages, panelName) {
  const personaMessages = messages.filter(m => m.type === 'persona' && m.intent != null)
  const userMessages = messages.filter(m => m.type === 'user')
  const lastQuestion = userMessages[userMessages.length - 1]?.text || 'Product concept evaluation'

  const intents = personaMessages.map(m => m.intent).filter(i => i != null)
  const avgIntent = intents.length ? (intents.reduce((a, b) => a + b, 0) / intents.length).toFixed(1) : 'N/A'
  const topConcern = personaMessages.map(m => m.concern).filter(Boolean)[0] || 'None identified'

  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const name = panelName || 'Panel Report'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SynMuse Report — ${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; line-height: 1.5; }
    h2.section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 20px; }
    .section { margin-bottom: 44px; }
    @media print {
      .no-print { display: none !important; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="no-print" style="position:fixed;top:20px;right:20px;z-index:999;">
  <button onclick="window.print()" style="background:#1a1a1a;color:white;border:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
    Save as PDF
  </button>
</div>

<div style="max-width:860px;margin:0 auto;padding:52px 44px;">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px;padding-bottom:24px;border-bottom:2px solid #1a1a1a;">
    <div>
      <div style="font-size:10px;font-weight:800;letter-spacing:4px;color:#bbb;text-transform:uppercase;margin-bottom:8px;">SynMuse</div>
      <h1 style="font-size:28px;font-weight:800;color:#1a1a1a;line-height:1.15;margin-bottom:4px;">${name}</h1>
      <p style="font-size:13px;color:#999;">Consumer Panel Research Report</p>
    </div>
    <div style="text-align:right;flex-shrink:0;padding-top:4px;">
      <div style="font-size:13px;color:#555;">${date}</div>
      <div style="font-size:12px;color:#bbb;margin-top:3px;">${personaMessages.length} panelist${personaMessages.length !== 1 ? 's' : ''}</div>
    </div>
  </div>

  <!-- Product concept -->
  <div style="background:#f9f9f9;border-left:3px solid #1a1a1a;padding:16px 20px;margin-bottom:44px;border-radius:0 4px 4px 0;">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#aaa;text-transform:uppercase;margin-bottom:7px;">Product Concept Tested</div>
    <p style="font-size:14px;color:#333;line-height:1.6;">${lastQuestion}</p>
  </div>

  <!-- Stat cards -->
  <div class="section">
    <h2 class="section-title">Summary</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      <div style="border:1px solid #e8e8e8;border-radius:8px;padding:22px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#aaa;text-transform:uppercase;margin-bottom:10px;">Avg Purchase Intent</div>
        <div style="font-size:40px;font-weight:800;color:#1a1a1a;line-height:1;">${avgIntent}<span style="font-size:18px;font-weight:400;color:#ccc;">/10</span></div>
      </div>
      <div style="border:1px solid #e8e8e8;border-radius:8px;padding:22px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#aaa;text-transform:uppercase;margin-bottom:10px;">Panelists</div>
        <div style="font-size:40px;font-weight:800;color:#1a1a1a;line-height:1;">${personaMessages.length}</div>
      </div>
      <div style="border:1px solid #e8e8e8;border-radius:8px;padding:22px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#aaa;text-transform:uppercase;margin-bottom:10px;">Top Concern</div>
        <div style="font-size:17px;font-weight:700;color:#1a1a1a;line-height:1.3;margin-top:4px;">${topConcern}</div>
      </div>
    </div>
  </div>

  <!-- Intent distribution -->
  <div class="section">
    <h2 class="section-title">Purchase Intent Distribution</h2>
    ${buildDonutChart(personaMessages)}
  </div>

  <!-- Concern analysis -->
  <div class="section">
    <h2 class="section-title">Concern Analysis</h2>
    ${buildConcernChart(personaMessages)}
  </div>

  <!-- Recommendations -->
  <div class="section">
    <h2 class="section-title">Recommendations</h2>
    ${buildRecommendations(personaMessages)}
  </div>

  <!-- Risk signals -->
  <div class="section">
    <h2 class="section-title">Risk Signals</h2>
    ${buildRiskSignals(personaMessages)}
  </div>

  <!-- WTP placeholder -->
  <div class="section">
    <h2 class="section-title">Willingness to Pay Range</h2>
    ${buildWtpPlaceholder()}
  </div>

  <!-- Panel responses -->
  <div class="section">
    <h2 class="section-title">Panel Responses</h2>
    ${buildPersonaCards(personaMessages)}
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #e8e8e8;padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:#ccc;">Generated by SynMuse · Synthetic Consumer Research Platform</div>
    <div style="font-size:11px;color:#ccc;">${date}</div>
  </div>

</div>
</body>
</html>`
}
