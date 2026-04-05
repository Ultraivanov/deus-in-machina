export function extractFigmaContext({ fileKey, nodeIds = [], include = [] } = {}) {
  if (!fileKey) {
    throw new Error("fileKey is required");
  }

  const sections = include.length > 0 ? include : ["variables", "styles", "components", "layout"];

  const context = {
    variables: sections.includes("variables") ? {} : {},
    styles: sections.includes("styles") ? {} : {},
    components: sections.includes("components") ? {} : {},
    layout: sections.includes("layout") ? {} : {}
  };

  return {
    context,
    meta: {
      fileKey,
      nodeIds,
      extractedAt: new Date().toISOString(),
      partial: false,
      warnings: []
    }
  };
}
