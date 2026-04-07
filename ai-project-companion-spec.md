# Assistant-agnostic Product Spec
## Project: Buildrail — AI Project Companion for Structured Vibe Coding
### Working title: Buildrail
### Format: Markdown, implementation-oriented
### Version: MVP v0.1

---

## 1. Product Thesis

This product is **not** an IDE, task manager, or project dashboard.

It is a **middleware execution layer** between:
- a non-technical or semi-technical builder
- an AI coding assistant (Codex, Claude Code, Cursor, etc.)
- the codebase

Its job is to make AI-assisted development:
- more predictable
- more explainable
- more scoped
- easier to resume
- easier to hand off

The product hides structured mechanics behind a very simple experience:
- show the user the next step
- prepare context for the agent
- constrain scope
- explain what changed
- keep project state alive across sessions

This is an **execution discipline-as-a-service** layer.
The user should feel control, not see the framework.

---

## 2. Core User Problem

### Target user
A beginner or semi-technical “vibe coder” who wants to build with AI but struggles with:
- context loss
- scope drift
- unclear progress
- accidental breakage
- inability to transfer project knowledge
- illusion of progress

### Problem statement
Current AI coding assistants are powerful but session-fragile.  
They can generate code, but they do not reliably maintain:
- bounded scope
- durable project state
- understandable progress
- safe incremental execution

As a result, users feel productive while losing control.

### Product promise
The product acts as a **project companion** that:
- turns an idea into a guided build path
- constrains each coding session
- tracks state across sessions
- translates agent activity into plain language
- prevents silent drift

---

## 3. Product Positioning

### Not this
- “AI project manager”
- “Task tracker for developers”
- “Prompt manager”
- “IDE replacement”

### This
- **AI coding companion**
- **execution guardrail for vibe coding**
- **middleware that keeps the project under control**
- **Duolingo-like guided build flow for AI development**

---

## 4. Strategic Product Decision

### MVP approach
Build as an **MCP-first product**.

### Why
MCP is the correct integration layer for assistants rather than building a custom environment from scratch.

### Implication
The first product is:
- an MCP server
- with state management
- with workflow enforcement
- with agent-facing tools
- optionally followed by a thin companion UI

### Non-goal for MVP
Do not build:
- a full IDE
- a custom code editor
- a new coding runtime
- a full repo management suite

---

## 5. ICP

### Primary ICP
**Advanced beginner / semi-technical builder**
- uses Cursor / Claude Code / Codex
- can edit files and run projects
- does not think in software architecture
- often loses track of what is done and what should happen next

### Secondary ICP
**Indie hacker / solo founder**
- understands product logic
- wants more deterministic AI-assisted execution
- needs resumability and safer delegation

### Anti-ICP for MVP
- senior engineers who already have strong discipline and internal tooling
- enterprise teams needing compliance, audit, and SSO first
- users looking for a full PM platform

---

## 6. Product Principles

1. **The framework is invisible**
   - user should not have to understand Phase / Block / Task / Session

2. **One next step**
   - the primary user experience is “what do I do now?”

3. **Agent actions must be bounded**
   - every session must have explicit scope

4. **Project state must survive sessions**
   - continuity is core value

5. **Changes must be translated**
   - user should understand what happened without reading full diffs

6. **Safety over speed**
   - avoid silent large changes

7. **Progress must feel real**
   - only validated work counts as progress

---

## 7. Deterministic Rule Layer (Internal)

The enforcement engine uses a 4-level model:

- **Phase** → large milestone
- **Block** → logical chunk inside a phase
- **Task** → bounded implementable unit
- **Session** → one interaction loop with an assistant

This model is primarily internal. Users see only “next step,” “run,” and “done.”

### Canonical state (file-first)

MVP persists source-of-truth state in the repo under `.assistant/`:

```
.assistant/
  PHASES.md
  blocks/<ID>.md
  protocols/*
  commands/*
  SNAPSHOT.md
```

This makes progress deterministic and reviewable even without the server.

---

## 8. User Experience Model

### Main experience loop
1. User connects project
2. Product understands project and build intent
3. Product shows one recommended next step
4. Agent receives structured context
5. Agent performs bounded work
6. Product interprets result
7. Product updates project state
8. Product recommends next step

### Primary user-facing surfaces for MVP
#### A. Project home
- current goal
- current step
- progress summary
- blockers if any
- button: “Run next step”

#### B. Step preview
- what the agent is about to do
- what files may change
- expected outcome
- approval action

#### C. Result summary
- what changed
- why it changed
- whether the step is done
- what comes next

---

## 9. Core Jobs To Be Done

### Functional jobs
- turn a vague idea into a structured build plan
- keep project execution coherent across sessions
- reduce unwanted agent behavior
- make progress legible
- make handoff possible

### Emotional jobs
- reduce anxiety
- reduce confusion
- reduce fear of breakage
- replace “chaotic coding” with “guided progress”

---

## 10. MVP Scope

### In scope
- MCP server
- workflow state model
- idea → structure generation
- next-step recommendation
- agent prompt generation
- result parsing
- progress state updates
- scope validation
- plain-language explanation of changes

### Out of scope
- autonomous multi-agent orchestration
- full repo diff analysis engine
- deployment pipelines
- team collaboration
- billing by seat
- deep IDE plugin ecosystem
- code execution sandbox owned by the product

---

## 11. System Architecture

```text
User
  ↕
AI Client (Codex / Claude Code / Cursor)
  ↕
MCP Server (our product)
  - project state
  - workflow engine
  - scope enforcement
  - explanation layer
  - prompt assembly
  ↕
Repo / .assistant state files
```

---

## 12. State Model (Server)

### Core entities

#### Project
```ts
type Project = {
  id: string
  name: string
  summary: string
  repo_url?: string
  stack?: string[]
  status: "active" | "paused" | "done"
  current_phase_id?: string
  current_block_id?: string
  current_task_id?: string
  created_at: string
  updated_at: string
}
```

#### Phase
```ts
type Phase = {
  id: string
  project_id: string
  title: string
  goal: string
  order: number
  status: "not_started" | "in_progress" | "done" | "blocked"
}
```

#### Block
```ts
type Block = {
  id: string
  phase_id: string
  title: string
  goal: string
  order: number
  status: "not_started" | "in_progress" | "done" | "blocked"
}
```

#### Task
```ts
type Task = {
  id: string
  block_id: string
  title: string
  user_value: string
  technical_goal: string
  definition_of_done: string[]
  constraints: string[]
  allowed_files?: string[]
  expected_outputs?: string[]
  status: "not_started" | "ready" | "in_progress" | "review" | "done" | "blocked"
}
```

#### Session
```ts
type Session = {
  id: string
  task_id: string
  assistant: "codex" | "claude_code" | "cursor" | "other"
  prompt_snapshot: string
  change_plan?: string
  result_summary?: string
  changed_files?: string[]
  status: "started" | "submitted" | "validated" | "rejected"
  created_at: string
}
```

---

## 13. Workflow Engine Rules

1. **One active task**
   - only one task can be active at a time

2. **No silent scope expansion**
   - changes outside allowed files trigger approval gate

3. **Progress requires validation**
   - tasks are done only when DoD is satisfied

4. **Every session must attach to a task**
   - no floating sessions

5. **Explanation is mandatory**
   - every submitted result must be translated into plain language

6. **Change Plan before code**
   - a task cannot start until a change plan is approved

7. **One task per session**
   - if a task is too large, split and re-approve

---

## 14. MCP Tool Surface

Required tools for MVP:
- `initialize_project`
- `get_project_state`
- `get_next_step`
- `generate_agent_prompt`
- `start_session`
- `submit_agent_result`
- `validate_scope`
- `explain_changes`
- `complete_task`

See `mcp-tools-spec.md` for exact contracts.

---

## 15. Prompt Protocol

### Prompt design principles
1. task-bounded
2. context-light but sufficient
3. explicit constraints
4. explicit completion criteria
5. no invitation to refactor unrelated areas
6. no verbose “thinking out loud” requirement
7. no unnecessary planning output before action

### Prompt template
```text
You are working on a bounded implementation task inside an existing software project.

Task Title:
{{task_title}}

User Value:
{{user_value}}

Technical Goal:
{{technical_goal}}

Definition of Done:
{{definition_of_done}}

Allowed Files:
{{allowed_files}}

Constraints:
{{constraints}}

Important Rules:
- Do not modify files outside the allowed scope unless explicitly required.
- Do not refactor unrelated code.
- Do not expand the feature beyond the task.
- Prefer minimal, working changes.
- If blocked, explain the blocker clearly instead of improvising a larger rewrite.

Expected Output:
- implement the requested task
- summarize what changed
- list changed files
- note any blockers or unresolved issues
```

---

## 16. Progress Logic

Progress increases only when:
- session is submitted
- scope is accepted
- DoD is met

Not when:
- code volume increases
- agent claims success
- files change without validation

---

## 17. MVP Success Criteria

The MVP is successful if users can:
1. start from an idea
2. get a clear next step
3. run an AI coding session with bounded scope
4. understand what changed
5. resume the project later without confusion

---

## 18. Immediate Next Specs

- `mcp-tools-spec.md`
- `workflow-engine-spec.md`
- `state-model-spec.md`
- `prompt-assembly-spec.md`
