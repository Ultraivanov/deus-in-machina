import { validateUI } from "./validator.js";
import { fixUI } from "./fix.js";

function normalizeMaxIterations(value) {
  if (value === undefined || value === null) return 3;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function runFixLoop({ code = "", rules = {}, maxIterations } = {}) {
  const loopMax = normalizeMaxIterations(maxIterations);
  let currentCode = String(code);
  let report = validateUI({ code: currentCode, rules });
  let iterations = 0;

  while (iterations < loopMax && report.summary.errors > 0) {
    const fixed = fixUI({ code: currentCode, errors: report.errors });
    currentCode = fixed.fixed_code;
    iterations += 1;
    report = validateUI({ code: currentCode, rules });
  }

  return {
    final_code: currentCode,
    iterations,
    report,
    meta: {
      maxIterations: loopMax,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0
    }
  };
}
