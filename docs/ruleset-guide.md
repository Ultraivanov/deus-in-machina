# Ruleset Configuration Guide

Customize DSR validation behavior for your project needs.

---

## Built-in Profiles

DSR ships with three pre-configured rulesets:

### `default` — Balanced

Best for: General development, mixed teams

```json
{
  "tokens": { "severity": "error", "requireSemantic": true },
  "spacing": { "severity": "warn", "enforceGrid": true, "gridSize": 8 },
  "patterns": { "severity": "warn", "minConfidence": 0.7 },
  "layout": { "severity": "info", "maxDepth": 10 }
}
```

- **Tokens**: Strict — no raw values allowed
- **Spacing**: Warning only — 8pt grid recommended but not enforced
- **Patterns**: Warning — suggestions for improvements
- **Layout**: Info — gentle guidance

### `strict` — Production

Best for: Design system libraries, component packages, CI/CD pipelines

```json
{
  "tokens": { "severity": "error", "requireSemantic": true },
  "spacing": { "severity": "error", "enforceGrid": true, "gridSize": 8 },
  "patterns": { "severity": "error", "minConfidence": 0.8 },
  "layout": { "severity": "warn", "maxDepth": 6, "requiredTokens": [...] }
}
```

- **Everything is error**: Fail CI on any violation
- **Higher pattern confidence**: 0.8 vs 0.7 in default
- **Shallow layout**: Max 6 nesting levels
- **Required tokens**: Must use core tokens

### `relaxed` — Prototyping

Best for: Rapid prototyping, legacy projects, experiments

```json
{
  "tokens": { "severity": "warn", "requireSemantic": false, "allowRawValues": true },
  "spacing": { "severity": "info", "enforceGrid": false, "gridSize": 4 },
  "patterns": { "severity": "info", "minConfidence": 0.5 },
  "layout": { "severity": "info", "maxDepth": 15 }
}
```

- **Allow raw values**: No hard enforcement
- **4pt grid**: More flexible than 8pt
- **Info-only**: Never fails, just suggestions
- **Deep nesting**: Up to 15 levels allowed

---

## Using Profiles

### CLI

```bash
# Use a built-in profile
dsr validate --input app.css --ruleset strict

# Environment variable (applies to all commands)
export DSR_RULESET=relaxed
dsr validate --input app.css
```

### Programmatic

```javascript
import { loadRuleset } from 'deus-in-machina/src/ruleset/index.js';

const ruleset = await loadRuleset('strict');
const result = await validateUI({ code, rulesetName: 'strict' });
```

---

## Creating Custom Rulesets

### 1. Project-level `.dsr.json`

Create in your project root:

```json
{
  "ruleset": {
    "name": "my-project",
    "description": "Custom rules for our design system",
    "extends": "default",
    "tokens": {
      "severity": "error",
      "allowRawValues": false
    },
    "spacing": {
      "severity": "warn",
      "gridSize": 4
    }
  }
}
```

### 2. Full Custom Profile

Create `my-ruleset.json`:

```json
{
  "name": "design-system",
  "description": "Strict rules for published components",
  "tokens": {
    "requireSemantic": true,
    "allowRawValues": false,
    "severity": "error"
  },
  "spacing": {
    "enforceGrid": true,
    "gridSize": 8,
    "severity": "error"
  },
  "patterns": {
    "minConfidence": 0.85,
    "severity": "warn"
  },
  "layout": {
    "maxDepth": 4,
    "requiredTokens": [
      "color.primary.default",
      "color.background.default",
      "space.1",
      "space.2",
      "space.3",
      "radius.md"
    ],
    "severity": "error"
  }
}
```

Load it:

```javascript
import { loadRuleset } from 'deus-in-machina/src/ruleset/index.js';
import myRuleset from './my-ruleset.json' assert { type: 'json' };

const config = await loadRuleset('default', myRuleset);
```

---

## Configuration Reference

### Tokens

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requireSemantic` | boolean | true | Require semantic token names |
| `allowRawValues` | boolean | false | Allow raw CSS values (hex, px) |
| `severity` | Severity | "error" | error/warn/info |

### Spacing

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enforceGrid` | boolean | true | Enforce grid alignment |
| `gridSize` | number | 8 | Grid base unit (4, 8, 16) |
| `severity` | Severity | "warn" | error/warn/info |

### Patterns

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minConfidence` | number | 0.7 | Minimum confidence threshold (0.0-1.0) |
| `severity` | Severity | "warn" | error/warn/info |

### Layout

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDepth` | number | 10 | Maximum nesting depth |
| `requiredTokens` | string[] | [] | Tokens that must be present |
| `severity` | Severity | "info" | error/warn/info |

---

## Severity Levels

| Level | Behavior | Use When |
|-------|----------|----------|
| `error` | Fails validation, blocks CI | Must-fix issues |
| `warn` | Reported but passes | Should-fix issues |
| `info` | Silent, logged only | FYI suggestions |

---

## Real-world Examples

### Design System Library

```json
{
  "ruleset": {
    "extends": "strict",
    "layout": {
      "requiredTokens": [
        "color.primary.default",
        "color.secondary.default",
        "space.1", "space.2", "space.3", "space.4",
        "radius.sm", "radius.md", "radius.lg"
      ]
    }
  }
}
```

### Marketing Site (Flexible)

```json
{
  "ruleset": {
    "extends": "default",
    "tokens": {
      "severity": "warn"
    },
    "spacing": {
      "gridSize": 4,
      "severity": "warn"
    }
  }
}
```

### Legacy Migration

```json
{
  "ruleset": {
    "extends": "relaxed",
    "tokens": {
      "severity": "info",
      "allowRawValues": true
    }
  }
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate Design System
  run: |
    npm install -g deus-in-machina
    dsr validate --input src/ --ruleset strict
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

dsr validate --input src/components --ruleset strict
if [ $? -ne 0 ]; then
  echo "Design system violations found. Run 'dsr fix' to auto-correct."
  exit 1
fi
```

---

## Troubleshooting

### "Unknown ruleset"

Use only: `default`, `strict`, `relaxed`, or a valid path to custom JSON.

### Rules not applying

Check severity — `info` level won't affect validation status.

### Custom ruleset not loading

Verify JSON syntax:
```bash
node -e "require('./my-ruleset.json')"
```

---

## Next Steps

- See [Quick Start Guide](./quick-start.md) for basic usage
- Check [Example Project](../examples/pilot-project/) for complete setup
- Read [dsr_spec_v3.md](../dsr_spec_v3.md) for technical details

---

_Last updated: 2026-04-19_
