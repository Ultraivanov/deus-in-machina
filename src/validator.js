function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0 };
}

export function validateUI({ code = "", rules = {} } = {}) {
  const errors = [];
  const warnings = [];
  const infos = [];

  return {
    valid: true,
    summary: emptySummary(),
    errors,
    warnings,
    infos,
    meta: {
      codeLength: String(code).length,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0
    }
  };
}
