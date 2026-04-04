# MCP Tools Spec
## Project: Buildrail — AI Project Companion for Structured Vibe Coding
### File: `mcp-tools-spec.md`
### Version: MVP v0.1

---

## 1. Purpose

This document defines the MCP tool surface for the MVP.

The server is responsible for:
- maintaining project workflow state
- recommending the next step
- generating bounded prompts for coding agents
- enforcing Change Plan approval
- validating scope and completion
- translating agent output into user-facing language

This tool surface is intentionally narrow.
It is designed for:
- deterministic progression
- bounded session work
- minimal ambiguity
- compatibility with MCP-enabled assistants

---

## 2. Design Rules

1. Tool names must be explicit and action-oriented.
2. Every write operation must be tied to a project and task.
3. The server must reject floating or ambiguous session submissions.
4. Tool responses must be compact, structured, and machine-usable.
5. User-facing explanation should be returned separately from raw validation details.
6. Progress updates should happen only after validation.
7. One task per session.
8. Change Plan must be approved before code.
9. File-first state is canonical (stored under `.assistant/`).

---

## 3. Naming and Conventions

### IDs
```ts
type ID = string // example: "proj_123", "task_456", "sess_789"
```

### Status enums
```ts
type ProjectStatus = "active" | "paused" | "done"
type NodeStatus = "not_started" | "ready" | "in_progress" | "review" | "done" | "blocked"
type SessionStatus = "started" | "submitted" | "validated" | "rejected"
type ValidationStatus = "pending" | "passed" | "failed" | "needs_approval"
type SkillLevel = "beginner" | "intermediate" | "advanced"
type AssistantType = "codex" | "claude_code" | "cursor" | "other"
```

### Error envelope
All tools should return structured errors in this shape:
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task task_456 does not exist",
    "retryable": false
  }
}
```

### Standard error codes
- `INVALID_INPUT`
- `PROJECT_NOT_FOUND`
- `PHASE_NOT_FOUND`
- `BLOCK_NOT_FOUND`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `TASK_NOT_ACTIVE`
- `TASK_NOT_READY`
- `SCOPE_VIOLATION`
- `DOD_NOT_MET`
- `AMBIGUOUS_RESULT`
- `STATE_CONFLICT`
- `UNSUPPORTED_ASSISTANT`
- `INTERNAL_ERROR`

---

## 4. Tool List

### Required tools
1. `initialize_project`
2. `get_project_state`
3. `get_next_step`
4. `generate_agent_prompt`
5. `start_session`
6. `submit_agent_result`
7. `validate_scope`
8. `explain_changes`
9. `complete_task`

### Optional tools for v0.2
- `resume_project`
- `list_pending_reviews`
- `approve_scope_override`
- `reject_session`
- `reopen_task`

---

## 5. Tool: `initialize_project`

### Purpose
Creates a new project and generates an initial workflow map from natural language input.

### Input schema
```json
{
  "idea": "Build a simple SaaS app with landing page, login, and dashboard",
  "repo_summary": "Next.js + Tailwind repo already initialized",
  "repo_url": "https://github.com/example/repo",
  "skill_level": "beginner",
  "constraints": [
    "Keep MVP small",
    "Prefer serverless-friendly architecture"
  ]
}
```

### Input fields
- `idea` — required string
- `repo_summary` — optional string
- `repo_url` — optional string
- `skill_level` — optional enum, default `beginner`
- `constraints` — optional array of strings

### Behavior
- create project record
- infer first set of phases, blocks, and tasks
- mark first task as `ready`
- set project status to `active`
- write `.assistant/PHASES.md` (file-first state)

### Output schema
```json
{
  "project_id": "proj_123",
  "project_summary": "MVP SaaS app with landing page, auth, and dashboard",
  "state_path": ".assistant/",
  "phases": [
    {
      "id": "phase_1",
      "title": "Foundation",
      "goal": "Create the first visible and runnable product shell",
      "status": "in_progress"
    }
  ],
  "current_step": {
    "task_id": "task_101",
    "title": "Define landing page structure",
    "why_now": "This anchors visible MVP scope and creates the first user-facing path."
  }
}
```

### Errors
- `INVALID_INPUT`
- `INTERNAL_ERROR`

---

## 6. Tool: `get_project_state`

### Purpose
Returns current workflow state for a project.

### Input schema
```json
{
  "project_id": "proj_123"
}
```

### Output schema
```json
{
  "project_id": "proj_123",
  "project_status": "active",
  "state_path": ".assistant/",
  "current_phase": {
    "id": "phase_1",
    "title": "Foundation",
    "status": "in_progress"
  },
  "current_block": {
    "id": "block_1",
    "title": "Landing Page",
    "status": "in_progress"
  },
  "current_task": {
    "id": "task_101",
    "title": "Implement hero section",
    "status": "ready"
  },
  "progress": {
    "mvp_progress_percent": 18,
    "steps_completed": 2,
    "blocked": false,
    "confidence": "medium"
  }
}
```

### Errors
- `PROJECT_NOT_FOUND`

---

## 7. Tool: `get_next_step`

### Purpose
Returns the next recommended task and a beginner-friendly explanation.

### Input schema
```json
{
  "project_id": "proj_123"
}
```

### Output schema
```json
{
  "task_id": "task_101",
  "title": "Implement hero section",
  "user_explanation": "This creates the first visible screen of your product.",
  "why_now": "The landing hero gives the MVP a concrete entry point before deeper flows.",
  "expected_result": "Responsive hero with headline, subhead, and primary CTA",
  "estimated_change_scope": [
    "app/page.tsx",
    "components/Hero.tsx"
  ]
}
```

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_READY`

---

## 8. Tool: `generate_agent_prompt`

### Purpose
Creates a bounded implementation prompt for a specific task.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "assistant": "codex"
}
```

### Behavior
- verify task exists and is `ready` or `in_progress`
- assemble compact task context
- include allowed files and constraints
- exclude unrelated project context

### Output schema
```json
{
  "task_id": "task_101",
  "assistant": "codex",
  "prompt": "You are working on a bounded implementation task inside an existing project...",
  "scope": {
    "allowed_files": [
      "app/page.tsx",
      "components/Hero.tsx"
    ],
    "disallowed_actions": [
      "Do not refactor unrelated components",
      "Do not modify auth logic",
      "Do not change config files"
    ]
  },
  "definition_of_done": [
    "Hero section renders on the landing page",
    "Primary CTA is visible",
    "Only allowed files were changed"
  ],
  "change_plan_template": {
    "files_to_modify": [],
    "files_to_create": [],
    "files_not_touched": "everything else in scope",
    "approach": "",
    "risks": ""
  }
}
```

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `TASK_NOT_READY`
- `UNSUPPORTED_ASSISTANT`

---

## 9. Tool: `start_session`

### Purpose
Creates a session record before agent execution.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "assistant": "codex",
  "prompt_snapshot": "You are working on a bounded task...",
  "change_plan": {
    "files_to_modify": ["app/page.tsx"],
    "files_to_create": ["components/Hero.tsx"],
    "approach": "Extract hero into a component and render it on the page.",
    "risks": "Low"
  },
  "change_plan_approved": true
}
```

### Behavior
- reject if task is not `ready`
- reject if another task is `in_progress`
- reject if `change_plan_approved` is not true

### Output schema
```json
{
  "session_id": "sess_789",
  "task_id": "task_101",
  "status": "started",
  "started_at": "2026-04-04T10:00:00Z"
}
```

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `TASK_NOT_READY`
- `STATE_CONFLICT`
- `INVALID_INPUT`

---

## 10. Tool: `submit_agent_result`

### Purpose
Submits a structured summary of what the agent did.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "session_id": "sess_789",
  "assistant": "codex",
  "summary": "Implemented a responsive hero section and extracted Hero component.",
  "changed_files": [
    "app/page.tsx",
    "components/Hero.tsx"
  ],
  "blockers": [],
  "notes": [
    "No auth logic was touched"
  ]
}
```

### Required fields
- `project_id`
- `task_id`
- `session_id`
- `assistant`
- `summary`
- `changed_files`

### Output schema
```json
{
  "session_id": "sess_789",
  "status": "submitted",
  "validation_status": "pending"
}
```

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `STATE_CONFLICT`
- `AMBIGUOUS_RESULT`

---

## 11. Tool: `validate_scope`

### Purpose
Checks whether the reported file changes remain inside allowed task scope.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "session_id": "sess_789",
  "changed_files": [
    "app/page.tsx",
    "components/Hero.tsx",
    "lib/auth.ts"
  ]
}
```

### Output schema: passed
```json
{
  "session_id": "sess_789",
  "scope_ok": true,
  "validation_status": "passed",
  "unexpected_files": [],
  "message": "All changed files are inside the approved task scope."
}
```

### Output schema: failed / approval needed
```json
{
  "session_id": "sess_789",
  "scope_ok": false,
  "validation_status": "needs_approval",
  "unexpected_files": [
    "lib/auth.ts"
  ],
  "message": "The agent touched auth logic, which is outside this task."
}
```

### Behavior
- compare `changed_files` against task `allowed_files`
- if extras exist, return `needs_approval`
- do not auto-complete task on scope mismatch

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`

---

## 12. Tool: `explain_changes`

### Purpose
Translates the session result into plain language.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "session_id": "sess_789"
}
```

### Output schema
```json
{
  "plain_language_summary": [
    "Your landing page now has a visible first screen.",
    "A reusable Hero component was created.",
    "Only the landing page files were changed."
  ],
  "why_it_matters": "This gives the MVP its first visible user-facing surface.",
  "user_safe_to_continue": true
}
```

### Behavior
- use session summary
- use scope validation result
- keep explanation non-technical if project skill level is beginner
- mention drift or blockers if present

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`

---

## 13. Tool: `complete_task`

### Purpose
Marks task complete only if validation has passed and DoD is satisfied.

### Input schema
```json
{
  "project_id": "proj_123",
  "task_id": "task_101",
  "session_id": "sess_789",
  "definition_of_done_checks": {
    "hero_renders": true,
    "cta_visible": true,
    "scope_clean": true
  }
}
```

### Output schema: success
```json
{
  "task_id": "task_101",
  "task_status": "done",
  "session_status": "validated",
  "next_task": {
    "task_id": "task_102",
    "title": "Add trust/proof section below the hero"
  }
}
```

### Output schema: failed
```json
{
  "task_id": "task_101",
  "task_status": "review",
  "session_status": "submitted",
  "missing_conditions": [
    "cta_visible"
  ],
  "message": "Task is not complete because Definition of Done is not fully met."
}
```

### Errors
- `PROJECT_NOT_FOUND`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `DOD_NOT_MET`
- `SCOPE_VIOLATION`

---

## 14. End-to-End Happy Path

1. `initialize_project`
2. `get_next_step`
3. `generate_agent_prompt`
4. `start_session` (with approved Change Plan)
5. `submit_agent_result`
6. `validate_scope`
7. `explain_changes`
8. `complete_task`

---

## 15. State Transition Rules

### Task transitions
```text
not_started → ready → in_progress → review → done
                          ↘ blocked
```

### Session transitions
```text
started → submitted → validated
                  ↘ rejected
```

### Constraints
- `generate_agent_prompt` may only run for `ready` or `in_progress` tasks
- `start_session` requires approved Change Plan and no other in-progress task
- `submit_agent_result` requires a `started` session
- `complete_task` requires validation to have passed
- scope failure prevents auto-completion

---

## 16. Logging and Persistence

The server should persist:
- project record
- phase/block/task graph
- current cursor
- session records
- prompt snapshots
- change plans
- scope validation outcomes
- DoD completion outcomes
- explanation snapshots

Canonical state lives in `.assistant/` in the repo; DB mirrors are optional for hosted versions.

---

## 17. One-line Summary

**These tools turn a coding assistant into a bounded, stateful execution flow rather than a free-form chat that rewrites the project unpredictably.**
