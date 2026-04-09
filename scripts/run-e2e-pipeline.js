import fs from "node:fs";
import path from "node:path";
import { parseFigmaExportWithTime } from "../src/adapters/figma-export.js";
import { normalizeTokens } from "../src/normalizer.js";
import { detectPatterns } from "../src/patterns.js";
import { validateUI } from "../src/validator.js";
import { runFixLoop } from "../src/fix-loop.js";

const root = process.cwd();
const fixtureDir = path.resolve(root, "examples/fixtures/figma-export");
const runDir = path.resolve(root, "examples/fixtures/pipeline-run");

const input = JSON.parse(fs.readFileSync(path.join(fixtureDir, "section-form.input.json"), "utf8"));
const code = fs.readFileSync(path.resolve(root, input.codePath), "utf8");

const exportResult = parseFigmaExportWithTime({
  fileKey: input.fileKey,
  nodeId: input.nodeId,
  code,
  extractedAt: "FIXTURE"
});

const normalized = normalizeTokens(exportResult.context);
const patterns = detectPatterns({ context: exportResult.context, options: { minConfidence: 0.5 } });
const validation = validateUI({ code, rules: {} });
const fixLoop = runFixLoop({ code, rules: {}, maxIterations: 3 });

fs.writeFileSync(path.join(runDir, "context.json"), JSON.stringify(exportResult, null, 2));
fs.writeFileSync(path.join(runDir, "normalized.json"), JSON.stringify(normalized, null, 2));
fs.writeFileSync(path.join(runDir, "patterns.json"), JSON.stringify(patterns, null, 2));
fs.writeFileSync(path.join(runDir, "validation.json"), JSON.stringify(validation, null, 2));
fs.writeFileSync(path.join(runDir, "fix-loop.json"), JSON.stringify(fixLoop, null, 2));

process.stdout.write(
  JSON.stringify(
    {
      status: "ok",
      outputs: ["context.json", "normalized.json", "patterns.json", "validation.json", "fix-loop.json"]
    },
    null,
    2
  ) + "\n"
);
