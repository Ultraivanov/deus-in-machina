function collectNodeIds(source) {
  const ids = new Set();
  const pattern = /data-node-id="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids).sort();
}

function collectNodeEntries(source) {
  const entries = [];
  const pattern = /<[^>]*data-node-id="([^"]+)"[^>]*>/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const tag = match[0];
    const nameMatch = /data-name="([^"]+)"/.exec(tag);
    entries.push({ id: match[1], name: nameMatch ? nameMatch[1] : "" });
  }
  return entries;
}

function buildLayoutMap(entries) {
  const layout = {};
  for (const entry of entries) {
    layout[entry.id] = { id: entry.id, name: entry.name, type: "node" };
  }
  return layout;
}

function collectComponents(entries) {
  const components = {};
  for (const entry of entries) {
    if (!entry.name) continue;
    const lowered = entry.name.toLowerCase();
    if (!lowered.includes("input") && !lowered.includes("card") && !lowered.includes("feature") && !lowered.includes("form")) {
      continue;
    }
    components[entry.name] = { id: entry.id };
  }
  return components;
}

function collectVariables(source) {
  const variables = {};
  const hexPattern = /#([0-9a-fA-F]{3,6})\b/g;
  let match;
  while ((match = hexPattern.exec(source)) !== null) {
    const hex = `#${match[1].toUpperCase()}`;
    const key = `Color/Hex/${match[1].toUpperCase()}`;
    if (!variables[key]) variables[key] = { name: key, value: hex, type: "color" };
  }
  return variables;
}

function collectStyles(source) {
  const styles = {};
  const fontPattern = /font-\['([^']+)'/g;
  const sizePattern = /text-\[(\d+)px\]/g;
  const leadingPattern = /leading-\[([0-9.]+)\]/g;
  const trackingPattern = /tracking-\[(-?[0-9.]+)px\]/g;

  const fonts = new Set();
  const sizes = new Set();
  const leadings = new Set();
  const trackings = new Set();

  let match;
  while ((match = fontPattern.exec(source)) !== null) fonts.add(match[1]);
  while ((match = sizePattern.exec(source)) !== null) sizes.add(match[1]);
  while ((match = leadingPattern.exec(source)) !== null) leadings.add(match[1]);
  while ((match = trackingPattern.exec(source)) !== null) trackings.add(match[1]);

  let index = 0;
  for (const font of fonts) {
    styles[`text/font/${index}`] = { fontFamily: font };
    index += 1;
  }
  index = 0;
  for (const size of sizes) {
    styles[`text/size/${index}`] = { fontSize: Number(size) };
    index += 1;
  }
  index = 0;
  for (const leading of leadings) {
    styles[`text/leading/${index}`] = { lineHeight: Number(leading) };
    index += 1;
  }
  index = 0;
  for (const tracking of trackings) {
    styles[`text/tracking/${index}`] = { letterSpacing: Number(tracking) };
    index += 1;
  }

  return styles;
}

export function parseFigmaExport({ fileKey, nodeId, code = "" } = {}) {
  if (!fileKey) throw new Error("fileKey is required");
  if (!nodeId) throw new Error("nodeId is required");

  const source = String(code);
  const nodeIds = collectNodeIds(source);
  const entries = collectNodeEntries(source);

  return {
    context: {
      variables: collectVariables(source),
      styles: collectStyles(source),
      components: collectComponents(entries),
      layout: buildLayoutMap(entries.length ? entries : nodeIds.map((id) => ({ id, name: "" })))
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
