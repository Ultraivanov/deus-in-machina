export type DesignProviderId = "stitch" | "figma" | "custom" | string;

export type DesignTaskType = "screen" | "component" | "tokens" | "design_system_update";

export type DesignArtifactType =
  | "design_md_patch"
  | "tokens_patch"
  | "code_patch"
  | "markup_snippet"
  | "style_snippet"
  | "asset_ref";

export type DesignOutputFormat = "markdown" | "json" | "patch" | "code";

export type DesignSeverity = "info" | "warning" | "error";

export type DesignValidationStatus = "passed" | "needs_review" | "failed";

export type DesignCapability = {
  task_type: DesignTaskType;
  supports_refinement: boolean;
  supports_streaming?: boolean;
  max_variants?: number;
};

export type DesignReference = {
  kind: "url" | "image" | "file" | "figma_node" | "html_fragment";
  value: string;
  label?: string;
};

export type DesignRequest = {
  project_id: string;
  task_id: string;
  task_type: DesignTaskType;
  intent: string;
  repo_root?: string;
  target_paths?: string[];
  constraints?: string[];
  references?: DesignReference[];
  design_contract: {
    path: string;
    content?: string;
    version?: string;
    hash?: string;
  };
  generation: {
    variants?: number;
    output_formats?: DesignOutputFormat[];
    prefer_provider?: DesignProviderId;
    mode?: "draft" | "handoff";
  };
  metadata?: Record<string, unknown>;
};

export type DesignArtifact = {
  id: string;
  type: DesignArtifactType;
  format: DesignOutputFormat;
  title: string;
  path?: string;
  content: string;
  provider_id: DesignProviderId;
  source_ref?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
};

export type ValidationIssue = {
  code: string;
  message: string;
  severity: DesignSeverity;
  field?: string;
  expected?: string;
  actual?: string;
};

export type ValidationResult = {
  status: DesignValidationStatus;
  compliant: boolean;
  score?: number;
  issues: ValidationIssue[];
  touched_tokens?: string[];
  touched_components?: string[];
  suggested_actions?: string[];
};

export type DesignProviderResponse = {
  provider_id: DesignProviderId;
  model?: string;
  request_id?: string;
  artifacts: DesignArtifact[];
  validation?: ValidationResult;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    estimated_cost_usd?: number;
    latency_ms?: number;
  };
  raw?: Record<string, unknown>;
};

export type DesignProviderHealth = {
  ok: boolean;
  provider_id: DesignProviderId;
  message?: string;
  checked_at: string;
};

export interface DesignProvider {
  readonly id: DesignProviderId;

  capabilities(): DesignCapability[];

  health(): Promise<DesignProviderHealth>;

  generate(request: DesignRequest): Promise<DesignProviderResponse>;

  refine(
    request: DesignRequest,
    previous_artifact: DesignArtifact
  ): Promise<DesignProviderResponse>;
}
