function buildEmptyReport() {
  return {
    valid: true,
    summary: { errors: 0, warnings: 0, infos: 0 },
    errors: [],
    warnings: [],
    infos: []
  };
}

export function runFixLoop({ code = "", rules = {}, maxIterations = 0 } = {}) {
  const finalCode = String(code);

  return {
    final_code: finalCode,
    iterations: 0,
    report: buildEmptyReport(),
    meta: {
      maxIterations,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0
    }
  };
}
