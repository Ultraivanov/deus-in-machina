export { normalizeTokens } from "./normalizer.js";
export { detectPatterns } from "./patterns.js";
export { validateUI } from "./validator.js";
export { fixUI } from "./fix.js";
export { runFixLoop } from "./fix-loop.js";
export { extractFigmaContext } from "./adapters/figma.js";
export {
  loadRuleset,
  loadRulesetSync,
  clearRulesetCache,
  getAvailableProfiles,
  isValidRuleset,
  normalizeRuleset,
  DEFAULT_RULESET,
  DEFAULT_RULESET_NAME
} from "./ruleset/index.js";

import { normalizeTokens } from "./normalizer.js";
import { detectPatterns } from "./patterns.js";
import { validateUI } from "./validator.js";
import { fixUI } from "./fix.js";
import { runFixLoop } from "./fix-loop.js";
import { extractFigmaContext } from "./adapters/figma.js";
import {
  loadRuleset,
  loadRulesetSync,
  clearRulesetCache,
  getAvailableProfiles,
  isValidRuleset,
  normalizeRuleset,
  DEFAULT_RULESET,
  DEFAULT_RULESET_NAME
} from "./ruleset/index.js";

export default {
  normalizeTokens,
  detectPatterns,
  validateUI,
  fixUI,
  runFixLoop,
  extractFigmaContext,
  loadRuleset,
  loadRulesetSync,
  clearRulesetCache,
  getAvailableProfiles,
  isValidRuleset,
  normalizeRuleset,
  DEFAULT_RULESET,
  DEFAULT_RULESET_NAME
};
