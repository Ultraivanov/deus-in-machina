import Stripe from "stripe";
import type { SqliteStore } from "../storage/sqlite.js";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
};

export const createCheckoutSession = async (input: {
  user_id: string;
  price_id: string;
  success_url: string;
  cancel_url: string;
  email?: string;
  store?: SqliteStore;
}) => {
  const stripe = getStripe();
  if (!stripe) return null;

  const existing = input.store?.getStripeMetadata(input.user_id);
  const customer = existing?.stripe_customer_id
    ? existing.stripe_customer_id
    : (
        await stripe.customers.create({
          email: input.email,
          metadata: { user_id: input.user_id }
        })
      ).id;

  if (!existing?.stripe_customer_id && input.store) {
    input.store.updateStripeMetadata(input.user_id, {
      stripe_customer_id: customer
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: input.price_id, quantity: 1 }],
    success_url: input.success_url,
    cancel_url: input.cancel_url,
    client_reference_id: input.user_id,
    metadata: { user_id: input.user_id }
  });

  return session;
};

export const createPortalSession = async (input: {
  customer_id: string;
  return_url: string;
}) => {
  const stripe = getStripe();
  if (!stripe) return null;
  const portal = await stripe.billingPortal.sessions.create({
    customer: input.customer_id,
    return_url: input.return_url
  });
  return portal;
};

export const verifyWebhookEvent = (payload: Buffer, signature: string | undefined) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret || !signature) return null;
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

export const handleStripeEvent = async (
  event: Stripe.Event,
  store?: SqliteStore
) => {
  if (!store) return;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId =
      session.client_reference_id ?? session.metadata?.user_id ?? "anon";
    store.updateStripeMetadata(userId, {
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string
    });
    store.updateSubscriptionFromStripe(userId, {
      plan: "pro",
      status: "active"
    });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    if (!userId) return;
    store.updateStripeMetadata(userId, {
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id
    });
    store.updateSubscriptionFromStripe(userId, {
      plan: subscription.items.data[0]?.price?.recurring ? "pro" : "free",
      status: subscription.status === "active" ? "active" : "past_due"
    });
  }
};
