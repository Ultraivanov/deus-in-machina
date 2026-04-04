# Codex Client Example

This is a minimal, runnable sequence of MCP tool calls for Codex.

> Replace IDs with the values returned by the server.

---

## 1) Start the MCP server

```bash
npm install
npm run dev
```

---

## 2) Initialize project

```json
{
  "tool": "initialize_project",
  "arguments": {
    "idea": "Build a simple landing page + login",
    "repo_root": ".",
    "user_id": "user_demo"
  }
}
```

Expected response (example):
```json
{
  "project_id": "proj_123",
  "current_step": {
    "task_id": "task_456"
  }
}
```

---

## 3) Get next step

```json
{
  "tool": "get_next_step",
  "arguments": {
    "project_id": "proj_123",
    "user_id": "user_demo"
  }
}
```

---

## 4) Generate agent prompt

```json
{
  "tool": "generate_agent_prompt",
  "arguments": {
    "project_id": "proj_123",
    "task_id": "task_456",
    "assistant": "codex",
    "user_id": "user_demo"
  }
}
```

---

## 5) Start session (requires Change Plan approval)

```json
{
  "tool": "start_session",
  "arguments": {
    "project_id": "proj_123",
    "task_id": "task_456",
    "assistant": "codex",
    "prompt_snapshot": "You are working on a bounded task...",
    "change_plan": {
      "files_to_modify": ["app/page.tsx"],
      "files_to_create": [],
      "files_not_touched": "everything else in scope",
      "approach": "Implement the landing page hero section",
      "risks": "Low"
    },
    "change_plan_approved": true,
    "user_id": "user_demo"
  }
}
```

---

## 6) Submit agent result

```json
{
  "tool": "submit_agent_result",
  "arguments": {
    "session_id": "sess_789",
    "summary": "Added hero section to landing page",
    "changed_files": ["app/page.tsx"],
    "user_id": "user_demo"
  }
}
```

---

## 7) Validate scope

```json
{
  "tool": "validate_scope",
  "arguments": {
    "session_id": "sess_789",
    "changed_files": ["app/page.tsx"],
    "user_id": "user_demo"
  }
}
```

---

## 8) Explain changes

```json
{
  "tool": "explain_changes",
  "arguments": {
    "session_id": "sess_789",
    "user_id": "user_demo"
  }
}
```

---

## 9) Complete task

```json
{
  "tool": "complete_task",
  "arguments": {
    "task_id": "task_456",
    "session_id": "sess_789",
    "definition_of_done_checks": {
      "First screen renders": true,
      "Scope limited to allowed files": true
    },
    "user_id": "user_demo"
  }
}
```

---

## 10) Optional: approve scope override

If scope drift is detected:

```json
{
  "tool": "approve_scope_override",
  "arguments": {
    "session_id": "sess_789",
    "approved_files": ["lib/auth.ts"],
    "reason": "Small auth change required to render the hero",
    "user_id": "user_demo"
  }
}
```
