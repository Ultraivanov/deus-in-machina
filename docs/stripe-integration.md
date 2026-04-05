# Stripe Integration

## Environment Variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `BUILDRAIL_STRIPE_PORT` (default: 8787)
- `BUILDRAIL_UPGRADE_URL` (optional direct checkout link surfaced in errors)

## Endpoints (local)

### Create Checkout Session
`POST /stripe/checkout`
```json
{
  "user_id": "user_demo",
  "price_id": "price_123",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel",
  "email": "user@example.com"
}
```

### Create Billing Portal Session
`POST /stripe/portal`
```json
{
  "customer_id": "cus_123",
  "return_url": "https://example.com/account"
}
```

### Webhook
`POST /stripe/webhook`
- Use Stripe CLI to forward events.
- Webhook updates subscription state in SQLite.

## Notes
- Stripe is optional. If `STRIPE_SECRET_KEY` is missing, the server skips Stripe startup.
- Subscription records are updated via webhook events.

## Example upgrade error payload
```json
{
  "error": {
    "code": "SERVER_TOKENS_REQUIRE_PRO",
    "message": "Server tokens are only available on paid plans. Upgrade or switch to client_keys.",
    "retryable": false,
    "upgrade_required": true,
    "upgrade_hint": "Upgrade to Pro to enable server tokens.",
    "upgrade_url": "https://your.app/upgrade"
  }
}
```

## Example risk payloads
### generate_agent_prompt (with risk)
```json
{
  "task_id": "task_123",
  "prompt": "...",
  "risk": {
    "risk_level": "medium",
    "monetization_trigger": false,
    "intervention": "warning",
    "message": "This step may affect more than the current task scope.",
    "signals": ["medium_scope", "missing_constraints"]
  },
  "risk_reasoning": {
    "score": "medium",
    "signals": ["medium_scope", "missing_constraints"],
    "summary": "Medium risk step; watch scope and constraints."
  }
}
```

### get_risk_profile (standalone)
```json
{
  "project_id": "proj_123",
  "task_id": "task_456",
  "risk": {
    "risk_level": "medium",
    "monetization_trigger": false,
    "intervention": "warning",
    "message": "This step may affect more than the current task scope.",
    "signals": ["medium_scope", "missing_constraints"]
  },
  "risk_reasoning": {
    "score": "medium",
    "signals": ["medium_scope", "missing_constraints"],
    "summary": "Medium risk step; watch scope and constraints."
  }
}
```

### validate_scope (with risk)
```json
{
  "session_id": "sess_123",
  "scope_ok": false,
  "validation_status": "needs_approval",
  "unexpected_files": ["src/core/engine.ts"],
  "message": "The agent touched files outside the approved task scope.",
  "risk": {
    "risk_level": "high",
    "risk_signals": ["core_files", "risky_intent"],
    "risk_message": "This step may affect multiple parts of your project. Upgrade for stronger execution control."
  }
}
```

### explain_changes (with risk signals)
```json
{
  "plain_language_summary": [
    "Updated core execution logic.",
    "Risk: high. This step may affect multiple parts of your project. Upgrade for stronger execution control."
  ],
  "why_it_matters": "This advances the project by one validated step.",
  "user_safe_to_continue": true,
  "risk_signals": ["core_files", "risky_intent"]
}
```
