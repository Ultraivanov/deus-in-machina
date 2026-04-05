export function loadConfig(flags = {}) {
  const level = flags.log || "info";
  return {
    logLevel: level,
    format: flags.format || "json"
  };
}

export function log(level, message, config) {
  const levels = ["debug", "info", "warn", "error"];
  if (levels.indexOf(level) < levels.indexOf(config.logLevel)) {
    return;
  }

  const line = `[${level}] ${message}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
