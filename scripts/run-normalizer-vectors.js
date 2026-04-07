import fs from "node:fs";
import path from "node:path";
import { normalizeTokens } from "../src/normalizer.js";

const root = process.cwd();
const vectorsDir = path.resolve(root, "examples/fixtures/normalizer-vectors");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getVectorNames() {
  const files = fs.readdirSync(vectorsDir).filter((file) => file.endsWith(".input.json"));
  return files.map((file) => file.replace(".input.json", "")).sort();
}

const vectorNames = getVectorNames();
const results = [];
let failed = false;

for (const name of vectorNames) {
  const inputPath = path.join(vectorsDir, `${name}.input.json`);
  const expectedPath = path.join(vectorsDir, `${name}.expected.json`);
  const actualPath = path.join(vectorsDir, `${name}.actual.json`);

  const input = readJson(inputPath);
  const expected = readJson(expectedPath);
  const actual = normalizeTokens(input.context);

  fs.writeFileSync(actualPath, JSON.stringify(actual, null, 2), "utf8");

  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ vector: name, pass });
  if (!pass) failed = true;
}

process.stdout.write(
  JSON.stringify(
    {
      pass: !failed,
      vectors: results
    },
    null,
    2
  ) + "\n"
);

if (failed) process.exit(1);
