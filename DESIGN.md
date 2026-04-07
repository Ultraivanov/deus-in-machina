# DESIGN.md

Canonical design contract for DSR/Buildrail UI work.

## Purpose
- Single source of truth for visual rules.
- Used by humans and agents for deterministic UI generation.
- If code conflicts with this file, update code or explicitly update this file first.

## Scope
- Applies to UI tasks (`screen`, `component`, `tokens`, `design_system_update`).
- Out of scope: workflow state logic, monetization policy, billing flows.

## Foundations

### Color tokens
- `color.primary.default`: `#3366FF`
- `color.primary.hover`: `#2952CC`
- `color.text.default`: `#111827`
- `color.text.muted`: `#6B7280`
- `color.background.canvas`: `#FFFFFF`
- `color.background.subtle`: `#F9FAFB`
- `color.border.default`: `#E5E7EB`
- `color.success.default`: `#16A34A`
- `color.warning.default`: `#D97706`
- `color.danger.default`: `#DC2626`

### Typography
- Family: `Inter, system-ui, -apple-system, Segoe UI, sans-serif`
- Heading scale: `32 / 24 / 20`
- Body scale: `16 / 14 / 12`
- Weights: `400`, `500`, `600`, `700`

### Spacing and radius
- Spacing grid: `8pt`
- Allowed spacing tokens: `4, 8, 12, 16, 24, 32, 40, 48`
- Radius tokens: `4, 8, 12, 16`

## Components

### Button
- Variants: `primary`, `secondary`, `ghost`, `danger`
- States: `default`, `hover`, `disabled`, `focus`
- Primary uses `color.primary.*` tokens only.

### Card
- Mandatory structure: `title`, `description`
- Optional: `media`, `actions`
- Card spacing aligns to 8pt grid.

### Form controls
- Input, Select, Textarea must share the same height scale.
- Error state uses `color.danger.default`.

## Layout rules
- Max content width: `1200px`
- Breakpoints: `sm=640`, `md=768`, `lg=1024`, `xl=1280`
- Max columns: `12`
- Use consistent vertical rhythm based on spacing tokens.

## Hard constraints
- No raw color literals in final UI code.
- No ad-hoc spacing values outside token scale.
- No new component variants without contract update.

## Validation outcome model
- `passed`: fully compliant with contract.
- `needs_review`: non-blocking deviations.
- `failed`: blocking violations (`raw colors`, `off-grid spacing`, unknown variants).

## Versioning
- Contract version: `0.1.0`
- Last updated: `2026-04-07`
