# Pilot Project Example

A working example of DSR integration with intentional violations to demonstrate the validation and fix loop.

---

## What's Included

- **Intentional violations** in `src/` to test DSR detection
- **`.dsr.json`** — project-level ruleset configuration
- **npm scripts** — `validate` and `fix` commands
- **Before/after comparison** — run fix loop to see corrections

---

## Setup

```bash
cd examples/pilot-project
npm install
```

---

## Usage

### Validate Only

```bash
npm run validate
```

Shows all violations without fixing them.

### Validate and Fix

```bash
npm run fix
```

Runs the fix loop and outputs corrected files to `dist/fixed/`.

---

## Known Violations

### `src/components/button.css`

| Violation | Rule ID | Severity |
|-----------|---------|----------|
| Raw hex color `#FF5733` | `dsr.token.no-raw-values` | error |
| 10px padding (off 8pt grid) | `dsr.spacing.grid-violation` | warn |

### `src/styles.css`

| Violation | Rule ID | Severity |
|-----------|---------|----------|
| Raw hex color `#333333` | `dsr.token.no-raw-values` | error |
| 12px margin (off 8pt grid) | `dsr.spacing.grid-violation` | warn |
| Missing CTA in hero section | `dsr.pattern.hero-missing-cta` | warn |

---

## Configuration

See `.dsr.json` for project ruleset. Currently uses `default` profile with custom grid size.

---

## Expected Output

### Validation (strict mode)

```json
{
  "valid": false,
  "summary": {
    "errors": 2,
    "warnings": 3,
    "infos": 0
  },
  "errors": [
    { "id": "dsr.token.no-raw-values", "file": "button.css" },
    { "id": "dsr.token.no-raw-values", "file": "styles.css" }
  ]
}
```

### After Fix Loop

```json
{
  "valid": true,
  "summary": {
    "errors": 0,
    "warnings": 0,
    "infos": 2
  },
  "iterations": 2
}
```

---

## Learn More

- [Quick Start Guide](../../docs/quick-start.md)
- [Ruleset Configuration](../../docs/ruleset-guide.md)
- [DSR Specification](../../dsr_spec_v3.md)

---

_Last updated: 2026-04-19_
