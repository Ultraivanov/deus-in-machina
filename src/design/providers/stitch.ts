import type {
  DesignArtifact,
  DesignCapability,
  DesignProvider,
  DesignProviderHealth,
  DesignProviderResponse,
  DesignRequest
} from "../contracts.js";

export class StitchProvider implements DesignProvider {
  readonly id = "stitch";

  capabilities(): DesignCapability[] {
    return [
      { task_type: "screen", supports_refinement: true, max_variants: 4 },
      { task_type: "component", supports_refinement: true, max_variants: 6 },
      { task_type: "tokens", supports_refinement: false, max_variants: 1 }
    ];
  }

  async health(): Promise<DesignProviderHealth> {
    return {
      ok: true,
      provider_id: this.id,
      message: "Stub provider is available.",
      checked_at: new Date().toISOString()
    };
  }

  async generate(request: DesignRequest): Promise<DesignProviderResponse> {
    const artifact: DesignArtifact = {
      id: `artifact_${Date.now()}`,
      type: "design_md_patch",
      format: "markdown",
      title: "Stitch draft proposal (stub)",
      content: [
        `# Proposal for ${request.task_type}`,
        "",
        `Intent: ${request.intent}`,
        "",
        "This is a provider stub output. Replace with real API integration."
      ].join("\n"),
      provider_id: this.id,
      confidence: 0.5
    };

    return {
      provider_id: this.id,
      model: "stub",
      artifacts: [artifact],
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        estimated_cost_usd: 0,
        latency_ms: 0
      }
    };
  }

  async refine(
    request: DesignRequest,
    previous_artifact: DesignArtifact
  ): Promise<DesignProviderResponse> {
    return this.generate({
      ...request,
      metadata: {
        ...(request.metadata ?? {}),
        refined_from_artifact_id: previous_artifact.id
      }
    });
  }
}
