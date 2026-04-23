/** @typedef {import('./contract.js').RulesetConfig} RulesetConfig */
/** @typedef {import('./contract.js').PartialRulesetConfig} PartialRulesetConfig */

import { normalizeRuleset, DEFAULT_RULESET } from './defaults.js';
import { DEFAULT_RULESET_NAME } from './contract.js';
import { hasPreset, getPreset, listPresets, PRESETS } from './presets.js';
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
 * Load a ruleset by name
 * Checks presets first, then file system profiles
 * @param {string} [name] - Preset name or profile name
 * @param {PartialRulesetConfig} [customConfig] - Optional custom config overrides
 * @returns {Promise<RulesetConfig>}
 */
export async function loadRuleset(
  name = DEFAULT_RULESET_NAME,
  customConfig
) {
  if (customConfig) {
    return normalizeRuleset(customConfig);
  }

  // Check cache first
  if (profileCache.has(name)) {
    return /** @type {RulesetConfig} */ (profileCache.get(name));
  }

  // Check presets (strict, relaxed, minimal, a11y, performance)
  if (hasPreset(name)) {
    const preset = getPreset(name);
    profileCache.set(name, preset);
    return preset;
  }

  // Try to load from file system
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

/**
 * Get all available ruleset profiles
 * Includes both presets and file-based profiles
 * @returns {string[]}
 */
export function getAvailableProfiles() {
  const presets = listPresets();
  const fileProfiles = ['default']; // default is always available
  return [...new Set([...presets, ...fileProfiles])];
}

/**
 * Check if a ruleset name is valid (preset or file profile)
 * @param {string} name
 * @returns {boolean}
 */
export function isValidRuleset(name) {
  if (hasPreset(name)) return true;
  if (name === 'default') return true;
  // Could add file existence check here
  return false;
}
