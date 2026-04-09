function replaceHexColors(input) {
  return input.replace(/#(?:[0-9a-fA-F]{3}){1,2}\b/g, "color.primary.default");
}

function normalizeSpacing(input) {
  return input.replace(/(margin|padding)\s*:\s*([0-9]+)px/gi, (match, prop, value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return match;
    const normalized = Math.round(number / 8) * 8;
    return `${prop}: ${normalized}px`;
  });
}

function ensureHeroCta(input) {
  if (!/\bhero\b/i.test(input)) return input;
  if (/\bcta\b/i.test(input)) return input;
  return input.replace(/<\/section>/i, "<button class=\"cta\">Get Started</button></section>");
}

export function fixUI({ code = "", errors = [] } = {}) {
  let output = String(code);
  const errorIds = new Set(errors.map((error) => error.id));

  if (errorIds.has("dsr.token.no-raw-values")) {
    output = replaceHexColors(output);
  }

  if (errorIds.has("dsr.spacing.grid-8pt")) {
    output = normalizeSpacing(output);
  }

  if (errorIds.has("dsr.pattern.hero-missing-cta")) {
    output = ensureHeroCta(output);
  }

  return {
    fixed_code: output
  };
}
