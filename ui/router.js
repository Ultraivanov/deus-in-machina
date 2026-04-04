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
        <h2>Next Task</h2>
        <p class="muted">Implement allowlist inference for the current task.</p>
        <p>Why now: keeps scope deterministic and drift‑free.</p>
        <a class="cta" href="#/state">View current state</a>
      </div>
    `
  })
};

export const resolveRoute = () => {
  const hash = window.location.hash.replace("#", "") || "/state";
  return routes[hash] ?? routes["/state"];
};
