// DSR Web Panel - Router

// Page views
const views = {
  dashboard: (data) => ({
    title: "Dashboard",
    render: () => `
      <div class="grid">
        <div class="card">
          <div class="stat-value">${data.tokens.total}</div>
          <div class="stat-label">Design Tokens</div>
        </div>
        <div class="card">
          <div class="stat-value">${data.tokens.collections}</div>
          <div class="stat-label">Collections</div>
        </div>
        <div class="card">
          <div class="stat-value text-error">${data.validation.errors}</div>
          <div class="stat-label">Validation Errors</div>
        </div>
        <div class="card">
          <div class="stat-value text-success">${data.health.status}</div>
          <div class="stat-label">System Health</div>
        </div>
      </div>
      <div class="card mt-4">
        <h2>Recent Activity</h2>
        <table>
          <thead>
            <tr><th>Action</th><th>Status</th><th>Time</th></tr>
          </thead>
          <tbody>
            <tr><td>Token sync from Figma</td><td><span class="badge badge-success">Success</span></td><td>2 min ago</td></tr>
            <tr><td>Validation run</td><td><span class="badge badge-warning">3 errors</span></td><td>15 min ago</td></tr>
            <tr><td>Pattern detection</td><td><span class="badge badge-success">Complete</span></td><td>1 hour ago</td></tr>
          </tbody>
        </table>
      </div>
    `
  }),
  
  tokens: (data) => ({
    title: "Design Tokens",
    render: () => `
      <div class="card">
        <h2>Token Collections</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Count</th><th>Last Sync</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Colors</td><td>48</td><td>2026-04-27</td><td><span class="badge badge-success">Synced</span></td></tr>
            <tr><td>Typography</td><td>24</td><td>2026-04-27</td><td><span class="badge badge-success">Synced</span></td></tr>
            <tr><td>Spacing</td><td>16</td><td>2026-04-26</td><td><span class="badge badge-warning">Pending</span></td></tr>
            <tr><td>Shadows</td><td>12</td><td>2026-04-26</td><td><span class="badge badge-success">Synced</span></td></tr>
          </tbody>
        </table>
      </div>
      <div class="card mt-4">
        <h2>Quick Actions</h2>
        <div class="flex gap-4">
          <button class="btn btn-primary">Import from Figma</button>
          <button class="btn btn-secondary">Export to JSON</button>
          <button class="btn btn-secondary">Validate All</button>
        </div>
      </div>
    `
  }),
  
  validation: (data) => ({
    title: "Validation Results",
    render: () => `
      <div class="grid">
        <div class="card">
          <div class="stat-value text-error">${data.validation.errors}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="card">
          <div class="stat-value text-warning">${data.validation.warnings}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="card">
          <div class="stat-value text-success">${data.validation.passed}</div>
          <div class="stat-label">Passed</div>
        </div>
      </div>
      <div class="card mt-4">
        <h2>Validation Issues</h2>
        <table>
          <thead>
            <tr><th>Rule</th><th>Severity</th><th>Count</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>dsr.token.no-raw-values</td>
              <td><span class="badge badge-error">Error</span></td>
              <td>2</td>
              <td><button class="btn btn-secondary">Fix</button></td>
            </tr>
            <tr>
              <td>dsr.spacing.grid-8pt</td>
              <td><span class="badge badge-warning">Warning</span></td>
              <td>8</td>
              <td><button class="btn btn-secondary">Fix</button></td>
            </tr>
            <tr>
              <td>dsr.pattern.hero-missing-cta</td>
              <td><span class="badge badge-warning">Warning</span></td>
              <td>4</td>
              <td><button class="btn btn-secondary">Fix</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }),
  
  patterns: (data) => ({
    title: "Pattern Detection",
    render: () => `
      <div class="card">
        <h2>Detected Patterns</h2>
        <table>
          <thead>
            <tr><th>Pattern</th><th>Confidence</th><th>Instances</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Hero Section</td>
              <td>94%</td>
              <td>12</td>
              <td><span class="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td>Card Component</td>
              <td>87%</td>
              <td>45</td>
              <td><span class="badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td>List Layout</td>
              <td>76%</td>
              <td>8</td>
              <td><span class="badge badge-success">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }),
  
  figma: (data) => ({
    title: "Figma Sync",
    render: () => `
      <div class="card">
        <h2>Figma Connection</h2>
        <div class="form-group">
          <label>File Key</label>
          <input type="text" value="ABC123XYZ" readonly />
        </div>
        <div class="form-group">
          <label>Last Sync</label>
          <input type="text" value="${data.tokens.lastSync}" readonly />
        </div>
        <div class="flex gap-4 mt-4">
          <button class="btn btn-primary">Sync Now</button>
          <button class="btn btn-secondary">Configure</button>
        </div>
      </div>
      <div class="card mt-4">
        <h2>Sync History</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Tokens</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>2026-04-27 14:30</td><td>156 tokens</td><td><span class="badge badge-success">Success</span></td></tr>
            <tr><td>2026-04-26 09:15</td><td>148 tokens</td><td><span class="badge badge-success">Success</span></td></tr>
          </tbody>
        </table>
      </div>
    `
  }),
  
  health: (data) => ({
    title: "System Health",
    render: () => `
      <div class="grid">
        <div class="card">
          <div class="stat-value text-success">${data.health.status}</div>
          <div class="stat-label">Status</div>
        </div>
        <div class="card">
          <div class="stat-value">${data.health.uptime}</div>
          <div class="stat-label">Uptime</div>
        </div>
        <div class="card">
          <div class="stat-value">${data.health.latency}</div>
          <div class="stat-label">Latency</div>
        </div>
      </div>
      <div class="card mt-4">
        <h2>Component Health</h2>
        <table>
          <thead>
            <tr><th>Component</th><th>Status</th><th>Response Time</th></tr>
          </thead>
          <tbody>
            <tr><td>Token Normalizer</td><td><span class="badge badge-success">Healthy</span></td><td>12ms</td></tr>
            <tr><td>Pattern Engine</td><td><span class="badge badge-success">Healthy</span></td><td>45ms</td></tr>
            <tr><td>Validator</td><td><span class="badge badge-success">Healthy</span></td><td>23ms</td></tr>
            <tr><td>Figma API</td><td><span class="badge badge-success">Healthy</span></td><td>120ms</td></tr>
          </tbody>
        </table>
      </div>
    `
  }),
  
  settings: (data) => ({
    title: "Settings",
    render: () => `
      <div class="card">
        <h2>General Settings</h2>
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" value="DSR Project" />
        </div>
        <div class="form-group">
          <label>Default Ruleset</label>
          <select>
            <option>strict</option>
            <option>relaxed</option>
            <option>minimal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Telemetry</label>
          <select>
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>
        <div class="mt-4">
          <button class="btn btn-primary">Save Changes</button>
        </div>
      </div>
      <div class="card mt-4">
        <h2>About</h2>
        <p class="text-muted">DSR v0.1.0 — Design System Runtime</p>
        <p class="text-muted">294 tests passing</p>
      </div>
    `
  })
};

export const resolveRoute = (route) => {
  const view = views[route] || views.dashboard;
  return view({});
};
