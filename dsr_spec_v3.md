# Design System Runtime (DSR) – Codex-Friendly Spec v3

## Upgrade Focus
This version strengthens:
1. Pattern Inference (moat layer)
2. Token Normalization (strict mapping)
3. Validation Engine (UI linting system)

---

# 1. Token Normalization Engine

## Goal
Transform raw Figma variables/styles into a strict semantic token system.

## Problem
Figma data is:
- inconsistent naming
- mixed abstraction levels
- not machine-safe

## Solution
Introduce 3-layer token model:

### Layer 1: Raw (Figma)
{
  "name": "Color/Blue/500",
  "value": "#3366FF"
}

### Layer 2: Normalized
{
  "category": "color",
  "role": "primary",
  "scale": "500"
}

### Layer 3: Semantic
{
  "token": "color.primary.default"
}

---

## Mapping Rules

- Detect naming patterns (/, -, camelCase)
- Group by semantic intent (primary, secondary, background)
- Resolve duplicates
- Enforce hierarchy:

color.primary.default  
color.primary.hover  
color.primary.disabled  

---

## Output

{
  "tokens": {
    "color.primary.default": "#3366FF"
  }
}

---

# 2. Pattern Inference Engine

## Goal
Detect reusable UI structures automatically.

## Input
- Figma layout tree
- component hierarchy
- spacing relationships

---

## Detection Logic (v1)

### Heuristics:

#### Hero Pattern
- large text (H1)
- subtext
- button
- vertical stack

#### Card Pattern
- container with padding
- image or icon
- title + description

#### List Pattern
- repeated elements
- consistent spacing

---

## Output

{
  "patterns": [
    {
      "name": "Hero",
      "confidence": 0.92,
      "structure": ["headline", "subheadline", "cta"]
    }
  ]
}

---

## Future (Moat)

- pattern clustering across projects
- learning from usage
- pattern library auto-growth

---

# 3. Validation Engine (UI Linting System)

## Goal
Enforce design system like ESLint enforces code.

---

## Validation Types

### 1. Token Compliance
- no raw values allowed
- must use tokens

### 2. Spacing Rules
- enforce grid (e.g. 8pt)
- detect arbitrary spacing

### 3. Component Integrity
- no custom components outside system
- validate variant usage

### 4. Layout Constraints
- max columns
- responsive rules

### 5. Pattern Compliance
- required elements present
- structure intact

---

## Validation Output

{
  "valid": false,
  "errors": [
    {
      "type": "token_violation",
      "message": "Raw color used instead of token"
    }
  ]
}

---

## Severity Levels

- ERROR → must fix
- WARNING → optional
- INFO → suggestion

---

# 4. Correction Engine

## Flow

1. Detect violation
2. Map to rule
3. Generate fix instruction
4. Re-run generation

---

# 5. System Architecture Summary

Figma → Extractor → Normalizer → Pattern Engine  
→ Rules → Codex → Validation → Fix Loop

---

# 6. Key Differentiation

- Not generation
- Not design tool

System = enforcement + structure + runtime

---

# 7. MVP Focus (Updated)

- token normalization (must-have)
- basic pattern inference (hero/card)
- validation engine (core)

---

# 8. Future Moats

- cross-project pattern learning
- auto rule generation
- design system scoring

