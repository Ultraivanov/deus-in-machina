import { FREE_PLAN, getPlan, type Plan, type PlanName, type SubscriptionSnapshot } from "./policy.js";

export type MonetizationError = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    upgrade_required?: boolean;
    upgrade_hint?: string;
    upgrade_url?: string;
  };
};

export type MonetizationContext = {
  subscription: SubscriptionSnapshot;
  plan: Plan;
};

export type MonetizationDecision =
  | { ok: true; context: MonetizationContext; upgrade_hint?: string }
  | { ok: false; error: MonetizationError; context: MonetizationContext };

export type SubscriptionLoader = (args: Record<string, unknown>) => SubscriptionSnapshot | null;

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

export const enforceMonetization = (
  toolName: string,
  args: Record<string, unknown>,
  options?: { loadSubscription?: SubscriptionLoader }
): MonetizationDecision => {
  const loaded = options?.loadSubscription?.(args);
  const subscription = loaded ?? buildSubscription(args);
  const plan = getPlan(subscription.plan);
  const context = { subscription, plan };
  const llmMode = process.env.BUILDRAIL_LLM_MODE ?? "client_keys";

  if (llmMode === "server_proxy") {
    if (subscription.status === "past_due") {
      return {
        ok: false,
        context,
        error: {
          error: {
            code: "SUBSCRIPTION_PAST_DUE",
            message: "Subscription is past due. Update billing to continue using server tokens.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
    if (subscription.status === "canceled") {
      return {
        ok: false,
        context,
        error: {
          error: {
            code: "SUBSCRIPTION_CANCELED",
            message: "Subscription is canceled. Reactivate to continue using server tokens.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
    if (subscription.status === "paused") {
      return {
        ok: false,
        context,
        error: {
          error: {
            code: "SUBSCRIPTION_PAUSED",
            message: "Subscription is paused. Resume to continue using server tokens.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
    if (plan.name === "free") {
      return {
        ok: false,
        context,
        error: {
          error: {
            code: "SERVER_TOKENS_REQUIRE_PRO",
            message: "Server tokens are only available on paid plans. Upgrade or switch to client_keys.",
            retryable: false,
            upgrade_required: true
          }
        }
      };
    }
  }

  if (toolName === "initialize_project") {
    if (subscription.project_count >= plan.limits.max_projects) {
      return {
        ok: false,
        context,
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
        context,
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
    context,
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

const getUpgradeUrl = (args: Record<string, unknown>) => {
  if (typeof (args as Record<string, unknown>).upgrade_url === "string") {
    return (args as Record<string, unknown>).upgrade_url as string;
  }
  if (process.env.BUILDRAIL_UPGRADE_URL) return process.env.BUILDRAIL_UPGRADE_URL;
  return undefined;
};

const getErrorUpgradeHint = (
  toolName: string,
  plan: Plan,
  errorCode?: string
): string | undefined => {
  switch (errorCode) {
    case "SERVER_TOKENS_REQUIRE_PRO":
      return "Upgrade to Pro to enable server tokens.";
    case "SUBSCRIPTION_PAST_DUE":
      return "Update billing to restore server tokens.";
    case "SUBSCRIPTION_CANCELED":
      return "Reactivate your subscription to restore server tokens.";
    case "SUBSCRIPTION_PAUSED":
      return "Resume your subscription to restore server tokens.";
    case "PROJECT_LIMIT_REACHED":
      return "Upgrade to create more projects.";
    case "SESSION_LIMIT_REACHED":
      return "Upgrade to increase your monthly session limit.";
    default:
      return getUpgradeHint(toolName, plan) ?? "Upgrade to continue.";
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
  handler: (context: MonetizationContext) => T,
  options?: { loadSubscription?: SubscriptionLoader }
): T | MonetizationError => {
  const decision = enforceMonetization(toolName, args, options);
  if (!decision.ok) {
    if (decision.error.error.upgrade_required) {
      const upgrade_url = getUpgradeUrl(args);
      const upgrade_hint = getErrorUpgradeHint(
        toolName,
        decision.context.plan,
        decision.error.error.code
      );
      return {
        error: {
          ...decision.error.error,
          upgrade_hint,
          ...(upgrade_url ? { upgrade_url } : {})
        }
      };
    }
    return decision.error;
  }

  const result = handler(decision.context);
  return attachMonetizationMeta(result, decision.context, decision.upgrade_hint);
};
