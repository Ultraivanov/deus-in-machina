/** @typedef {import('./contract.js').RulesetConfig} RulesetConfig */
/** @typedef {import('./contract.js').PartialRulesetConfig} PartialRulesetConfig */

import { normalizeRuleset, DEFAULT_RULESET } from './defaults.js';
import { DEFAULT_RULESET_NAME } from './contract.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/** @type {Map<string, RulesetConfig>} */
const profileCache = new Map();

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @param {string} name */
function getProfilePath(name) {
  return join(__dirname, 'profiles', `${name}.json`);
}

/**
 * @param {string} [name]
 * @param {PartialRulesetConfig} [customConfig]
 * @returns {Promise<RulesetConfig>}
 */
export async function loadRuleset(
  name = DEFAULT_RULESET_NAME,
  customConfig
) {
  if (customConfig) {
    return normalizeRuleset(customConfig);
  }

  if (profileCache.has(name)) {
    return /** @type {RulesetConfig} */ (profileCache.get(name));
  }

  try {
    const profilePath = getProfilePath(name);
    const content = readFileSync(profilePath, 'utf-8');
    const parsed = JSON.parse(content);
    const config = normalizeRuleset(parsed);
    profileCache.set(name, config);
    return config;
  } catch (error) {
    console.warn(`[ruleset] Failed to load profile "${name}", using defaults. Error: ${error}`);
    return DEFAULT_RULESET;
  }
}

/**
 * @param {string} [name]
 * @param {PartialRulesetConfig} [customConfig]
 * @returns {RulesetConfig}
 */
export function loadRulesetSync(
  name = DEFAULT_RULESET_NAME,
  customConfig
) {
  if (customConfig) {
    return normalizeRuleset(customConfig);
  }

  if (profileCache.has(name)) {
    return /** @type {RulesetConfig} */ (profileCache.get(name));
  }

  console.warn(`[ruleset] Synchronous loading not available in ES modules, using async loadRuleset() or defaults for "${name}"`);
  return DEFAULT_RULESET;
}

export function clearRulesetCache() {
  profileCache.clear();
}

/** @returns {string[]} */
export function getAvailableProfiles() {
  return ['default', 'strict', 'relaxed'];
}
