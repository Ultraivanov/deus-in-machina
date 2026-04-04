# Stripe Integration

## Environment Variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `BUILDRAIL_STRIPE_PORT` (default: 8787)

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
