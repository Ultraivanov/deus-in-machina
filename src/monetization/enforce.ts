import { FREE_PLAN, getPlan, type Plan, type PlanName, type SubscriptionSnapshot } from "./policy.js";

export type MonetizationError = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    upgrade_required?: boolean;
  };
};

export type MonetizationContext = {
  subscription: SubscriptionSnapshot;
  plan: Plan;
};

export type MonetizationDecision =
  | { ok: true; context: MonetizationContext; upgrade_hint?: string }
  | { ok: false; error: MonetizationError };

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
};

const toPlanName = (value: unknown): PlanName => {
  if (value === "pro") return "pro";
  return "free";
};

const toStatus = (value: unknown): SubscriptionSnapshot["status"] => {
  if (value === "past_due" || value === "canceled" || value === "paused") return value;
  return "active";
};

export const buildSubscription = (args: Record<string, unknown>): SubscriptionSnapshot => {
  const subscription = (args.subscription as Record<string, unknown>) ?? {};
  const userId =
    (typeof subscription.user_id === "string" && subscription.user_id) ||
    (typeof args.user_id === "string" && args.user_id) ||
    "anon";

  const planName =
    toPlanName(subscription.plan ?? args.plan ?? process.env.BUILDRAIL_PLAN ?? FREE_PLAN.name);

  return {
    user_id: userId,
    plan: planName,
    status: toStatus(subscription.status),
    sessions_used: toNumber(subscription.sessions_used, 0),
    project_count: toNumber(subscription.project_count, 0)
  };
};

export const enforceMonetization = (toolName: string, args: Record<string, unknown>): MonetizationDecision => {
  const subscription = buildSubscription(args);
  const plan = getPlan(subscription.plan);

  if (toolName === "initialize_project") {
    if (subscription.project_count >= plan.limits.max_projects) {
      return {
        ok: false,
        error: {
          error: {
            code: "PROJECT_LIMIT_REACHED",
            message: "Project limit reached. Upgrade to create more projects.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
  }

  if (toolName === "start_session") {
    if (subscription.sessions_used >= plan.limits.max_sessions_per_month) {
      return {
        ok: false,
        error: {
          error: {
            code: "SESSION_LIMIT_REACHED",
            message: "Monthly session limit reached. Upgrade to continue.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
  }

  return {
    ok: true,
    context: { subscription, plan },
    upgrade_hint: getUpgradeHint(toolName, plan)
  };
};

const getUpgradeHint = (toolName: string, plan: Plan): string | undefined => {
  if (plan.name !== "free") return undefined;

  switch (toolName) {
    case "validate_scope":
      return "Upgrade to enable stronger drift control before execution.";
    case "get_next_step":
      return "Upgrade for smarter next-step guidance based on workflow patterns.";
    case "explain_changes":
      return "Upgrade for advanced explanations and stronger continuity support.";
    case "generate_agent_prompt":
      return "Upgrade to preview and refine scope before execution.";
    default:
      return undefined;
  }
};

export const attachMonetizationMeta = <T>(
  result: T,
  context: MonetizationContext,
  upgradeHint?: string
): T => {
  if (!result || typeof result !== "object" || Array.isArray(result)) return result;
  if ("error" in (result as Record<string, unknown>)) return result;

  return {
    ...(result as Record<string, unknown>),
    _meta: {
      plan: context.plan.name,
      features: context.plan.features,
      subscription: context.subscription,
      upgrade_hint: upgradeHint
    }
  } as T;
};

export const applyMonetization = <T>(
  toolName: string,
  args: Record<string, unknown>,
  handler: () => T
): T | MonetizationError => {
  const decision = enforceMonetization(toolName, args);
  if (!decision.ok) return decision.error;

  const result = handler();
  return attachMonetizationMeta(result, decision.context, decision.upgrade_hint);
};
