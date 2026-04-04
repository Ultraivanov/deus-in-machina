export const routes = {
  "/state": () => ({
    title: "Project State",
    body: `
      <div class="grid">
        <div class="card">
          <h2>Active Phase</h2>
          <p class="muted">MVP</p>
          <span class="pill">In progress</span>
        </div>
        <div class="card">
          <h2>Active Block</h2>
          <p class="muted">Scope + DoD pipeline</p>
          <span class="pill">In progress</span>
        </div>
        <div class="card">
          <h2>Active Task</h2>
          <p class="muted">Persist scope validation</p>
          <span class="pill">Ready</span>
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
