const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'reports');
const extentDir = path.join(reportDir, 'extent');
const jsonPath = path.join(reportDir, 'cucumber-report.json');

if (!fs.existsSync(jsonPath)) {
  console.log('No cucumber-report.json found; skipping Extent report generation.');
  process.exit(0);
}

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const sanitize = (value) => String(value ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const scenarioRows = [];
let passCount = 0;
let failCount = 0;
let skippedCount = 0;

for (const feature of json) {
  const scenarios = Array.isArray(feature.elements) ? feature.elements : [];

  for (const scenario of scenarios) {
    let status = 'Pass';
    if (Array.isArray(scenario.steps)) {
      const failed = scenario.steps.some((step) => step.result && step.result.status === 'failed');
      const skipped = scenario.steps.every((step) => !step.result || step.result.status === 'skipped' || step.result.status === 'undefined');

      if (failed) status = 'Fail';
      else if (skipped) status = 'Skipped';
    }

    if (status === 'Pass') passCount += 1;
    else if (status === 'Fail') failCount += 1;
    else skippedCount += 1;

    scenarioRows.push(`
      <tr>
        <td>${sanitize(feature.name || 'Unknown feature')}</td>
        <td>${sanitize(scenario.name || 'Unnamed scenario')}</td>
        <td class="${status.toLowerCase()}">${status}</td>
      </tr>`);
  }
}

const total = passCount + failCount + skippedCount || 1;
const passPct = ((passCount / total) * 100).toFixed(1);
const failPct = ((failCount / total) * 100).toFixed(1);
const skipPct = ((skippedCount / total) * 100).toFixed(1);

const chart = `
  <div class="donut" style="background: conic-gradient(#22c55e 0 ${passPct}%, #ef4444 ${passPct}% ${(+passPct + +failPct).toFixed(1)}%, #f59e0b ${(+passPct + +failPct).toFixed(1)}% 100%);">
    <div class="donut-center">
      <strong>${total}</strong><span>total</span>
    </div>
  </div>
`;

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Fakerest API Acceptance Report</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(180deg, #eef4ff 0%, #f7f9fc 100%);
      color: #1f2937;
    }
    .container { padding: 28px; max-width: 1280px; margin: 0 auto; }
    .banner {
      background: linear-gradient(90deg, #0f172a 0%, #1d4ed8 100%);
      color: #fff;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(29,78,216,0.2);
      margin-bottom: 26px;
    }
    .banner h1 {
      margin: 0;
      font-size: 30px;
      letter-spacing: 0.3px;
    }
    .banner small {
      display: block;
      margin-top: 8px;
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }
    .card {
      background: white;
      padding: 18px 20px;
      border-radius: 12px;
      min-height: 120px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      border-left: 8px solid #d1d5db;
    }
    .card.pass { border-color: #22c55e; background: #f0fdf4; }
    .card.fail { border-color: #ef4444; background: #fef2f2; }
    .card.skip { border-color: #f59e0b; background: #fff7ed; }
    .card.total { border-color: #3b82f6; background: #eff6ff; }
    .card .label {
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.08em;
    }
    .card .value {
      font-size: 38px;
      font-weight: 800;
      margin-top: 14px;
      line-height: 1;
    }
    .pass .value { color: #15803d; }
    .fail .value { color: #b91c1c; }
    .skip .value { color: #b45309; }
    .total .value { color: #1d4ed8; }
    .chart-panel {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      display: flex;
      align-items: center;
      gap: 36px;
      margin-bottom: 28px;
      min-height: 220px;
    }
    .donut {
      width: 210px;
      height: 210px;
      border-radius: 50%;
      position: relative;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
    }
    .donut-center {
      position: absolute;
      inset: 28px;
      background: white;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #4b5563;
      box-shadow: inset 0 0 0 1px #e5e7eb;
    }
    .donut-center strong { font-size: 32px; color: #111827; }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 16px;
      width: 100%;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.8);
    }
    .dot-pass { background: #22c55e; }
    .dot-fail { background: #ef4444; }
    .dot-skip { background: #f59e0b; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      border-radius: 12px;
      overflow: hidden;
      font-size: 15px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      text-align: left;
      padding: 12px 14px;
    }
    th {
      background: #eff6ff;
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pass { color: #15803d; font-weight: 700; }
    .fail { color: #b91c1c; font-weight: 700; }
    .skip { color: #b45309; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>Fakerest API Acceptance Test Report</h1>
      <small>Jenkins build dashboard • pass/fail summary</small>
    </div>

    <div class="summary">
      <div class="card pass"><div class="label">Passed</div><div class="value">${passCount}</div></div>
      <div class="card fail"><div class="label">Failed</div><div class="value">${failCount}</div></div>
      <div class="card skip"><div class="label">Skipped</div><div class="value">${skippedCount}</div></div>
      <div class="card total"><div class="label">Total</div><div class="value">${total}</div></div>
    </div>

    <div class="chart-panel">
      ${chart}
      <div class="legend">
        <div class="legend-item"><span class="dot dot-pass"></span> Passed: ${passCount} (${passPct}%)</div>
        <div class="legend-item"><span class="dot dot-fail"></span> Failed: ${failCount} (${failPct}%)</div>
        <div class="legend-item"><span class="dot dot-skip"></span> Skipped: ${skippedCount} (${skipPct}%)</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Scenario</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${scenarioRows.join('') || '<tr><td colspan="3">No scenarios found</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;

fs.mkdirSync(extentDir, { recursive: true });
fs.writeFileSync(path.join(extentDir, 'index.html'), html, 'utf8');
console.log(`Extent dashboard generated at ${path.join(extentDir, 'index.html')}`);
