export type FeatureFlags = {
  drift_guard: boolean;
  session_history: boolean;
  smart_resume: boolean;
  smart_next_step: boolean;
  workflow_graph: boolean;
  advanced_explanations: boolean;
  scope_preview: boolean;
};

export type PlanName = "free" | "pro";

export type Plan = {
  name: PlanName;
  price_usd_monthly: number;
  limits: {
    max_projects: number;
    max_sessions_per_month: number;
  };
  features: FeatureFlags;
};

export type SubscriptionSnapshot = {
  user_id: string;
  plan: PlanName;
  status: "active" | "past_due" | "canceled" | "paused";
  sessions_used: number;
  project_count: number;
};

export const FREE_PLAN: Plan = {
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
};

export const PRO_PLAN: Plan = {
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
};

export const getPlan = (name?: string): Plan => {
  if (name === "pro") return PRO_PLAN;
  return FREE_PLAN;
};
