import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const matrixPath = path.resolve(root, "docs/release-smoke-matrix.json");
const defaultOutputPath = path.resolve(root, "docs/release-smoke-results.latest.json");
const excerptLimit = 600;

function parseArgs(argv) {
  const flags = {
    out: defaultOutputPath
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) {
      flags.out = path.resolve(root, argv[i + 1]);
      i += 1;
    }
  }

  return flags;
}

function readMatrix(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function trimOutput(value) {
  const text = String(value || "").trim();
  if (text.length <= excerptLimit) {
    return text;
  }

  return `${text.slice(0, excerptLimit)}...`;
}

function runCheck(check) {
  const startedAt = new Date().toISOString();
  const start = process.hrtime.bigint();

  const execution = spawnSync(check.command, check.args || [], {
    cwd: root,
    encoding: "utf8"
  });

  const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  const exitCode = execution.status === null ? 1 : execution.status;
  const passed = exitCode === check.expectedExitCode;

  return {
    id: check.id,
    category: check.category,
    title: check.title,
    command: [check.command, ...(check.args || [])].join(" "),
    expectedExitCode: check.expectedExitCode,
    exitCode,
    passed,
    startedAt,
    durationMs: Number(durationMs.toFixed(3)),
    stdoutExcerpt: trimOutput(execution.stdout),
    stderrExcerpt: trimOutput(execution.stderr),
    expectedBehavior: check.expectedBehavior,
    knownStatus: check.knownStatus,
    failureReason: check.failureReason || null
  };
}

function ensureOutputDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  const matrix = readMatrix(matrixPath);
  const checks = Array.isArray(matrix.checks) ? matrix.checks : [];
  const results = checks.map(runCheck);
  const failedChecks = results.filter((check) => !check.passed);

  const report = {
    version: 1,
    matrixVersion: matrix.version ?? null,
    generatedAt: new Date().toISOString(),
    source: path.relative(root, matrixPath),
    summary: {
      total: results.length,
      passed: results.length - failedChecks.length,
      failed: failedChecks.length
    },
    checks: results
  };

  ensureOutputDir(flags.out);
  fs.writeFileSync(flags.out, JSON.stringify(report, null, 2), "utf8");
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");

  if (failedChecks.length > 0) {
    process.exit(1);
  }
}

main();
