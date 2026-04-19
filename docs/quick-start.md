# Quick Start Guide

Get DSR running on your project in 5 minutes.

---

## Installation

### Option 1: Clone and link

```bash
git clone https://github.com/Ultraivanov/deus-in-machina.git
cd deus-in-machina
npm install
npm link
```

### Option 2: Use without installing

```bash
git clone https://github.com/Ultraivanov/deus-in-machina.git
cd deus-in-machina
npm install
```

Then use `node bin/dsr.js` instead of `dsr`.

---

## Verify Installation

```bash
dsr --help
```

Expected output: list of available commands.

---

## Basic Workflow

### 1. Extract Figma Context

```bash
dsr extract --file YOUR_FIGMA_FILE_ID --out context.json
```

Requires `FIGMA_TOKEN` environment variable:
```bash
export FIGMA_TOKEN=your_token_here
```

### 2. Normalize Tokens

```bash
dsr normalize --input context.json --out tokens.json
```

Converts raw Figma variables to semantic tokens.

### 3. Validate UI

```bash
dsr validate --input your-component.html --ruleset default
```

Or validate CSS:
```bash
dsr validate --input styles.css --ruleset strict
```

---

## Choose Your Ruleset

DSR provides three built-in profiles:

| Profile | Use Case | Token Rules | Spacing | Patterns |
|---------|----------|-------------|---------|----------|
| `default` | General development | Error on raw values | Warn on grid | Warn |
| `strict` | Production deployments | Error on everything | Error on grid | Error |
| `relaxed` | Prototyping, legacy | Allow raw values | Info only | Info |

Set ruleset via `--ruleset` flag or `DSR_RULESET` env var:

```bash
export DSR_RULESET=strict
dsr validate --input app.css
```

---

## First Validation Run

Create a test CSS file:

```css
/* test-styles.css */
.button {
  color: #FF5733;          /* Raw color - will fail on strict */
  padding: 10px;           /* Off-grid - will warn on default */
  margin: 16px;            /* On-grid - OK */
}
```

Run validation:

```bash
dsr validate --input test-styles.css --ruleset default
```

Expected output:
```json
{
  "valid": false,
  "summary": {
    "errors": 1,
    "warnings": 1,
    "infos": 0
  },
  "errors": [
    {
      "id": "dsr.token.no-raw-values",
      "message": "Raw color used instead of token"
    }
  ],
  "warnings": [
    {
      "id": "dsr.spacing.grid-violation",
      "message": "Expected 8pt grid"
    }
  ]
}
```

---

## Fix Loop (Auto-correction)

Run validation with automatic fixes:

```bash
dsr fix --input broken.css --output fixed.css --max-iterations 3
```

DSR will:
1. Validate the input
2. Apply fixes
3. Re-validate
4. Repeat until clean or max iterations reached

---

## Next Steps

- Read [Ruleset Configuration Guide](./ruleset-guide.md) to customize validation rules
- See [Example Project](../examples/pilot-project/) for a complete setup
- Check [dsr_spec_v3.md](../dsr_spec_v3.md) for detailed specification

---

## Troubleshooting

### "FIGMA_TOKEN not set"
Export your Figma personal access token:
```bash
export FIGMA_TOKEN=figd_xxxxxxxx
token from https://www.figma.com/developers/api#access-tokens
```

### "Cannot find module"
Make sure you ran `npm install` in the DSR directory.

### "Ruleset not found"
Use one of: `default`, `strict`, `relaxed`
Custom rulesets: see [Ruleset Guide](./ruleset-guide.md)

---

_Last updated: 2026-04-19_
