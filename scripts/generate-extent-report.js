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

const featureRows = json
  .map((feature) => {
    const scenarios = Array.isArray(feature.elements) ? feature.elements : [];
    const rows = scenarios
      .map((scenario) => {
        const status = scenario.steps?.some((step) => step.result && step.result.status === 'failed') ? 'Fail' : 'Pass';
        const scenarioName = sanitize(scenario.name || 'Unnamed scenario');
        return `
          <tr>
            <td>${sanitize(feature.name || 'Unknown')}</td>
            <td>${scenarioName}</td>
            <td>${status}</td>
          </tr>`;
      })
      .join('');
    return rows;
  })
  .join('');

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Extent Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #f5f7fb; color: #222; }
    h1 { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 6px rgba(0,0,0,.08); }
    th, td { border: 1px solid #dfe3eb; padding: 10px 12px; text-align: left; }
    th { background: #eef3ff; }
    .pass { color: green; font-weight: bold; }
    .fail { color: darkred; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Fakerest API Acceptance Test Report</h1>
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>Scenario</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${featureRows || '<tr><td colspan="3">No scenarios found</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

fs.mkdirSync(extentDir, { recursive: true });
fs.writeFileSync(path.join(extentDir, 'index.html'), html, 'utf8');
console.log(`Extent report generated at ${path.join(extentDir, 'index.html')}`);
