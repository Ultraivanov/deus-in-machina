import fs from "node:fs";
import path from "node:path";
import { loadConfig, log } from "./config.js";
import { ErrorCodes, makeError, logError, withErrorHandling, ensureErrorShape } from "./errors.js";

const COMMANDS = new Set([
  "extract",
  "normalize",
  "patterns",
  "build_landing_spec",
  "generate_ui",
  "validate",
  "fix",
  "loop",
  "export-variables",
  "import-variables"
]);

export async function run(argv) {
  const { command, flags } = parseArgs(argv);
  const config = loadConfig(flags);

  if (!command || flags.help) {
    printUsage();
    return;
  }

  if (!COMMANDS.has(command)) {
    const error = makeError(ErrorCodes.INVALID_INPUT, `Unknown command: ${command}`);
    logError(error, { command, flags });
    printUsage();
    process.exit(1);
  }

  try {
    const output = await executeCommand(command, flags, config);
    const payload = formatOutput(output, config.format);

    if (flags.out) {
      log("info", `Writing output to ${flags.out}`, config);
      writeOutput(flags.out, payload);
    } else {
      process.stdout.write(payload + "\n");
    }
  } catch (err) {
    const errorPayload = ensureErrorShape(err);
    logError(errorPayload, { command, flags });

    const output = {
      command,
      args: flags,
      status: "error",
      error: errorPayload.error,
    };

    const payload = formatOutput(output, config.format);
    process.stderr.write(payload + "\n");
    process.exit(1);
  }
}

/**
 * Execute a CLI command
 * @param {string} command
 * @param {Object} flags
 * @param {Object} config
 * @returns {Promise<Object>}
 */
async function executeCommand(command, flags, config) {
  switch (command) {
    case "export-variables":
      return await executeExportVariables(flags, config);
    case "import-variables":
      return await executeImportVariables(flags, config);
    default:
      // Stub implementation for other commands
      return {
        command,
        args: flags,
        status: "stub",
        message: "Command scaffold only. Implementation pending.",
      };
  }
}

function parseArgs(argv) {
  let command = "";
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!command && !arg.startsWith("--")) {
      command = arg;
      continue;
    }

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }

  return { command, flags };
}

function formatOutput(obj, format) {
  if (format === "yaml") {
    // YAML not implemented in v0; return JSON with a warning.
    return JSON.stringify({
      ...obj,
      warning: "YAML output not implemented; returning JSON."
    }, null, 2);
  }

  return JSON.stringify(obj, null, 2);
}

function writeOutput(outPath, payload) {
  try {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, payload, "utf8");
  } catch (err) {
    throw makeError(
      ErrorCodes.FILE_WRITE_ERROR,
      `Failed to write output to ${outPath}: ${err.message}`,
      { path: outPath }
    );
  }
}

/**
 * Execute export-variables command
 * @param {Object} flags
 * @param {Object} config
 * @returns {Promise<Object>}
 */
async function executeExportVariables(flags, config) {
  const { exportFromFigmaAPI } = await import("./figma/exporter.js");

  if (!flags.file) {
    throw makeError(ErrorCodes.INVALID_INPUT, "Missing required flag: --file");
  }

  const apiKey = process.env.FIGMA_API_KEY;
  if (!apiKey) {
    throw makeError(
      ErrorCodes.CONFIGURATION_ERROR,
      "Missing FIGMA_API_KEY environment variable"
    );
  }

  const exportConfig = {
    colorMode: flags["color-mode"] || "hex",
    useDTCGKeys: true,
    includeFigmaMetaData: flags["include-meta"] || false,
  };

  const tokens = await exportFromFigmaAPI(flags.file, apiKey, exportConfig);

  return {
    command: "export-variables",
    status: "success",
    file: flags.file,
    tokens,
    meta: {
      collectionCount: Object.keys(tokens).length,
    },
  };
}

/**
 * Execute import-variables command
 * @param {Object} flags
 * @param {Object} config
 * @returns {Promise<Object>}
 */
async function executeImportVariables(flags, config) {
  if (!flags.file) {
    throw makeError(ErrorCodes.INVALID_INPUT, "Missing required flag: --file");
  }

  if (!flags.input) {
    throw makeError(ErrorCodes.INVALID_INPUT, "Missing required flag: --input");
  }

  let tokens;
  try {
    const inputContent = fs.readFileSync(flags.input, "utf8");
    tokens = JSON.parse(inputContent);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw makeError(
        ErrorCodes.JSON_PARSE_ERROR,
        `Invalid JSON in ${flags.input}: ${err.message}`,
        { path: flags.input }
      );
    }
    throw makeError(
      ErrorCodes.FILE_READ_ERROR,
      `Failed to read ${flags.input}: ${err.message}`,
      { path: flags.input }
    );
  }

  // Note: Import to Figma requires Plugin API, not REST API
  // This is a limitation we'll document
  return {
    command: "import-variables",
    status: "pending",
    message: "Import requires Figma Plugin API. Use the DSR Figma plugin for import.",
    file: flags.file,
    input: flags.input,
    collection: flags.collection || "default",
    tokenCount: Object.keys(tokens).length,
  };
}

function printUsage() {
  console.log("Deus In Machina (DSR) CLI v0");
  console.log("Usage:");
  console.log("  dsr <command> [--flags]");
  console.log("Commands:");
  console.log("  extract --file <fileKey> [--nodes <id1,id2>] [--out <path>]");
  console.log("  normalize --input <context.json> [--out <path>]");
  console.log("  patterns --input <context.json> [--out <path>]");
  console.log("  build_landing_spec --input <normalized.json> [--out <path>]");
  console.log("  generate_ui --spec <execution.json> [--out <path>]");
  console.log("  validate --code <ui.html> --rules <rules.json> [--out <path>]");
  console.log("  fix --code <ui.html> --errors <errors.json> [--out <path>]");
  console.log("  loop --spec <execution.json> --rules <rules.json> [--out <path>]");
  console.log("  export-variables --file <fileKey> [--out <path>] [--color-mode hex]");
  console.log("  import-variables --file <fileKey> --input <tokens.json> [--collection <name>]");
  console.log("Flags:");
  console.log("  --out <path>         Write output to file");
  console.log("  --format json|yaml   Output format (default: json)");
  console.log("  --log debug|info|warn|error   Log level (default: info)");
  console.log("  --help               Show this help");
}
