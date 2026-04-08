function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeMinConfidence(raw) {
  if (raw === undefined || raw === null) return 0.7;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return 0.7;
  return clamp(parsed, 0, 1);
}

function collectLayoutNodes(layout) {
  if (!layout) return [];
  if (Array.isArray(layout)) return layout;
  if (typeof layout === "object") {
    return Object.keys(layout);
  }
  return [];
}

function collectLayoutItems(layout) {
  if (!layout) return [];
  if (Array.isArray(layout)) return layout;
  if (typeof layout === "object") return Object.values(layout);
  return [];
}

function normalizeLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractRoles(layoutItems) {
  return layoutItems
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return normalizeLabel(item.role || item.type || item.name || item.id);
    })
    .filter(Boolean);
}

function hasRole(roles, target) {
  return roles.some((role) => role.includes(target));
}

function countRoleMatches(roles, targets) {
  return targets.filter((target) => hasRole(roles, target)).length;
}

function detectHero(layoutItems, roles) {
  const required = ["headline", "subheadline", "cta"];
  const matches = countRoleMatches(roles, required);
  if (matches === 0) return null;
  const confidence = matches / required.length;
  return {
    id: "pattern_hero_01",
    name: "Hero",
    type: "hero",
    confidence: Number(confidence.toFixed(2)),
    structure: required,
    nodes: layoutItems
      .filter((item) => item && required.some((role) => normalizeLabel(item.role || item.type || item.name || item.id).includes(role)))
      .map((item) => item.id || item.name)
      .filter(Boolean),
    metadata: {}
  };
}

function detectCard(layoutItems, roles) {
  const required = ["title", "description"];
  const optional = ["media"];
  const matches = countRoleMatches(roles, required);
  if (matches === 0) return null;
  const hasMedia = hasRole(roles, optional[0]);
  const confidence = (matches + (hasMedia ? 0.2 : 0)) / (required.length + 0.2);
  return {
    id: "pattern_card_01",
    name: "Card",
    type: "card",
    confidence: Number(Math.min(1, confidence).toFixed(2)),
    structure: hasMedia ? [...optional, ...required] : required,
    nodes: layoutItems
      .filter((item) => item && (required.concat(optional)).some((role) => normalizeLabel(item.role || item.type || item.name || item.id).includes(role)))
      .map((item) => item.id || item.name)
      .filter(Boolean),
    metadata: {}
  };
}

function detectList(layoutItems, roles) {
  const itemCount = roles.filter((role) => role.includes("item")).length;
  if (itemCount < 2) return null;
  const confidence = Math.min(1, itemCount / 3);
  return {
    id: "pattern_list_01",
    name: "List",
    type: "list",
    confidence: Number(confidence.toFixed(2)),
    structure: Array.from({ length: itemCount }, () => "item"),
    nodes: layoutItems
      .filter((item) => item && normalizeLabel(item.role || item.type || item.name || item.id).includes("item"))
      .map((item) => item.id || item.name)
      .filter(Boolean),
    metadata: {}
  };
}

export function detectPatterns({ context = {}, options = {} } = {}) {
  const minConfidence = normalizeMinConfidence(options.minConfidence);
  const layoutNodes = collectLayoutNodes(context.layout);
  const layoutItems = collectLayoutItems(context.layout);
  const roles = extractRoles(layoutItems);
  const candidates = [detectHero(layoutItems, roles), detectCard(layoutItems, roles), detectList(layoutItems, roles)].filter(Boolean);
  const patterns = candidates.filter((pattern) => pattern.confidence >= minConfidence);

  return {
    patterns,
    meta: {
      detectedCount: patterns.length,
      nodeCount: layoutNodes.length,
      minConfidence
    }
  };
}
