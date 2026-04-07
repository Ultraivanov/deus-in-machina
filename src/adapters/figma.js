const DEFAULT_SECTIONS = ["variables", "styles", "components", "layout"];

function normalizeSections(include) {
  if (!Array.isArray(include) || include.length === 0) return DEFAULT_SECTIONS;
  return DEFAULT_SECTIONS.filter((section) => include.includes(section));
}

function mapCollection(input) {
  if (!input) return {};
  if (Array.isArray(input)) {
    const out = {};
    for (const item of input) {
      if (!item || typeof item !== "object") continue;
      const key =
        typeof item.name === "string"
          ? item.name
          : typeof item.id === "string"
            ? item.id
            : undefined;
      if (!key) continue;
      out[key] = item;
    }
    return out;
  }
  if (typeof input === "object") return input;
  return {};
}

export function extractFigmaContext({ fileKey, nodeIds = [], include = [], raw = {} } = {}) {
  if (!fileKey) {
    throw new Error("fileKey is required");
  }

  const sections = normalizeSections(include);

  const context = {
    variables: sections.includes("variables") ? mapCollection(raw.variables) : {},
    styles: sections.includes("styles") ? mapCollection(raw.styles) : {},
    components: sections.includes("components") ? mapCollection(raw.components) : {},
    layout: sections.includes("layout") ? mapCollection(raw.layout) : {}
  };

  return {
    context,
    meta: {
      fileKey,
      nodeIds,
      nodeCount: Array.isArray(nodeIds) ? nodeIds.length : 0,
      include: sections,
      extractedAt: new Date().toISOString(),
      partial: false,
      warnings: []
    }
  };
}
