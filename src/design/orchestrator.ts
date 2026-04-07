import type {
  DesignProvider,
  DesignProviderId,
  DesignProviderResponse,
  DesignRequest
} from "./contracts.js";

export type ProviderRoutingPolicy = {
  primary_by_task_type: Partial<Record<DesignRequest["task_type"], DesignProviderId>>;
  fallback_order: DesignProviderId[];
};

export class DesignOrchestrator {
  private providers = new Map<DesignProviderId, DesignProvider>();

  constructor(private policy: ProviderRoutingPolicy) {}

  registerProvider(provider: DesignProvider): void {
    this.providers.set(provider.id, provider);
  }

  async run(request: DesignRequest): Promise<DesignProviderResponse> {
    const orderedProviderIds = this.resolveProviderOrder(request);
    let lastError: Error | null = null;

    for (const providerId of orderedProviderIds) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const health = await provider.health();
        if (!health.ok) continue;
        return await provider.generate(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown provider error");
      }
    }

    throw lastError ?? new Error("No available design provider for request.");
  }

  private resolveProviderOrder(request: DesignRequest): DesignProviderId[] {
    const preferred = request.generation.prefer_provider;
    if (preferred) {
      return [preferred, ...this.policy.fallback_order.filter((id) => id !== preferred)];
    }

    const primary = this.policy.primary_by_task_type[request.task_type];
    if (primary) {
      return [primary, ...this.policy.fallback_order.filter((id) => id !== primary)];
    }

    return this.policy.fallback_order;
  }
}
