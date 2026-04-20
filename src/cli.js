import fs from "node:fs";
import path from "node:path";
import { loadConfig, log } from "./config.js";

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

export function run(argv) {
  const { command, flags } = parseArgs(argv);
  const config = loadConfig(flags);

  if (!command || flags.help) {
    printUsage();
    return;
  }

  if (!COMMANDS.has(command)) {
    log("error", `Unknown command: ${command}`, config);
    printUsage();
    process.exit(1);
  }

  const output = {
    command,
    args: flags,
    status: "stub",
    message: "Command scaffold only. Implementation pending."
  };

  const payload = formatOutput(output, config.format);

  if (flags.out) {
    log("info", `Writing output to ${flags.out}`, config);
    writeOutput(flags.out, payload);
  } else {
    process.stdout.write(payload + "\n");
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
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, payload, "utf8");
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
