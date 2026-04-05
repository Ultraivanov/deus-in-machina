import type { Project, Task } from "../state.js";
import type { Plan, SubscriptionSnapshot } from "./policy.js";

export type RiskLevel = "low" | "medium" | "high";

export type RiskDecision = {
  risk_level: RiskLevel;
  monetization_trigger: boolean;
  intervention: "none" | "warning" | "upgrade_prompt" | "approval_gate";
  message?: string;
  signals?: string[];
  preview?: {
    expected_files: string[];
    risk_files: string[];
    notes: string[];
  };
};

export type RiskContext = {
  task: Task;
  project: Project;
  plan: Plan;
  subscription: SubscriptionSnapshot;
};

const CORE_FILE_MATCHERS = [
  /\/engine\./i,
  /\/storage\//i,
  /\/state\./i,
  /\/monetization\//i,
  /\/billing\//i,
  /\/payments?\//i,
  /\/auth\//i,
  /\/security\//i,
  /\/config/i,
  /config\.(json|js|ts|yaml|yml)$/i,
  /package\.json$/i,
  /tsconfig\.json$/i,
  /vite\.config\./i,
  /next\.config\./i,
  /prisma\//i,
  /\/db\//i,
  /migration/i,
  /schema/i,
  /docker/i,
  /k8s/i,
  /terraform/i
];

const normalizeText = (value: string) => value.toLowerCase();

const containsAny = (text: string, needles: string[]) =>
  needles.some((needle) => text.includes(needle));

const detectRiskFiles = (allowedFiles: string[]) =>
  allowedFiles.filter((file) => CORE_FILE_MATCHERS.some((matcher) => matcher.test(file)));

const extractSignals = (task: Task, project: Project) => {
  const signals: string[] = [];
  const allowed = task.allowed_files ?? [];
  const dod = task.definition_of_done ?? [];
  const constraints = task.constraints ?? [];

  if (allowed.length === 0) signals.push("missing_allowlist");
  if (allowed.length > 10) signals.push("wide_scope");
  else if (allowed.length > 5) signals.push("medium_scope");

  const riskFiles = detectRiskFiles(allowed);
  if (riskFiles.length > 0) signals.push("core_files");

  if (dod.length === 0) signals.push("missing_dod");
  if (constraints.length === 0) signals.push("missing_constraints");

  const text = normalizeText(
    `${task.title} ${task.technical_goal ?? ""} ${task.user_value ?? ""}`
  );
  if (
    containsAny(text, [
      "refactor",
      "rewrite",
      "migration",
      "architecture",
      "schema",
      "database",
      "infra",
      "auth",
      "billing",
      "payment",
      "security"
    ])
  ) {
    signals.push("risky_intent");
  }

  if ((project.summary ?? "").length > 160) signals.push("large_project_summary");

  return { signals, riskFiles };
};

export const computeRiskScore = (task: Task, project: Project) => {
  const { signals } = extractSignals(task, project);
  let score = 0;
  if (signals.includes("missing_allowlist")) score += 3;
  if (signals.includes("wide_scope")) score += 2;
  if (signals.includes("medium_scope")) score += 1;
  if (signals.includes("core_files")) score += 2;
  if (signals.includes("missing_dod")) score += 1;
  if (signals.includes("missing_constraints")) score += 1;
  if (signals.includes("risky_intent")) score += 2;
  if (signals.includes("large_project_summary")) score += 1;
  return score;
};

export const mapRiskLevel = (score: number): RiskLevel => {
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
};

export const evaluateRiskMonetization = (context: RiskContext): RiskDecision => {
  const { signals, riskFiles } = extractSignals(context.task, context.project);
  const score = computeRiskScore(context.task, context.project);
  const risk_level = mapRiskLevel(score);

  if (risk_level === "low") {
    return { risk_level, monetization_trigger: false, intervention: "none", signals };
  }

  if (!context.plan.features.drift_guard) {
    if (risk_level === "high") {
      return {
        risk_level,
        monetization_trigger: true,
        intervention: "upgrade_prompt",
        message: "This step may affect multiple parts of your project. Upgrade for stronger execution control.",
        signals
      };
    }
    return {
      risk_level,
      monetization_trigger: false,
      intervention: "warning",
      message: "This step may affect more than the current task scope.",
      signals
    };
  }

  const preview =
    context.plan.features.scope_preview
      ? {
          expected_files: context.task.allowed_files ?? [],
          risk_files: riskFiles,
          notes: ["Drift guard is active for this step."]
        }
      : undefined;

  return {
    risk_level,
    monetization_trigger: false,
    intervention: "approval_gate",
    message: "Review the change scope before execution.",
    signals,
    ...(preview ? { preview } : {})
  };
};
