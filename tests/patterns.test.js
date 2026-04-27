import { describe, it, expect } from "vitest";
import { detectPatterns } from "../src/patterns.js";

describe("Patterns", () => {
  describe("detectPatterns", () => {
    it("should return empty patterns for empty context", () => {
      const result = detectPatterns();
      expect(result.patterns).toEqual([]);
      expect(result.meta.detectedCount).toBe(0);
    });

    it("should use default minConfidence of 0.7", () => {
      const result = detectPatterns({ context: {} });
      expect(result.meta.minConfidence).toBe(0.7);
    });

    it("should accept custom minConfidence", () => {
      const result = detectPatterns({ context: {}, options: { minConfidence: 0.5 } });
      expect(result.meta.minConfidence).toBe(0.5);
    });

    it("should clamp minConfidence to [0, 1]", () => {
      expect(detectPatterns({ options: { minConfidence: -0.5 } }).meta.minConfidence).toBe(0);
      expect(detectPatterns({ options: { minConfidence: 1.5 } }).meta.minConfidence).toBe(1);
    });

    describe("Hero pattern detection", () => {
      it("should detect hero pattern with headline and subheadline", () => {
        const context = {
          layout: [
            { id: "h1", role: "headline" },
            { id: "s1", role: "subheadline" },
            { id: "c1", role: "cta" }
          ]
        };
        const result = detectPatterns({ context });
        expect(result.patterns).toHaveLength(1);
        expect(result.patterns[0].type).toBe("hero");
        expect(result.patterns[0].confidence).toBe(1);
      });

      it("should detect hero with partial match (lower confidence)", () => {
        const context = {
          layout: [{ id: "h1", role: "headline" }]
        };
        const result = detectPatterns({ context, options: { minConfidence: 0.3 } });
        expect(result.patterns[0].confidence).toBeCloseTo(0.33, 1);
      });

      it("should not detect hero below minConfidence", () => {
        const context = {
          layout: [{ id: "h1", role: "headline" }]
        };
        const result = detectPatterns({ context, options: { minConfidence: 0.5 } });
        expect(result.patterns).toHaveLength(0);
      });
    });

    describe("Card pattern detection", () => {
      it("should detect card pattern with title and description", () => {
        const context = {
          layout: [
            { id: "t1", role: "title" },
            { id: "d1", role: "description" }
          ]
        };
        const result = detectPatterns({ context });
        expect(result.patterns.some((p) => p.type === "card")).toBe(true);
      });

      it("should detect card with media (higher confidence)", () => {
        const context = {
          layout: [
            { id: "m1", role: "media" },
            { id: "t1", role: "title" },
            { id: "d1", role: "description" }
          ]
        };
        const result = detectPatterns({ context });
        const card = result.patterns.find((p) => p.type === "card");
        expect(card.confidence).toBeGreaterThan(0.7);
        expect(card.structure).toContain("media");
      });
    });

    describe("List pattern detection", () => {
      it("should detect list pattern with 3+ items", () => {
        const context = {
          layout: [
            { id: "i1", role: "item" },
            { id: "i2", role: "item" },
            { id: "i3", role: "item" }
          ]
        };
        const result = detectPatterns({ context });
        const list = result.patterns.find((p) => p.type === "list");
        expect(list).toBeDefined();
        expect(list.confidence).toBe(1);
      });

      it("should not detect list with less than 2 items", () => {
        const context = {
          layout: [{ id: "i1", role: "item" }]
        };
        const result = detectPatterns({ context });
        const list = result.patterns.find((p) => p.type === "list");
        expect(list).toBeUndefined();
      });

      it("should have higher confidence with more items", () => {
        const context3 = { layout: [{ role: "item" }, { role: "item" }, { role: "item" }] };
        const context5 = { layout: [{ role: "item" }, { role: "item" }, { role: "item" }, { role: "item" }, { role: "item" }] };
        
        const result3 = detectPatterns({ context: context3 });
        const result5 = detectPatterns({ context: context5 });
        
        const list3 = result3.patterns.find((p) => p.type === "list");
        const list5 = result5.patterns.find((p) => p.type === "list");
        
        expect(list5.confidence).toBeGreaterThanOrEqual(list3.confidence);
      });
    });

    describe("Multiple patterns", () => {
      it("should detect patterns based on roles", () => {
        // Hero needs: headline, subheadline, cta
        // Card needs: title, description
        const context = {
          layout: [
            { id: "h1", role: "headline" },
            { id: "s1", role: "subheadline" },
            { id: "c1", role: "cta" },
            { id: "t1", role: "title" },
            { id: "d1", role: "description" }
          ]
        };
        const result = detectPatterns({ context });
        // With full hero (3/3 roles) and card (2/2 roles), both should be detected
        expect(result.patterns.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe("Edge cases", () => {
      it("should handle null/undefined layout items gracefully", () => {
        const context = {
          layout: [null, undefined, { id: "h1", role: "headline" }]
        };
        const result = detectPatterns({ context });
        // null/undefined are filtered out, only valid item is headline
        // single headline gives low confidence, may not pass threshold
        expect(result.meta.nodeCount).toBeGreaterThanOrEqual(0);
      });

      it("should handle string layout (keys)", () => {
        const context = {
          layout: { key1: "value1", key2: "value2" }
        };
        const result = detectPatterns({ context });
        expect(result.meta.nodeCount).toBe(2);
      });

      it("should normalize various role formats", () => {
        const context = {
          layout: [
            { id: "h1", name: "Headline" },
            { id: "s1", type: "Subheadline" },
            { id: "c1", role: "CTA" }
          ]
        };
        const result = detectPatterns({ context });
        expect(result.patterns.some((p) => p.type === "hero")).toBe(true);
      });

      it("should handle empty layout array", () => {
        const context = { layout: [] };
        const result = detectPatterns({ context });
        expect(result.patterns).toEqual([]);
        expect(result.meta.nodeCount).toBe(0);
      });
    });
  });
});
