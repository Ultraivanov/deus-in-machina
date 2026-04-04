import { mockState } from "./state.js";

const renderStateRow = (label, value) => `
  <div class="state-row">
    <span class="state-label">${label}</span>
    <span class="state-value">${value}</span>
  </div>
`;

export const routes = {
  "/state": () => ({
    title: "Project State",
    body: `
      <div class="grid">
        <div class="card">
          <h2>Active Phase</h2>
          <div class="state-list">
            ${renderStateRow("ID", mockState.phase.id)}
            ${renderStateRow("Title", mockState.phase.title)}
            ${renderStateRow("Status", mockState.phase.status)}
          </div>
        </div>
        <div class="card">
          <h2>Active Block</h2>
          <div class="state-list">
            ${renderStateRow("ID", mockState.block.id)}
            ${renderStateRow("Title", mockState.block.title)}
            ${renderStateRow("Status", mockState.block.status)}
          </div>
        </div>
        <div class="card">
          <h2>Active Task</h2>
          <div class="state-list">
            ${renderStateRow("ID", mockState.task.id)}
            ${renderStateRow("Title", mockState.task.title)}
            ${renderStateRow("Status", mockState.task.status)}
          </div>
        </div>
      </div>
      <div class="card state-summary">
        <h2>Progress</h2>
        <div class="state-list">
          ${renderStateRow("MVP progress", `${mockState.progress.mvp_progress_percent}%`)}
          ${renderStateRow("Steps completed", mockState.progress.steps_completed)}
          ${renderStateRow("Blocked", mockState.progress.blocked ? "Yes" : "No")}
          ${renderStateRow("Confidence", mockState.progress.confidence)}
        </div>
      </div>
    `
  }),
  "/next": () => ({
    title: "Next Step",
    body: `
      <div class="card">
        <h2>${mockState.next_step.title}</h2>
        <p class="muted">Task ID: ${mockState.next_step.task_id}</p>
        <p><strong>Why now:</strong> ${mockState.next_step.why_now}</p>
        <p><strong>Expected result:</strong> ${mockState.next_step.expected_result}</p>
        <div class="scope-list">
          <span class="pill">Scope</span>
          <ul>
            ${mockState.next_step.estimated_change_scope
              .map((file) => `<li>${file}</li>`)
              .join("")}
          </ul>
        </div>
        <div class="action-panel">
          <span class="muted">Session status: waiting for approval</span>
          <a class="cta" href="#/state">Review state</a>
        </div>
      </div>
    `
  })
};

export const resolveRoute = () => {
  const hash = window.location.hash.replace("#", "") || "/state";
  return routes[hash] ?? routes["/state"];
};
