import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runDir = path.resolve(root, "examples/fixtures/pipeline-run");
const expectedDir = path.resolve(root, "examples/fixtures/pipeline-expected");
const files = ["context.json", "normalized.json", "patterns.json", "validation.json", "fix-loop.json"];

const results = [];
let failed = false;

for (const file of files) {
  const actual = JSON.parse(fs.readFileSync(path.join(runDir, file), "utf8"));
  const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, file), "utf8"));
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ file, pass });
  if (!pass) failed = true;
}

process.stdout.write(
  JSON.stringify(
    {
      pass: !failed,
      results
    },
    null,
    2
  ) + "\n"
);

if (failed) process.exit(1);
