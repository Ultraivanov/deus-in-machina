import fs from "node:fs";
import path from "node:path";
import { extractFigmaContext } from "../src/adapters/figma.js";

const root = process.cwd();
const fixtureInputPath = path.resolve(root, "examples/fixtures/figma-input.json");
const fixtureExpectedPath = path.resolve(root, "examples/fixtures/figma-context.expected.json");
const fixtureOutputPath = path.resolve(root, "examples/fixtures/figma-context.actual.json");

const input = JSON.parse(fs.readFileSync(fixtureInputPath, "utf8"));
const expected = JSON.parse(fs.readFileSync(fixtureExpectedPath, "utf8"));
const actual = extractFigmaContext(input);

fs.writeFileSync(fixtureOutputPath, JSON.stringify(actual, null, 2), "utf8");

const actualForCheck = {
  context: actual.context,
  metaShape: {
    fileKey: actual.meta.fileKey,
    nodeCount: actual.meta.nodeCount,
    include: actual.meta.include,
    partial: actual.meta.partial,
    warnings: actual.meta.warnings
  }
};

const pass = JSON.stringify(actualForCheck) === JSON.stringify(expected);

process.stdout.write(
  JSON.stringify(
    {
      pass,
      output: path.relative(root, fixtureOutputPath)
    },
    null,
    2
  ) + "\n"
);

if (!pass) {
  process.exit(1);
}
