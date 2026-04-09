function collectNodeIds(source) {
  const ids = new Set();
  const pattern = /data-node-id="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids).sort();
}

function buildLayoutMap(nodeIds) {
  const layout = {};
  for (const id of nodeIds) {
    layout[id] = { id };
  }
  return layout;
}

export function parseFigmaExport({ fileKey, nodeId, code = "" } = {}) {
  if (!fileKey) throw new Error("fileKey is required");
  if (!nodeId) throw new Error("nodeId is required");

  const source = String(code);
  const nodeIds = collectNodeIds(source);

  return {
    context: {
      variables: {},
      styles: {},
      components: {},
      layout: buildLayoutMap(nodeIds)
    },
    meta: {
      fileKey,
      nodeId,
      nodeCount: nodeIds.length,
      extractedAt: new Date().toISOString(),
      codeLength: source.length,
      warnings: []
    }
  };
}
