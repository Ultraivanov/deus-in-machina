import type {
  DesignArtifact,
  DesignCapability,
  DesignProvider,
  DesignProviderHealth,
  DesignProviderResponse,
  DesignRequest
} from "../contracts.js";

export class FigmaProvider implements DesignProvider {
  readonly id = "figma";

  capabilities(): DesignCapability[] {
    return [
      { task_type: "screen", supports_refinement: true, max_variants: 3 },
      { task_type: "component", supports_refinement: true, max_variants: 5 },
      { task_type: "design_system_update", supports_refinement: true, max_variants: 2 }
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
      type: "tokens_patch",
      format: "json",
      title: "Figma tokens proposal (stub)",
      content: JSON.stringify(
        {
          task_type: request.task_type,
          intent: request.intent,
          note: "Stub provider output. Replace with real Figma API integration."
        },
        null,
        2
      ),
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
