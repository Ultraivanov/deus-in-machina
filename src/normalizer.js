const KNOWN_CATEGORIES = new Map([
  ["color", "color"],
  ["colors", "color"],
  ["spacing", "space"],
  ["space", "space"],
  ["typography", "typography"],
  ["radius", "radius"],
  ["shadow", "shadow"],
  ["motion", "motion"]
]);

const KNOWN_STATES = new Set(["default", "hover", "disabled", "focus", "active"]);
const KNOWN_ROLES = new Set(["primary", "secondary", "neutral", "background", "text"]);

function splitSegments(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[/\-_\\.\s]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
}

function inferCategory(segments, rawType) {
  const fromName = KNOWN_CATEGORIES.get(segments[0]);
  if (fromName) return fromName;
  const fromType = KNOWN_CATEGORIES.get(String(rawType || "").toLowerCase());
  return fromType || "custom";
}

function inferRole(segments) {
  for (let i = 1; i < segments.length; i++) {
    const candidate = segments[i];
    if (!candidate || KNOWN_STATES.has(candidate) || /^\d+$/.test(candidate)) continue;
    if (KNOWN_ROLES.has(candidate)) return candidate;
  }
  for (let i = 1; i < segments.length; i++) {
    const candidate = segments[i];
    if (!candidate || KNOWN_STATES.has(candidate) || /^\d+$/.test(candidate)) continue;
    return candidate;
  }
  return "base";
}

function inferScale(segments) {
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segments[i])) return segments[i];
  }
  return undefined;
}

function inferState(segments) {
  for (const segment of segments) {
    if (KNOWN_STATES.has(segment)) return segment;
  }
  return undefined;
}

function buildToken(parts) {
  const out = [parts.category, parts.role];
  if (parts.scale) out.push(parts.scale);
  if (parts.state) out.push(parts.state);
  return out.join(".");
}

function isAlreadySemantic(sourceName) {
  return /^[a-z]+(\.[a-z0-9]+)+$/.test(sourceName.trim());
}

function resolvePriority(parts, sourceName) {
  let score = 0;
  if (isAlreadySemantic(sourceName)) score += 8;
  if (parts.role && parts.role !== "base" && parts.state) score += 4;
  if (parts.role && parts.role !== "base" && parts.scale) score += 3;
  if (parts.role && parts.role !== "base") score += 2;
  return score;
}

function collectEntries(context) {
  const vars = context && typeof context.variables === "object" ? context.variables : {};
  const styles = context && typeof context.styles === "object" ? context.styles : {};
  const entries = [];

  for (const [name, value] of Object.entries(vars)) {
    const type = value && typeof value === "object" ? value.type : undefined;
    const rawValue = value && typeof value === "object" && "value" in value ? value.value : value;
    entries.push({ sourceName: name, rawValue, rawType: type });
  }
  for (const [name, value] of Object.entries(styles)) {
    entries.push({ sourceName: name, rawValue: value, rawType: "typography" });
  }

  return entries.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
}

export function normalizeTokens(context = {}) {
  const entries = collectEntries(context);
  const tokens = {};
  const tokenMeta = {};
  let collisionsResolved = 0;

  for (const entry of entries) {
    const segments = splitSegments(entry.sourceName);
    const category = inferCategory(segments, entry.rawType);
    const role = inferRole(segments);
    const scale = inferScale(segments);
    const state = inferState(segments);
    const parts = { category, role, scale, state };
    const token = buildToken(parts);
    const score = resolvePriority(parts, entry.sourceName);

    if (!(token in tokens)) {
      tokens[token] = entry.rawValue;
      tokenMeta[token] = { sourceName: entry.sourceName, score };
      continue;
    }

    const current = tokenMeta[token];
    const shouldReplace =
      score > current.score ||
      (score === current.score && entry.sourceName.localeCompare(current.sourceName) < 0);
    if (shouldReplace) {
      tokens[token] = entry.rawValue;
      tokenMeta[token] = { sourceName: entry.sourceName, score };
      collisionsResolved += 1;
    }
  }

  return {
    normalized_context: {
      tokens,
      meta: {
        sourceCount: entries.length,
        normalizedCount: Object.keys(tokens).length,
        collisionsResolved
      }
    }
  };
}
