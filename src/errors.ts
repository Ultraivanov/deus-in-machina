export type ErrorPayload = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    upgrade_required?: boolean;
  };
};

export const makeError = (
  code: string,
  message: string,
  retryable = false,
  upgradeRequired?: boolean
): ErrorPayload => ({
  error: {
    code,
    message,
    retryable,
    upgrade_required: upgradeRequired
  }
});

export const ensureErrorShape = (value: unknown): ErrorPayload => {
  if (value && typeof value === "object" && "error" in (value as Record<string, unknown>)) {
    const error = (value as Record<string, unknown>).error as Record<string, unknown>;
    if (error && typeof error.code === "string") {
      return value as ErrorPayload;
    }
  }
  return makeError("INTERNAL_ERROR", "Unexpected error shape.", true);
};

const shouldSample = (rate: number) => {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() <= rate;
};

export const logError = (
  err: unknown,
  context: Record<string, unknown>,
  options?: { sampleRate?: number; sink?: (payload: Record<string, unknown>) => void }
) => {
  const rate = options?.sampleRate ?? 1;
  if (!shouldSample(rate)) return;
  const sink =
    options?.sink ??
    ((payload: Record<string, unknown>) => {
      console.error(JSON.stringify(payload));
    });

  const errorPayload = err instanceof Error
    ? { name: err.name, message: err.message, stack: err.stack }
    : { message: String(err) };

  sink({
    type: "error",
    timestamp: new Date().toISOString(),
    error: errorPayload,
    context
  });
};
