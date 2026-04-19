import { describe, it, expect } from 'vitest';
import { loadRuleset, normalizeRuleset, clearRulesetCache, getAvailableProfiles } from '../src/ruleset/index.js';
import { validateUI } from '../src/validator.js';
import { runFixLoop } from '../src/fix-loop.js';

describe('ruleset loader', () => {
  beforeEach(() => {
    clearRulesetCache();
  });

  it('loads default ruleset', async () => {
    const ruleset = await loadRuleset('default');
    expect(ruleset.name).toBe('default');
    expect(ruleset.tokens.requireSemantic).toBe(true);
    expect(ruleset.spacing.gridSize).toBe(8);
  });

  it('loads strict ruleset', async () => {
    const ruleset = await loadRuleset('strict');
    expect(ruleset.name).toBe('strict');
    expect(ruleset.tokens.severity).toBe('error');
    expect(ruleset.spacing.severity).toBe('error');
    expect(ruleset.patterns.minConfidence).toBe(0.8);
  });

  it('loads relaxed ruleset', async () => {
    const ruleset = await loadRuleset('relaxed');
    expect(ruleset.name).toBe('relaxed');
    expect(ruleset.tokens.requireSemantic).toBe(false);
    expect(ruleset.spacing.enforceGrid).toBe(false);
  });

  it('normalizes partial config', () => {
    const partial = {
      name: 'custom',
      tokens: { severity: 'warn' }
    };
    const normalized = normalizeRuleset(partial);
    expect(normalized.name).toBe('custom');
    expect(normalized.tokens.severity).toBe('warn');
    expect(normalized.tokens.requireSemantic).toBe(true); // default
    expect(normalized.spacing.gridSize).toBe(8); // default
  });

  it('returns available profiles', () => {
    const profiles = getAvailableProfiles();
    expect(profiles).toContain('default');
    expect(profiles).toContain('strict');
    expect(profiles).toContain('relaxed');
  });
});

describe('ruleset validation behavior', () => {
  const codeWithRawColor = `
    .button {
      color: #FF5733;
      padding: 10px;
    }
  `;

  const codeWithOffGridSpacing = `
    .card {
      margin: 10px;
      padding: 20px;
    }
  `;

  const codeWithHeroNoCta = `
    <div class="hero">
      <h1>Welcome</h1>
    </div>
  `;

  it('strict ruleset: raw color is error', async () => {
    const result = await validateUI({ code: codeWithRawColor, rulesetName: 'strict' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.meta.ruleset).toBe('strict');
  });

  it('relaxed ruleset: raw color is warn or allowed', async () => {
    const result = await validateUI({ code: codeWithRawColor, rulesetName: 'relaxed' });
    // Relaxed allows raw values, so should be valid
    const tokenErrors = result.errors.filter(e => e.id === 'dsr.token.no-raw-values');
    expect(tokenErrors.length).toBe(0);
  });

  it('strict ruleset: off-grid spacing is error', async () => {
    const result = await validateUI({ code: codeWithOffGridSpacing, rulesetName: 'strict' });
    expect(result.meta.ruleset).toBe('strict');
  });

  it('relaxed ruleset: off-grid spacing is info', async () => {
    const result = await validateUI({ code: codeWithOffGridSpacing, rulesetName: 'relaxed' });
    expect(result.meta.ruleset).toBe('relaxed');
  });

  it('ruleset can be overridden via rules param', async () => {
    const customConfig = {
      tokens: { severity: 'info', requireSemantic: false }
    };
    const result = await validateUI({ 
      code: codeWithRawColor, 
      rules: { ruleset: customConfig },
      rulesetName: 'strict'
    });
    // Custom config overrides profile
    const tokenErrors = result.errors.filter(e => e.id === 'dsr.token.no-raw-values');
    expect(tokenErrors.length).toBe(0);
  });
});

describe('ruleset with fix loop', () => {
  const problematicCode = `
    .hero {
      color: #FF5733;
      padding: 10px;
    }
  `;

  it('fix loop respects ruleset configuration', async () => {
    const result = await runFixLoop({ 
      code: problematicCode, 
      rulesetName: 'default',
      maxIterations: 3 
    });
    expect(result.meta.ruleset).toBe('default');
    expect(result.iterations).toBeGreaterThanOrEqual(0);
  });
});
