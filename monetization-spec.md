# Monetization Spec
## Project: Buildrail
### File: `monetization-spec.md`
### Version: MVP v0.1

---

## 1. Purpose

This document defines the MVP monetization model for the MCP-based product.

The goal is to monetize without breaking the core build loop.

The pricing model must:
- preserve adoption
- keep the product useful on the free tier
- monetize control and acceleration rather than basic access
- fit MCP-based tool execution and session-based usage

---

## 2. Product Principle

The product should not charge for the existence of the workflow.

It should charge for:
- more control
- more safety
- better continuity
- better optimization

Core principle:

> Free should work.
> Pro should feel safer, smoother, and faster.

---

## 3. Pricing Model

### Free
A usable but constrained plan for first-time builders.

### Pro - $20/month
A paid plan for users who want stronger control, less drift, better recovery, and better guided execution.

---

## 4. Why This Model

This product sits between:
- the user
- the coding assistant
- the codebase

That means monetization must not block the main loop too early.

The correct model is:

- Free - core execution remains available
- Pro - removes friction and improves control

This aligns with the actual value of the product:
- fewer accidental changes
- better task continuity
- better next-step guidance
- safer AI-assisted execution

---

## 5. Plans

### 5.1 Free Plan

#### Limits
- `max_projects = 1`
- `max_sessions_per_month = 40`

#### Included features
- initialize project
- get basic next step
- generate bounded prompt
- submit agent result
- basic explanation
- basic scope validation after execution

#### Restrictions
- no advanced drift guard before execution
- no session history view
- no smart resume
- no smart next-step optimization
- no workflow graph optimization
- no advanced explanations

#### UX intent
The free plan must still allow a user to complete a real project loop.

It should not feel fake or crippled.
It should feel useful, but visibly less safe and less optimized.

---

### 5.2 Pro Plan - $20/month

#### Limits
- `max_projects = unlimited`
- `max_sessions_per_month = 400`

#### Included features
Everything in Free, plus:
- drift guard before execution
- session history
- smart resume
- smart next-step optimization
- workflow graph optimization
- advanced explanations
- scope preview before execution

#### UX intent
The Pro plan should reduce:
- uncertainty
- recovery cost
- fear of breakage
- wasted steps

It should feel like:
- stronger control
- less babysitting
- faster progress

---

## 6. Monetization Unit

### Primary usage unit
A session

### Definition
A session is one bounded agent execution cycle tied to one task.

Example:
- generate task prompt
- run agent
- submit result
- validate scope
- complete or return to review

### Why sessions
Sessions are the most natural billing-aware unit because they reflect:
- product usage
- cost exposure
- user-perceived progress

---

## 7. Plan Types

```ts
type FeatureFlags = {
  drift_guard: boolean
  session_history: boolean
  smart_resume: boolean
  smart_next_step: boolean
  workflow_graph: boolean
  advanced_explanations: boolean
  scope_preview: boolean
}

type PlanName = "free" | "pro"

type Plan = {
  name: PlanName
  price_usd_monthly: number
  limits: {
    max_projects: number
    max_sessions_per_month: number
  }
  features: FeatureFlags
}
```

---

## 8. Plan Definitions

```ts
const FREE_PLAN: Plan = {
  name: "free",
  price_usd_monthly: 0,
  limits: {
    max_projects: 1,
    max_sessions_per_month: 40
  },
  features: {
    drift_guard: false,
    session_history: false,
    smart_resume: false,
    smart_next_step: false,
    workflow_graph: false,
    advanced_explanations: false,
    scope_preview: false
  }
}

const PRO_PLAN: Plan = {
  name: "pro",
  price_usd_monthly: 20,
  limits: {
    max_projects: Number.MAX_SAFE_INTEGER,
    max_sessions_per_month: 400
  },
  features: {
    drift_guard: true,
    session_history: true,
    smart_resume: true,
    smart_next_step: true,
    workflow_graph: true,
    advanced_explanations: true,
    scope_preview: true
  }
}
```

---

## 9. Subscription Model

```ts
type Subscription = {
  user_id: string
  plan: "free" | "pro"
  current_period_start: string
  current_period_end: string
  sessions_used: number
  project_count: number
  status: "active" | "past_due" | "canceled"
}
```

---

## 10. Enforcement Rules

### 10.1 Project limit

Rule:
A free user may only have 1 project.

Behavior:
- allow first project creation
- block additional project creation
- show clear upgrade message

Example:
```ts
function enforceProjectLimit(subscription: Subscription, plan: Plan) {
  if (subscription.project_count >= plan.limits.max_projects) {
    throw new Error("PROJECT_LIMIT_REACHED")
  }
}
```

### 10.2 Session quota

Rule:
A user may not start a new session if they exceeded the monthly session limit.

Behavior:
- check before `start_session`
- block new sessions when quota is exceeded
- keep project readable
- allow upgrade path

Example:
```ts
function enforceSessionLimit(subscription: Subscription, plan: Plan) {
  if (subscription.sessions_used >= plan.limits.max_sessions_per_month) {
    throw new Error("SESSION_LIMIT_REACHED")
  }
}
```

### 10.3 Feature gating

Rule:
Feature availability depends on plan feature flags.

Example:
```ts
function hasFeature(plan: Plan, feature: keyof FeatureFlags): boolean {
  return plan.features[feature]
}
```

---

## 11. MCP Integration Strategy

Monetization must be enforced at the server layer, not only in UI.

This matters because the MCP server is the real execution boundary.

### Monetization-aware tools
The following tools must read subscription state:

- `initialize_project`
- `get_next_step`
- `generate_agent_prompt`
- `start_session`
- `validate_scope`
- `explain_changes`

---

## 12. Tool-by-Tool Monetization Rules

### 12.1 `initialize_project`

Free behavior:
- allow creation if under project limit

Pro behavior:
- same, but unlimited projects

Gate:
- block only when free user exceeds project limit

### 12.2 `get_next_step`

Free behavior:
- return basic next step
- no workflow graph optimization
- no advanced confidence-based routing

Pro behavior:
- return optimized next step
- use workflow graph and smart progression

### 12.3 `generate_agent_prompt`

Free behavior:
- return bounded prompt
- no advanced scope preview

Pro behavior:
- return bounded prompt
- include richer preview and execution expectations where supported

### 12.4 `start_session`

Free behavior:
- allowed until monthly session limit is reached

Pro behavior:
- same pattern with higher quota

Gate:
- session count is enforced here

### 12.5 `validate_scope`

Free behavior:
- validate after execution
- show warnings on drift
- do not provide advanced pre-execution guardrail

Pro behavior:
- validate with stronger guardrail behavior
- support pre-execution drift guard logic when available
- produce stronger warning or approval flow

### 12.6 `explain_changes`

Free behavior:
- basic explanation
- limited context restoration
- simpler summary style

Pro behavior:
- advanced explanation
- stronger "what changed / why / what next" framing
- better continuity support

---

## 13. Non-Blocking Monetization Principle

The product must not fully break the main user loop on free.

Never hard-block on free:
- `get_next_step`
- `generate_agent_prompt`
- basic `explain_changes`

Allowed hard blocks:
- additional project creation beyond the free limit
- new sessions beyond the monthly quota

This protects adoption while still preserving a meaningful paid plan.

---

## 14. Soft Paywall Triggers

Soft paywalls should appear at moments of real pain.

Do not interrupt randomly.
Do not show generic upgrade banners detached from user context.

### Trigger 1 - Drift risk
Condition:
- user is on free
- scope drift or drift risk appears

Message:
> Agent may change files outside this step.
> Upgrade to add stronger control and reduce unintended changes.

### Trigger 2 - Resume after inactivity
Condition:
- user returns after inactivity
- user is on free

Message:
> Restore stronger project continuity with Smart Resume.

### Trigger 3 - Next-step uncertainty
Condition:
- low confidence next-step recommendation
- free plan

Message:
> Upgrade for smarter next-step guidance based on workflow patterns.

### Trigger 4 - Repeated confusion
Condition:
- multiple review loops
- repeated task failures
- free plan

Message:
> Upgrade for better explanations and a smoother path forward.

---

## 15. Upgrade Copy

### Drift guard
Control AI changes before they spread.

### Smart resume
Pick up the project without rebuilding context from scratch.

### Smart next step
Get better guidance on what to build next.

### Advanced explanations
Understand what changed and why it matters.

---

## 16. Internal Error Codes

The monetization layer should support structured errors.

Suggested codes:
- `PROJECT_LIMIT_REACHED`
- `SESSION_LIMIT_REACHED`
- `FEATURE_NOT_AVAILABLE`
- `SUBSCRIPTION_NOT_FOUND`
- `INVALID_PLAN_STATE`

Error shape:
```json
{
  "error": {
    "code": "SESSION_LIMIT_REACHED",
    "message": "You have reached your monthly session limit. Upgrade to continue.",
    "retryable": false,
    "upgrade_required": true
  }
}
```

---

## 17. Server-Side Middleware Pattern

A monetization middleware should wrap MCP tools.

Example:
```ts
type ToolHandler<Input, Output> = (ctx: ToolContext, input: Input) => Promise<Output>

function withMonetization<Input, Output>(
  handler: ToolHandler<Input, Output>
): ToolHandler<Input, Output> {
  return async (ctx, input) => {
    const subscription = await getSubscription(ctx.user.id)
    const plan = getPlan(subscription.plan)

    return handler(
      {
        ...ctx,
        subscription,
        plan
      },
      input
    )
  }
}
```

---

## 18. Tool Enforcement Examples

### 18.1 `start_session`

```ts
export const start_session = withMonetization(async (ctx, input) => {
  const { subscription, plan } = ctx

  enforceSessionLimit(subscription, plan)

  const session = await createSession(input)

  await incrementSessionUsage(subscription.user_id)

  return session
})
```

### 18.2 `initialize_project`

```ts
export const initialize_project = withMonetization(async (ctx, input) => {
  const { subscription, plan } = ctx

  enforceProjectLimit(subscription, plan)

  const project = await createProjectFromIdea(input)

  await incrementProjectCount(subscription.user_id)

  return project
})
```

### 18.3 `get_next_step`

```ts
export const get_next_step = withMonetization(async (ctx, input) => {
  const { plan } = ctx

  if (!hasFeature(plan, "smart_next_step")) {
    return getBasicNextStep(input.project_id)
  }

  return getOptimizedNextStep(input.project_id)
})
```

### 18.4 `validate_scope`

```ts
export const validate_scope = withMonetization(async (ctx, input) => {
  const { plan } = ctx
  const result = await detectScope(input)

  if (!result.scope_ok && !hasFeature(plan, "drift_guard")) {
    return {
      ...result,
      upgrade_hint: "Upgrade to enable stronger drift control."
    }
  }

  return result
})
```

### 18.5 `explain_changes`

```ts
export const explain_changes = withMonetization(async (ctx, input) => {
  const { plan } = ctx

  if (!hasFeature(plan, "advanced_explanations")) {
    return basicExplanation(input)
  }

  return advancedExplanation(input)
})
```

---

## 19. Data Model Additions

The state/storage layer should include billing-aware entities.

Suggested schema:
```ts
type User = {
  id: string
  email: string
  created_at: string
}

type Subscription = {
  user_id: string
  plan: "free" | "pro"
  status: "active" | "past_due" | "canceled"
  current_period_start: string
  current_period_end: string
  sessions_used: number
  project_count: number
  updated_at: string
}
```

---

## 20. Analytics Events

Track monetization-related events to learn where conversion actually happens.

Suggested events:
- `project_limit_hit`
- `session_limit_hit`
- `drift_upgrade_prompt_shown`
- `resume_upgrade_prompt_shown`
- `next_step_upgrade_prompt_shown`
- `upgrade_clicked`
- `upgrade_completed`
- `pro_feature_used`

---

## 21. MVP Simplifications

To keep the first version lean:
- no yearly billing
- no team billing
- no credits marketplace
- no pay-as-you-go
- no multiple paid tiers
- no usage-based overage billing

MVP monetization is intentionally simple:
- Free
- Pro $20/month

---

## 22. Future Extensions

Later expansion can include:
- team plan
- usage-based overflow billing
- project template marketplace
- vertical workflow packs
- B2B plan for teams

These are explicitly out of MVP scope.

---

## 23. Final Product Logic

The free tier proves usefulness.

The paid tier sells:
- control
- continuity
- optimization

That is the correct monetization shape for a middleware product that sits inside AI-assisted coding loops.

---

## 24. One-Line Summary

Monetization should gate risk reduction and execution quality, not the core feeling that the product actually works.
