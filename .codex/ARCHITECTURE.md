# ARCHITECTURE — DSR v3

## System Overview
Pipeline:
Figma → Extractor → Normalizer → Pattern Engine → Rules → Validator → Fix Loop

MCP Toolchain:
extract_figma_context → normalize_tokens → build_landing_spec → generate_ui → validate_ui → fix_ui → loop_until_valid

## Core Modules
- Extractor: ingests Figma layout tree, variables, and styles into a machine-safe input contract.
- Normalizer: maps raw names/values into a strict semantic token model.
- Pattern Engine: detects reusable UI structures (Hero, Card, List) via heuristics.
- Rules: validation ruleset (tokens, spacing, components, layout, patterns).
- Validator: produces lint-style output with severity levels.
- Correction Engine: generates fix instructions and re-runs validation.

## Token Model (v3)

### Layer 1: Raw (Figma)
- `name` (string)
- `value` (string | number)
- `type` (optional: color, number, typography, shadow, etc.)

Example:
```json
{ "name": "Color/Primary/Default", "value": "#3366FF", "type": "color" }
```

### Layer 2: Normalized
- `category` (color, space, typography, radius, shadow, motion)
- `role` (primary, secondary, neutral, background, text) optional
- `scale` (string or number) optional
- `state` (default, hover, disabled, focus, active) optional
- `sourceName` (original raw name) optional

Example:
```json
{
  "category": "color",
  "role": "primary",
  "state": "default",
  "sourceName": "Color/Primary/Default"
}
```

### Layer 3: Semantic
- `token` (string)
- `value` (same as raw value)

Example:
```json
{ "token": "color.primary.default", "value": "#3366FF" }
```

## Naming & Mapping Rules
- Split raw names by `/`, `-`, `_`, whitespace, and camelCase boundaries.
- Normalize all segments to lowercase.
- Category is the first segment (or inferred from known sets).
- Role is the next semantic segment (primary, secondary, neutral, background, text).
- Scale is numeric (e.g. 100–900 or 8, 12, 16).
- State is one of: `default`, `hover`, `disabled`, `focus`, `active`.
- If role is missing, use `base`.
- If state is missing and a state is expected, use explicit `default`.
- Semantic token format: `category.role[.scale][.state]`.

## Examples (Normalization)

### Example A — Primary color (state)
Raw:
```json
{ "name": "Color/Primary/Default", "value": "#3366FF" }
```
Normalized:
```json
{ "category": "color", "role": "primary", "state": "default" }
```
Semantic:
```json
{ "token": "color.primary.default", "value": "#3366FF" }
```

### Example B — Neutral scale
Raw:
```json
{ "name": "Color/Neutral/500", "value": "#999999" }
```
Normalized:
```json
{ "category": "color", "role": "neutral", "scale": "500" }
```
Semantic:
```json
{ "token": "color.neutral.500", "value": "#999999" }
```

### Example C — Spacing scale
Raw:
```json
{ "name": "Spacing/8", "value": 8 }
```
Normalized:
```json
{ "category": "space", "role": "base", "scale": "8" }
```
Semantic:
```json
{ "token": "space.base.8", "value": 8 }
```

### Example D — Typography size
Raw:
```json
{ "name": "Typography/Body/16", "value": 16, "type": "typography" }
```
Normalized:
```json
{ "category": "typography", "role": "body", "scale": "16" }
```
Semantic:
```json
{ "token": "typography.body.16", "value": 16 }
```

## MCP Tool Spec (Runtime API)

### Tool 1 — extract_figma_context
Extract full design system from a Figma file.

Input:
```json
{ "fileKey": "string" }
```
Output:
```json
{
  "context": {
    "variables": {},
    "styles": {},
    "components": {},
    "layout": {}
  }
}
```

#### Example — extract_figma_context output
```json
{
  "context": {
    "variables": {
      "color.primary.default": "#3366FF",
      "spacing.8": 8
    },
    "styles": {
      "text.h1": { "fontSize": 48, "fontWeight": 700 },
      "text.body": { "fontSize": 16, "fontWeight": 400 }
    },
    "components": {
      "Button/Primary": { "id": "10:2", "variants": ["default", "hover"] }
    },
    "layout": {
      "root": { "id": "0:1", "children": ["1:1", "1:2"] }
    }
  }
}
```

## Extractor Interface (v0)

### Input Contract
```json
{
  "fileKey": "string",
  "nodeIds": ["string"],
  "include": ["variables", "styles", "components", "layout"]
}
```

Notes:
- `nodeIds` is optional; if omitted, extract from the full file.
- `include` is optional; defaults to all sections.

#### Example — extract_figma_context input
```json
{
  "fileKey": "AbCdEf123",
  "nodeIds": ["1:1", "1:10"],
  "include": ["variables", "styles", "layout"]
}
```

### Output Contract
```json
{
  "context": {
    "variables": {},
    "styles": {},
    "components": {},
    "layout": {}
  },
  "meta": {
    "fileKey": "string",
    "nodeCount": 0,
    "extractedAt": "ISO-8601"
  }
}
```

#### Example — extract_figma_context output (full)
```json
{
  "context": {
    "variables": {
      "Color/Primary/Default": "#3366FF",
      "Spacing/8": 8
    },
    "styles": {
      "Text/H1": { "fontSize": 48, "fontWeight": 700 },
      "Text/Body": { "fontSize": 16, "fontWeight": 400 }
    },
    "components": {
      "Button/Primary": { "id": "10:2", "variants": ["default", "hover"] }
    },
    "layout": {
      "root": { "id": "0:1", "children": ["1:1", "1:2"] }
    }
  },
  "meta": {
    "fileKey": "AbCdEf123",
    "nodeCount": 120,
    "extractedAt": "2026-04-05T12:00:00Z"
  }
}
```

### Adapter Notes + Edge Cases
- Missing nodes: if a `nodeId` is not found, return it in `meta.missingNodes` and continue.
- Partial extracts: if `include` omits a section, return an empty object for that section.
- Rate limits / timeouts: return `meta.partial=true` and include `meta.warnings`.
- Unknown variable types: map to `custom` category and preserve original name.
- Component cycles or invalid trees: sanitize by removing cycles and record in `meta.warnings`.

### Tool 2 — normalize_tokens
Convert raw Figma data into semantic tokens.

Input:
```json
{ "context": {} }
```
Output:
```json
{
  "normalized_context": {
    "tokens": {
      "color.primary.default": "#3366FF"
    }
  }
}
```

#### Example — normalize_tokens output
```json
{
  "normalized_context": {
    "tokens": {
      "color.primary.default": "#3366FF",
      "color.neutral.500": "#999999",
      "space.base.8": 8
    },
    "meta": {
      "sourceCount": 24,
      "normalizedCount": 18
    }
  }
}
```

## Normalizer Interface (v0)

### Input Contract
```json
{
  "context": {
    "variables": {},
    "styles": {},
    "components": {},
    "layout": {}
  }
}
```

### Output Contract
```json
{
  "normalized_context": {
    "tokens": {},
    "meta": {
      "sourceCount": 0,
      "normalizedCount": 0
    }
  }
}
```

Notes:
- Uses `context.variables` and `context.styles` as primary inputs.
- `components` and `layout` are ignored in v0 normalization.

### Stub Flow (v0)
1. Read raw variables/styles from `context`.
2. Split names into segments (`/`, `_`, `-`, camelCase).
3. Infer category from first segment or `type`.
4. Infer role, scale, state.
5. Build semantic token `category.role[.scale][.state]`.
6. Deduplicate using deterministic precedence.
7. Emit `normalized_context.tokens` and `meta` counts.

### Test Vectors (v0)

#### Vector 1 — Primary color
Input:
```json
{ "name": "Color/Primary/Default", "value": "#3366FF" }
```
Expected:
```json
{ "token": "color.primary.default", "value": "#3366FF" }
```

#### Vector 2 — Neutral scale
Input:
```json
{ "name": "Color/Neutral/500", "value": "#999999" }
```
Expected:
```json
{ "token": "color.neutral.500", "value": "#999999" }
```

#### Vector 3 — Spacing
Input:
```json
{ "name": "Spacing/8", "value": 8 }
```
Expected:
```json
{ "token": "space.base.8", "value": 8 }
```

### Tool 3 — build_landing_spec
Merge landing copy with design system context.

Input:
```json
{
  "normalized_context": {},
  "landing_spec": {}
}
```
Output:
```json
{ "execution_spec": {} }
```

### Tool 4 — generate_ui
Generate UI code using Codex.

Input:
```json
{ "execution_spec": {} }
```
Output:
```json
{ "code": "string" }
```

### Tool 5 — validate_ui
Run UI linting engine.

Input:
```json
{
  "code": "string",
  "rules": {}
}
```
Output:
```json
{
  "valid": false,
  "errors": [
    {
      "type": "spacing_violation",
      "message": "Expected 8pt grid"
    }
  ]
}
```

#### Example — validate_ui output
```json
{
  "valid": false,
  "summary": { "errors": 1, "warnings": 0, "infos": 0 },
  "errors": [
    {
      "id": "dsr.spacing.grid-8pt",
      "type": "spacing_violation",
      "severity": "ERROR",
      "message": "Expected 8pt grid",
      "nodeId": "2:07"
    }
  ],
  "warnings": [],
  "infos": []
}
```

## Validator Interface (v0)

### Input Contract
```json
{
  "code": "string",
  "rules": {}
}
```

### Output Contract
```json
{
  "valid": false,
  "summary": { "errors": 0, "warnings": 0, "infos": 0 },
  "errors": [],
  "warnings": [],
  "infos": []
}
```

Notes:
- `rules` can be empty for defaults.
- Severity model applies to `errors`, `warnings`, `infos`.

### Stub Flow (v0)
1. Load `code` and `rules` (or defaults).
2. Parse UI structure and extract raw values.
3. Check token usage and spacing grid.
4. Validate component usage and layout constraints.
5. Validate pattern compliance from detected patterns.
6. Build error/warning/info lists.
7. Emit `valid` and `summary` counts.

### Test Vectors (v0)

#### Vector 1 — Token violation
Input:
```json
{ "code": "<div style='color:#FF0000'>", "rules": {} }
```
Expected:
```json
{ "valid": false, "errors": [{ "id": "dsr.token.no-raw-values" }] }
```

#### Vector 2 — Spacing violation
Input:
```json
{ "code": "<div style='margin:10px'>", "rules": { "grid": 8 } }
```
Expected:
```json
{ "valid": false, "errors": [{ "id": "dsr.spacing.grid-8pt" }] }
```

#### Vector 3 — Pattern warning
Input:
```json
{ "code": "<section class='hero'><h1>Title</h1></section>", "rules": {} }
```
Expected:
```json
{ "valid": true, "warnings": [{ "id": "dsr.pattern.hero-missing-cta" }] }
```

### Tool 6 — fix_ui
Fix UI based on validation errors.

Input:
```json
{ "code": "string", "errors": [] }
```
Output:
```json
{ "fixed_code": "string" }
```

#### Example — fix_ui output
```json
{
  "fixed_code": "<code...>",
  "applied_fixes": [
    {
      "id": "fix_dsr.spacing.grid-8pt_2:07",
      "ruleId": "dsr.spacing.grid-8pt",
      "nodeId": "2:07",
      "action": "adjust_spacing"
    }
  ]
}
```

### Tool 7 — loop_until_valid
Run generation → validation → fix loop.

Input:
```json
{ "execution_spec": {}, "rules": {} }
```
Output:
```json
{ "final_code": "string", "iterations": 2 }
```

#### Example — loop_until_valid output
```json
{
  "final_code": "<code...>",
  "iterations": 2,
  "final_report": {
    "valid": true,
    "summary": { "errors": 0, "warnings": 1, "infos": 0 }
  }
}
```

## Data Contracts (v0)

### Raw Input (from Figma)
- `variables`: list of name/value pairs
- `styles`: typography/spacing styles
- `layoutTree`: component and node hierarchy

### Patterns (Output Schema)
- `id` (string, optional stable identifier)
- `name` (Human-readable pattern name: Hero, Card, List)
- `type` (enum: `hero`, `card`, `list`)
- `confidence` (0–1)
- `structure` (ordered list of semantic roles: `headline`, `subheadline`, `cta`, `media`, `title`, `description`, `item`)
- `nodes` (array of source node IDs)
- `metadata` (optional: spacing, alignment, columns, layout direction)

Example:
```json
{
  "id": "pattern_hero_01",
  "name": "Hero",
  "type": "hero",
  "confidence": 0.92,
  "structure": ["headline", "subheadline", "cta"],
  "nodes": ["1:12", "1:18", "1:21"],
  "metadata": { "direction": "vertical", "spacing": 16 }
}
```

#### Example — pattern detection output
```json
{
  "patterns": [
    {
      "id": "pattern_hero_01",
      "name": "Hero",
      "type": "hero",
      "confidence": 0.91,
      "structure": ["headline", "subheadline", "cta"],
      "nodes": ["1:10", "1:12", "1:15"],
      "metadata": { "direction": "vertical", "spacing": 16 }
    }
  ]
}
```

## Pattern Engine Interface (v0)

### Input Contract
```json
{
  "context": {
    "layout": {}
  },
  "options": {
    "minConfidence": 0.7
  }
}
```

### Output Contract
```json
{
  "patterns": [],
  "meta": {
    "detectedCount": 0
  }
}
```

Notes:
- Primary input is `context.layout`.
- `minConfidence` filters weak detections.

### Stub Flow (v0)
1. Load layout tree from `context.layout`.
2. Traverse nodes and compute simple signatures (type, size, text roles).
3. Detect Hero: headline + subheadline + CTA stack.
4. Detect Card: container + title + description + optional media.
5. Detect List: repeated item subtrees with consistent spacing.
6. Compute confidence scores and filter by `minConfidence`.
7. Emit `patterns` with `meta.detectedCount`.

### Test Vectors (v0)

#### Vector 1 — Hero
Input (layout excerpt):
```json
{ "nodes": ["headline", "subheadline", "cta"], "direction": "vertical" }
```
Expected:
```json
{ "type": "hero", "confidence": 0.9, "structure": ["headline", "subheadline", "cta"] }
```

#### Vector 2 — Card
Input (layout excerpt):
```json
{ "nodes": ["media", "title", "description"], "container": "padded" }
```
Expected:
```json
{ "type": "card", "confidence": 0.85, "structure": ["media", "title", "description"] }
```

#### Vector 3 — List
Input (layout excerpt):
```json
{ "items": 3, "itemSpacing": 12 }
```
Expected:
```json
{ "type": "list", "confidence": 0.8, "structure": ["item", "item", "item"] }
```

### Pattern Naming Conventions
- Use Title Case for `name` (Hero, Card, List).
- Use lowercase enum for `type` (`hero`, `card`, `list`).
- Keep `id` stable across re-runs when the same layout subtree is detected.

### Validation Output
- `valid`: boolean
- `errors`: list of `{ type, message, severity, nodeId? }`

## Token Normalization Rules

### Mapping (Deterministic)
- Parse naming conventions (`/`, `-`, `_`, camelCase).
- Lowercase all segments and trim empty segments.
- Known categories: `color`, `space`, `typography`, `radius`, `shadow`, `motion`.
- If the first segment is not a known category, infer category from `type` when available, else use `custom`.
- Role is the next semantic segment (primary, secondary, neutral, background, text), otherwise `base`.
- Scale is the last numeric segment (e.g. 100–900 or 8, 12, 16).
- State is one of: `default`, `hover`, `disabled`, `focus`, `active` (first match wins).
- Semantic token format: `category.role[.scale][.state]` in that order.

### Duplicate Resolution
If multiple raw entries map to the same semantic token, choose a deterministic winner:
1. Raw name already in semantic format (matches `^[a-z]+(\.[a-z0-9]+)+$`).
2. Entry with both `role` and `state` present.
3. Entry with `role` and `scale` present.
4. Entry with `role` only.
5. Lexicographic order by `sourceName` (stable tie-break).

### Edge Cases
- Multiple numeric segments: take the last numeric segment as `scale`.
- Missing role: use `base` to preserve token shape.
- Missing state: omit `state` unless the name explicitly signals a state token, then use `default`.
- Unknown segments: ignore for token construction but keep in `sourceName` for traceability.

## Pattern Heuristics (v1)

### Hero
Required elements:
- `headline` (largest text on page or section)
- `subheadline` (text block adjacent to headline)
- `cta` (button or link styled as primary action)

Layout cues:
- Vertical stack (single column) or two-column split (text + media)
- Headline appears above subheadline within the same container
- CTA appears after text group within the same container

Detection rules:
- Headline font size is top 5% of text sizes in the section
- CTA node has button-like traits (background fill + padding + short label)
- Container spacing is consistent (grid-aligned)

### Card
Required elements:
- `container` with padding
- `title`
- `description`
- Optional `media` (image or icon)

Layout cues:
- Rounded corners or shadow commonly present
- Title above description within container
- Media placed above or left of text group

Detection rules:
- Container has explicit padding and a background
- Title is larger or bolder than description
- Media node has fixed aspect ratio or image fill

### List
Required elements:
- Repeated `item` structure (2+)

Layout cues:
- Consistent spacing between items
- Each item has similar internal structure (e.g., title + meta)
- Items aligned in a single column or grid

Detection rules:
- Two or more sibling nodes with similar subtree signatures
- Spacing variance between items within tolerance (e.g., ±2px)
- Item width or height variance within tolerance (e.g., ±10%)

## Pattern Examples + Confidence (v1)

### Example 1 — Hero
```json
{
  "id": "pattern_hero_01",
  "name": "Hero",
  "type": "hero",
  "confidence": 0.91,
  "structure": ["headline", "subheadline", "cta"],
  "nodes": ["1:10", "1:12", "1:15"],
  "metadata": { "direction": "vertical", "spacing": 16 }
}
```

## Pattern Clustering (Moat Layer)

### Input Schema (v0)
```json
{
  "patterns": [
    {
      "projectId": "string",
      "patternId": "string",
      "type": "hero|card|list",
      "structure": ["headline", "subheadline", "cta"],
      "metadata": { "direction": "vertical", "spacing": 16 }
    }
  ]
}
```

### Output Schema (v0)
```json
{
  "clusters": [
    {
      "clusterId": "cluster_01",
      "type": "hero",
      "members": ["pattern_hero_01", "pattern_hero_07"],
      "centroid": { "structure": ["headline", "subheadline", "cta"] },
      "confidence": 0.82
    }
  ]
}
```

### Clustering Approach + Metrics (v0)
- Represent each pattern as a feature vector (type, structure length, spacing, layout direction).
- Compute similarity using weighted cosine distance.
- Group with simple agglomerative clustering by type (`hero`, `card`, `list`).
- Thresholds:
  - `similarity >= 0.8` → same cluster
  - `0.6–0.79` → candidate merge
  - `< 0.6` → separate clusters

### Example Clusters
```json
{
  "clusters": [
    {
      "clusterId": "cluster_hero_01",
      "type": "hero",
      "members": ["pattern_hero_01", "pattern_hero_07"],
      "centroid": { "structure": ["headline", "subheadline", "cta"], "direction": "vertical" },
      "confidence": 0.84
    },
    {
      "clusterId": "cluster_card_02",
      "type": "card",
      "members": ["pattern_card_02", "pattern_card_09"],
      "centroid": { "structure": ["media", "title", "description"], "spacing": 16 },
      "confidence": 0.78
    }
  ]
}
```
Confidence rationale:
- Large headline + stacked subheadline detected
- CTA button present with padding and primary fill
- Vertical stack spacing consistent (grid)

### Example 2 — Card
```json
{
  "id": "pattern_card_02",
  "name": "Card",
  "type": "card",
  "confidence": 0.86,
  "structure": ["media", "title", "description"],
  "nodes": ["2:04", "2:06", "2:08"],
  "metadata": { "padding": 24, "radius": 12 }
}
```
Confidence rationale:
- Container with padding + background
- Title larger than description
- Media node present with image fill

### Example 3 — List
```json
{
  "id": "pattern_list_01",
  "name": "List",
  "type": "list",
  "confidence": 0.79,
  "structure": ["item", "item", "item"],
  "nodes": ["3:01", "3:02", "3:03"],
  "metadata": { "direction": "vertical", "itemSpacing": 12 }
}
```
Confidence rationale:
- Repeated item subtrees detected (3 items)
- Spacing variance within tolerance
- Consistent width across items

## Validation Rules
- Token compliance: no raw values.
- Spacing rules: enforce grid (e.g. 8pt).
- Component integrity: forbid custom components outside system.
- Layout constraints: max columns, responsive rules.
- Pattern compliance: required elements and structure.

## Validation Rule Taxonomy + Naming

### Rule Categories
- `token` — semantic token usage (no raw values, valid tokens)
- `spacing` — grid and spacing consistency
- `component` — system component usage and variants
- `layout` — layout constraints (columns, breakpoints)
- `pattern` — structural compliance with detected patterns

### Rule ID Naming
Format: `dsr.<category>.<slug>`

Examples:
- `dsr.token.no-raw-values`
- `dsr.spacing.grid-8pt`
- `dsr.component.unknown-component`
- `dsr.layout.max-columns`
- `dsr.pattern.hero-missing-cta`

## Severity Model + Validation Output

### Severity Levels
- `ERROR` — must fix before output is accepted
- `WARNING` — allowed, but flagged for review
- `INFO` — suggestion only

Default handling:
- `ERROR` blocks `generate_ui` output from being accepted in `loop_until_valid`
- `WARNING` and `INFO` do not block, but are returned in the report

### Validation Output Schema
```json
{
  "valid": false,
  "summary": {
    "errors": 2,
    "warnings": 1,
    "infos": 0
  },
  "errors": [
    {
      "id": "dsr.spacing.grid-8pt",
      "type": "spacing_violation",
      "severity": "ERROR",
      "message": "Expected 8pt grid",
      "nodeId": "3:12"
    }
  ],
  "warnings": [
    {
      "id": "dsr.pattern.hero-missing-cta",
      "type": "pattern_violation",
      "severity": "WARNING",
      "message": "CTA missing in detected Hero",
      "nodeId": "1:10"
    }
  ],
  "infos": []
}
```

## Example Validation Reports

### Example A — Token violation (ERROR)
```json
{
  "valid": false,
  "summary": { "errors": 1, "warnings": 0, "infos": 0 },
  "errors": [
    {
      "id": "dsr.token.no-raw-values",
      "type": "token_violation",
      "severity": "ERROR",
      "message": "Raw color used instead of token",
      "nodeId": "5:22"
    }
  ],
  "warnings": [],
  "infos": []
}
```

### Example B — Spacing violation (ERROR)
```json
{
  "valid": false,
  "summary": { "errors": 1, "warnings": 0, "infos": 0 },
  "errors": [
    {
      "id": "dsr.spacing.grid-8pt",
      "type": "spacing_violation",
      "severity": "ERROR",
      "message": "Expected 8pt grid",
      "nodeId": "2:07"
    }
  ],
  "warnings": [],
  "infos": []
}
```

### Example C — Pattern warning (WARNING)
```json
{
  "valid": true,
  "summary": { "errors": 0, "warnings": 1, "infos": 0 },
  "errors": [],
  "warnings": [
    {
      "id": "dsr.pattern.hero-missing-cta",
      "type": "pattern_violation",
      "severity": "WARNING",
      "message": "CTA missing in detected Hero",
      "nodeId": "1:10"
    }
  ],
  "infos": []
}
```

## Fix Loop
1. Detect violation
2. Map to rule
3. Generate fix instruction
4. Re-run generation/validation

## CLI/Runner Interface (v0)

### Commands
- `dsr extract --file <fileKey> [--nodes <id1,id2>]`
- `dsr normalize --input <context.json>`
- `dsr patterns --input <context.json>`
- `dsr validate --code <ui.html> --rules <rules.json>`
- `dsr fix --code <ui.html> --errors <errors.json>`
- `dsr loop --spec <execution.json> --rules <rules.json>`

### Flags
- `--out <path>`: write output JSON
- `--format json|yaml`: output format
- `--min-confidence <0-1>`: pattern detection threshold
- `--max-iterations <n>`: loop cap

### Output Conventions
- Commands write JSON to stdout by default.
- Use `--out` to persist artifacts for later stages.

### Runner Flow (v0)
1. `dsr extract` → `context.json`
2. `dsr normalize` → `normalized.json`
3. `dsr patterns` → `patterns.json`
4. `dsr build_landing_spec` (optional) → `execution.json`
5. `dsr generate_ui` → `ui.html`
6. `dsr validate` → `report.json`
7. If errors: `dsr fix` → `ui.fixed.html` and re-run `validate`
8. `dsr loop` wraps steps 5–7 with `--max-iterations`

### Example Runs

#### Example 1 — Full pipeline
```bash
dsr extract --file AbCdEf123 --out context.json
dsr normalize --input context.json --out normalized.json
dsr patterns --input context.json --out patterns.json
dsr validate --code ui.html --rules rules.json --out report.json
```

#### Example 2 — Loop until valid
```bash
dsr loop --spec execution.json --rules rules.json --max-iterations 3 --out final.json
```

## Fix Instruction Schema + Naming

### Fix Instruction Format
```json
{
  "id": "fix_001",
  "ruleId": "dsr.spacing.grid-8pt",
  "nodeId": "2:07",
  "action": "adjust_spacing",
  "params": {
    "from": 10,
    "to": 8
  },
  "message": "Normalize spacing to 8pt grid",
  "severity": "ERROR"
}
```

### Naming Conventions
- `id`: `fix_<increment>` or deterministic hash (`fix_<ruleId>_<nodeId>`).
- `action` is a verb in snake_case (e.g., `adjust_spacing`, `replace_token`, `swap_component`).
- `ruleId` must match validation rule naming (`dsr.<category>.<slug>`).

## Correction Flow (Detect → Fix → Rerun)

1. **Validate UI**: run `validate_ui` to collect errors/warnings/infos.\n\n2. **Map errors to actions**: for each `ERROR`, choose a fix action based on rule type.\n\n3. **Generate fix instructions**: produce a list of fix instructions with deterministic IDs.\n\n4. **Apply fixes**: run `fix_ui` (or apply actions directly in generator).\n\n5. **Re-validate**: run `validate_ui` again on fixed code.\n\n6. **Loop**: stop when no `ERROR` remains or max iterations reached.\n\n7. **Emit final code + report**: output final code and summary.

### Action Mapping (v1)
- `dsr.token.no-raw-values` → `replace_token`
- `dsr.spacing.grid-8pt` → `adjust_spacing`
- `dsr.component.unknown-component` → `swap_component`
- `dsr.layout.max-columns` → `adjust_layout`
- `dsr.pattern.hero-missing-cta` → `add_element`

### Loop Constraints
- Max iterations: 3 (configurable)
- Stop early if error count does not decrease between iterations

## Example Fix Instructions

### Fix A — Replace raw color token
```json
{
  "id": "fix_dsr.token.no-raw-values_5:22",
  "ruleId": "dsr.token.no-raw-values",
  "nodeId": "5:22",
  "action": "replace_token",
  "params": { "from": "#FF0000", "to": "color.primary.default" },
  "message": "Replace raw color with semantic token",
  "severity": "ERROR"
}
```

### Fix B — Adjust spacing to grid
```json
{
  "id": "fix_dsr.spacing.grid-8pt_2:07",
  "ruleId": "dsr.spacing.grid-8pt",
  "nodeId": "2:07",
  "action": "adjust_spacing",
  "params": { "from": 10, "to": 8 },
  "message": "Normalize spacing to 8pt grid",
  "severity": "ERROR"
}
```

### Fix C — Add missing CTA
```json
{
  "id": "fix_dsr.pattern.hero-missing-cta_1:10",
  "ruleId": "dsr.pattern.hero-missing-cta",
  "nodeId": "1:10",
  "action": "add_element",
  "params": { "element": "cta", "label": "Get Started" },
  "message": "Add CTA to Hero pattern",
  "severity": "WARNING"
}
```

_Last updated: 2026-04-05_
