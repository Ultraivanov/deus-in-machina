import { describe, it, expect } from "vitest";
import packageJson from "../package.json";

describe("package root entrypoint", () => {
  it("exports the core runtime surface", async () => {
    const entrypoint = await import("../src/index.js");

    expect(entrypoint.normalizeTokens).toBeTypeOf("function");
    expect(entrypoint.detectPatterns).toBeTypeOf("function");
    expect(entrypoint.validateUI).toBeTypeOf("function");
    expect(entrypoint.fixUI).toBeTypeOf("function");
    expect(entrypoint.runFixLoop).toBeTypeOf("function");
    expect(entrypoint.extractFigmaContext).toBeTypeOf("function");
    expect(entrypoint.loadRuleset).toBeTypeOf("function");
    expect(entrypoint.default).toMatchObject({
      normalizeTokens: expect.any(Function),
      detectPatterns: expect.any(Function),
      validateUI: expect.any(Function),
      fixUI: expect.any(Function),
      runFixLoop: expect.any(Function),
      extractFigmaContext: expect.any(Function),
      loadRuleset: expect.any(Function)
    });
  });

  it("keeps all declared export targets importable", async () => {
    const exportTargets = Object.values(packageJson.exports);

    for (const target of exportTargets) {
      const module = await import(`..${target.slice(1)}`);
      expect(module).toBeTruthy();
    }
  });
});
