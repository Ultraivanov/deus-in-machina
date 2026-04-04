export const mockState = {
  project: {
    id: "proj_demo",
    status: "active"
  },
  phase: {
    id: "phase_mvp",
    title: "MVP",
    status: "in_progress"
  },
  block: {
    id: "B-02",
    title: "Thin companion UI (optional)",
    status: "in_progress"
  },
  task: {
    id: "B-02-T2",
    title: "Project state view",
    status: "ready"
  },
  progress: {
    mvp_progress_percent: 62,
    steps_completed: 18,
    blocked: false,
    confidence: "medium"
  },
  next_step: {
    task_id: "B-02-T3",
    title: "Next step + action panel",
    why_now: "Keeps the companion UI actionable and reduces uncertainty.",
    expected_result: "UI shows next task, scope, and session status.",
    estimated_change_scope: ["ui/router.js", "ui/state.js", "ui/styles.css"]
  }
};
