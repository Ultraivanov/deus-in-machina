# DSR Rule Packs Guide

> Complete guide for using and creating configurable rule packs with severity levels.

---

## Overview

DSR provides **configurable rule packs** that allow you to customize validation policies for different project requirements. Each rule pack defines:
- **Which rules are enabled** (tokens, spacing, patterns, layout, accessibility, performance)
- **Severity levels** for each category (error, warn, info, ignore)
- **Rule-specific settings** (grid size, confidence thresholds, max depth)

---

## Quick Start

### Use a Built-in Preset

```javascript
import { loadRuleset, listPresets } from './src/ruleset/index.js';
import { validateUI } from './src/validator.js';

// List available presets
console.log(listPresets());
// ['strict', 'relaxed', 'minimal', 'a11y', 'performance']

// Use the strict preset
const ruleset = await loadRuleset('strict');

// Validate with it
const result = await validateUI({
  code: 'background: #FF0000;',
  rulesetName: 'strict'
});

console.log(result.summary);
// { errors: 1, warnings: 0, infos: 0 }
```

### Severity Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| `error` | Blocks release, must fix | Production code |
| `warn` | Warning, should review | Development |
| `info` | Informational only | Suggestions |
| `ignore` | Disabled, no validation | Not applicable |

---

## Built-in Presets

### Strict

Maximum enforcement for design system compliance.

```javascript
const ruleset = await loadRuleset('strict');
```

| Category | Severity | Settings |
|----------|----------|----------|
| tokens | `error` | requireSemantic: true, allowRawValues: false |
| spacing | `error` | enforceGrid: true, gridSize: 8 |
| patterns | `error` | minConfidence: 0.8 |
| layout | `error` | maxDepth: 5 |

**Best for:** Production releases, design system enforcement

### Relaxed

Balanced rules for rapid development.

```javascript
const ruleset = await loadRuleset('relaxed');
```

| Category | Severity | Settings |
|----------|----------|----------|
| tokens | `warn` | requireSemantic: false, allowRawValues: true |
| spacing | `warn` | enforceGrid: false, gridSize: 8 |
| patterns | `warn` | minConfidence: 0.6 |
| layout | `warn` | maxDepth: 15 |

**Best for:** Rapid prototyping, development phase

### Minimal

Only critical issues.

```javascript
const ruleset = await loadRuleset('minimal');
```

| Category | Severity | Settings |
|----------|----------|----------|
| tokens | `ignore` | Disabled |
| spacing | `ignore` | Disabled |
| patterns | `warn` | minConfidence: 0.9 |
| layout | `ignore` | Disabled |

**Best for:** Legacy projects, gradual adoption

### Accessibility (a11y)

Accessibility-first validation.

```javascript
const ruleset = await loadRuleset('a11y');
```

| Category | Severity | Settings |
|----------|----------|----------|
| tokens | `warn` | Standard compliance |
| spacing | `warn` | Standard grid |
| patterns | `info` | Pattern detection |
| layout | `info` | Structure guidelines |

**Best for:** Accessibility audits, WCAG compliance

### Performance

Performance optimization validation.

```javascript
const ruleset = await loadRuleset('performance');
```

| Category | Severity | Settings |
|----------|----------|----------|
| tokens | `info` | Guidance only |
| spacing | `info` | Optimized grid (4pt) |
| patterns | `warn` | Complexity warnings |
| layout | `error` | maxDepth: 8 |

**Best for:** Performance optimization, large applications

---

## Rule Categories

Rules are organized into 6 functional categories:

```javascript
import { listCategories, getCategoryInfo } from './src/ruleset/index.js';

// List all categories
listCategories();
// ['tokens', 'spacing', 'patterns', 'layout', 'accessibility', 'performance']

// Get category details
const info = getCategoryInfo('tokens');
// { name: 'Design Tokens', description: '...', ruleTypes: [...] }
```

### tokens
Design token usage and semantic naming.

**Rule types:** `token_semantic`, `token_naming`, `token_scope`

**Example violations:**
- Raw hex colors instead of semantic tokens
- Non-semantic token names
- Scope violations

### spacing
Spacing, grids, and alignment.

**Rule types:** `spacing_grid`, `spacing_scale`, `spacing_consistency`

**Example violations:**
- 7px spacing (off 8pt grid)
- Inconsistent spacing

### patterns
UI pattern detection and validation.

**Rule types:** `pattern_detection`, `pattern_completeness`, `pattern_consistency`

**Example violations:**
- Hero without CTA
- Low-confidence patterns

### layout
Layout structure and hierarchy.

**Rule types:** `layout_depth`, `layout_structure`, `layout_constraints`

**Example violations:**
- Excessive nesting depth
- Missing required tokens

### accessibility
A11y compliance.

**Rule types:** `a11y_contrast`, `a11y_labels`, `a11y_focus`

**Example violations:**
- Insufficient color contrast
- Missing accessible labels

### performance
Performance optimization.

**Rule types:** `perf_image_size`, `perf_complexity`, `perf_nesting`

**Example violations:**
- Oversized images
- Excessive component complexity

---

## Creating Custom Rule Packs

### Extend a Preset

```javascript
import { extendPreset } from './src/ruleset/index.js';

// Create custom ruleset based on relaxed
const myRuleset = extendPreset('relaxed', {
  name: 'my-team',
  description: 'My team\'s custom rules',
  tokens: {
    severity: 'error',  // Make token rules strict
    requireSemantic: true
  },
  spacing: {
    gridSize: 4  // Use 4pt grid instead of 8pt
  }
});

console.log(myRuleset);
```

### Full Custom Ruleset

```javascript
import { normalizeRuleset } from './src/ruleset/index.js';

const customRuleset = normalizeRuleset({
  name: 'enterprise',
  description: 'Enterprise design system rules',
  tokens: {
    requireSemantic: true,
    allowRawValues: false,
    severity: 'error'
  },
  spacing: {
    enforceGrid: true,
    gridSize: 8,
    severity: 'error'
  },
  patterns: {
    minConfidence: 0.75,
    severity: 'warn'
  },
  layout: {
    maxDepth: 10,
    requiredTokens: ['color.primary', 'spacing.base'],
    severity: 'warn'
  }
});
```

### Using Custom Rulesets

```javascript
import { validateUI } from './src/validator.js';

// Pass custom ruleset directly
const result = await validateUI({
  code: '/* your code */',
  rules: {
    ruleset: customRuleset  // Pass as rules.ruleset
  }
});
```

---

## Per-Rule Configuration

### Core Rules Registry

```javascript
import { CORE_RULES, getRule, getRulesByCategory } from './src/ruleset/index.js';

// Get all rules
console.log(Object.keys(CORE_RULES));

// Get specific rule
const rule = getRule('token.semantic-required');
// { id, name, description, category, type, severity, enabled }

// Get rules by category
const tokenRules = getRulesByCategory('tokens');
```

### Understanding Rule Metadata

```javascript
{
  id: 'token.semantic-required',           // Unique identifier
  name: 'Require Semantic Tokens',         // Display name
  description: 'Enforce use of...',       // Description
  category: 'tokens',                       // Rule category
  type: 'token_semantic',                   // Specific type
  severity: 'error',                        // Default severity
  enabled: true                             // Enabled by default
}
```

---

## Validation with Categories

### Results Grouped by Category

```javascript
const result = await validateUI({
  code: '/* code with violations */',
  rulesetName: 'strict'
});

// Issues grouped by category
console.log(result.byCategory);
// {
//   tokens: [{...}, {...}],
//   spacing: [{...}],
//   patterns: []
// }
```

### Severity Summary

```javascript
import { getSeveritySummary } from './src/ruleset/index.js';

const ruleset = await loadRuleset('strict');
const summary = getSeveritySummary(ruleset);
// { error: 4, warn: 0, info: 0, ignore: 0 }
```

---

## Validation Output Format

```javascript
{
  valid: false,
  summary: {
    errors: 2,
    warnings: 1,
    infos: 0
  },
  errors: [
    {
      id: 'dsr.token.no-raw-values',
      type: 'token_violation',
      message: 'Raw color used instead of token',
      severity: 'ERROR',
      category: 'tokens'
    }
  ],
  warnings: [...],
  infos: [],
  byCategory: {
    tokens: [...],
    spacing: [...]
  },
  meta: {
    codeLength: 1234,
    ruleCount: 0,
    ruleset: 'strict',
    severity: {
      tokens: 'error',
      spacing: 'error',
      patterns: 'error',
      layout: 'error'
    }
  }
}
```

---

## CLI Usage

### Use Preset via CLI

```bash
# Validate with strict preset
dsr validate --ruleset strict

# Validate with relaxed preset
dsr validate --ruleset relaxed

# Export with specific ruleset
dsr export-variables --ruleset minimal
```

### Environment Variable

```bash
# Set default ruleset
export DSR_RULESET=relaxed
```

---

## Best Practices

### For Small Teams

```javascript
// Use relaxed during development
const devRuleset = await loadRuleset('relaxed');

// Switch to strict before release
const prodRuleset = await loadRuleset('strict');
```

### For Enterprise

```javascript
// Extend strict with custom requirements
const enterpriseRuleset = extendPreset('strict', {
  name: 'enterprise',
  layout: {
    maxDepth: 8,  // Stricter than default
    severity: 'error'
  }
});
```

### For Legacy Migration

```javascript
// Start with minimal, gradually increase
const phases = ['minimal', 'relaxed', 'strict'];

for (const phase of phases) {
  const result = await validateUI({ code, rulesetName: phase });
  console.log(`Phase ${phase}: ${result.summary.errors} errors`);
}
```

### For Accessibility Focus

```javascript
// Use a11y preset
const ruleset = await loadRuleset('a11y');

// Or extend it
const customA11y = extendPreset('a11y', {
  tokens: { severity: 'error' }  // Also strict on tokens
});
```

---

## Troubleshooting

### Rules Not Applied

```javascript
// Check if severity is 'ignore'
const ruleset = await loadRuleset('minimal');
console.log(ruleset.tokens.severity); // 'ignore' = disabled

// Switch to a preset that enables the rules
const active = await loadRuleset('strict');
```

### Too Many Errors

```javascript
// Use relaxed or minimal preset
const ruleset = await loadRuleset('relaxed');

// Or selectively ignore categories
const custom = extendPreset('strict', {
  spacing: { severity: 'ignore' }  // Disable spacing rules
});
```

### Cache Issues

```javascript
import { clearRulesetCache } from './src/ruleset/index.js';

// Clear cache if presets not loading correctly
clearRulesetCache();
```

---

## Configuration Reference

### RulesetConfig Structure

```typescript
interface RulesetConfig {
  name: string;
  description: string;
  tokens: {
    requireSemantic: boolean;
    allowRawValues: boolean;
    severity: 'error' | 'warn' | 'info' | 'ignore';
  };
  spacing: {
    enforceGrid: boolean;
    gridSize: number;
    severity: 'error' | 'warn' | 'info' | 'ignore';
  };
  patterns: {
    minConfidence: number;
    severity: 'error' | 'warn' | 'info' | 'ignore';
  };
  layout: {
    maxDepth: number;
    requiredTokens: string[];
    severity: 'error' | 'warn' | 'info' | 'ignore';
  };
}
```

### API Reference

```javascript
// Loading
loadRuleset(name, customConfig?)
loadRulesetSync(name, customConfig?)
isValidRuleset(name)
getAvailableProfiles()

// Presets
getPreset(name)
listPresets()
hasPreset(name)
extendPreset(base, overrides)
getSeveritySummary(ruleset)

// Categories
listCategories()
getCategoryInfo(category)
getCategoryForRuleType(ruleType)
getRulesByCategory(category)

// Rules
listRuleIds()
getRule(id)
getEnabledRules()
CORE_RULES
RULE_CATEGORIES
```

---

_Last updated: 2026-04-25_
