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

export function detectPatterns({ context = {}, options = {} } = {}) {
  const minConfidence = normalizeMinConfidence(options.minConfidence);
  const layoutNodes = collectLayoutNodes(context.layout);
  const patterns = [];

  return {
    patterns,
    meta: {
      detectedCount: patterns.length,
      nodeCount: layoutNodes.length,
      minConfidence
    }
  };
}
