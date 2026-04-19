import { validateUI } from "./validator.js";
import { fixUI } from "./fix.js";
import { loadRuleset } from "./ruleset/index.js";

function normalizeMaxIterations(value) {
  if (value === undefined || value === null) return 3;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export async function runFixLoop({ code = "", rules = {}, maxIterations, rulesetName = 'default' } = {}) {
  const loopMax = normalizeMaxIterations(maxIterations);
  let currentCode = String(code);
  let report = await validateUI({ code: currentCode, rules, rulesetName });
  let iterations = 0;

  const ruleset = await loadRuleset(rulesetName, rules.ruleset);

  while (iterations < loopMax && report.summary.errors > 0) {
    const fixed = fixUI({ code: currentCode, errors: report.errors });
    currentCode = fixed.fixed_code;
    iterations += 1;
    report = await validateUI({ code: currentCode, rules, rulesetName });
  }

  return {
    final_code: currentCode,
    iterations,
    report,
    meta: {
      maxIterations: loopMax,
      ruleCount: rules && typeof rules === "object" ? Object.keys(rules).length : 0,
      ruleset: ruleset.name
    }
  };
}
