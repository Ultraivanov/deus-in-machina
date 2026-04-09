import fs from "node:fs";
import path from "node:path";
import { parseFigmaExportWithTime } from "../src/adapters/figma-export.js";

const root = process.cwd();
const fixtureDir = path.resolve(root, "examples/fixtures/figma-export");
const inputPath = path.join(fixtureDir, "section-form.input.json");
const expectedPath = path.join(fixtureDir, "section-form.expected.json");
const actualPath = path.join(fixtureDir, "section-form.actual.json");

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const code = fs.readFileSync(path.resolve(root, input.codePath), "utf8");

const actual = parseFigmaExportWithTime({
  fileKey: input.fileKey,
  nodeId: input.nodeId,
  code,
  extractedAt: "FIXTURE"
});
fs.writeFileSync(actualPath, JSON.stringify(actual, null, 2), "utf8");

const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
const pass = JSON.stringify(actual) === JSON.stringify(expected);

process.stdout.write(
  JSON.stringify(
    {
      pass
    },
    null,
    2
  ) + "\n"
);

if (!pass) process.exit(1);
