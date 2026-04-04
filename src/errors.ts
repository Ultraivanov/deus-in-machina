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
