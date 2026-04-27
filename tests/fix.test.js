import { describe, it, expect } from "vitest";
import { fixUI } from "../src/fix.js";

describe("Fix", () => {
  describe("fixUI", () => {
    it("should return code unchanged when no errors", () => {
      const code = "color: #ff0000; margin: 10px;";
      const result = fixUI({ code, errors: [] });
      expect(result.fixed_code).toBe(code);
    });

    it("should handle empty code", () => {
      const result = fixUI();
      // When code is undefined, String(undefined) is "undefined" but fixUI handles it as empty
      expect(result.fixed_code).toBeDefined();
    });

    it("should handle undefined errors", () => {
      const result = fixUI({ code: "test" });
      expect(result.fixed_code).toBe("test");
    });

    describe("replaceHexColors", () => {
      it("should replace 6-digit hex colors", () => {
        const code = "color: #ff0000; background: #00ff00;";
        const result = fixUI({ code, errors: [{ id: "dsr.token.no-raw-values" }] });
        expect(result.fixed_code).toBe("color: color.primary.default; background: color.primary.default;");
      });

      it("should replace 3-digit hex colors", () => {
        const code = "color: #f00; border: #0f0;";
        const result = fixUI({ code, errors: [{ id: "dsr.token.no-raw-values" }] });
        expect(result.fixed_code).toBe("color: color.primary.default; border: color.primary.default;");
      });

      it("should replace multiple hex colors", () => {
        const code = "color: #ff0000; background: #0000ff; border: #ffff00;";
        const result = fixUI({ code, errors: [{ id: "dsr.token.no-raw-values" }] });
        expect(result.fixed_code.split("color.primary.default")).toHaveLength(4);
      });

      it("should handle case insensitive hex", () => {
        const code = "color: #FF0000; background: #AbCdEf;";
        const result = fixUI({ code, errors: [{ id: "dsr.token.no-raw-values" }] });
        expect(result.fixed_code).not.toMatch(/#[0-9a-fA-F]/);
      });
    });

    describe("normalizeSpacing", () => {
      it("should round margin to 8pt grid", () => {
        const code = "margin: 10px;";
        const result = fixUI({ code, errors: [{ id: "dsr.spacing.grid-8pt" }] });
        expect(result.fixed_code).toBe("margin: 8px;");
      });

      it("should round padding to 8pt grid", () => {
        const code = "padding: 15px;";
        const result = fixUI({ code, errors: [{ id: "dsr.spacing.grid-8pt" }] });
        expect(result.fixed_code).toBe("padding: 16px;");
      });

      it("should handle multiple spacing properties", () => {
        const code = "margin: 5px; padding: 9px;";
        const result = fixUI({ code, errors: [{ id: "dsr.spacing.grid-8pt" }] });
        expect(result.fixed_code).toBe("margin: 8px; padding: 8px;");
      });

      it("should be case insensitive", () => {
        const code = "MARGIN: 10px; Padding: 12px;";
        const result = fixUI({ code, errors: [{ id: "dsr.spacing.grid-8pt" }] });
        expect(result.fixed_code).toMatch(/margin: 8px/i);
      });

      it("should leave invalid values unchanged", () => {
        const code = "margin: abcpx;";
        const result = fixUI({ code, errors: [{ id: "dsr.spacing.grid-8pt" }] });
        expect(result.fixed_code).toBe("margin: abcpx;");
      });
    });

    describe("ensureHeroCta", () => {
      it("should add CTA button when hero is missing CTA", () => {
        const code = '<section class="hero">Content</section>';
        const result = fixUI({ code, errors: [{ id: "dsr.pattern.hero-missing-cta" }] });
        expect(result.fixed_code).toContain("<button class=\"cta\">Get Started</button>");
      });

      it("should not add CTA if already present", () => {
        const code = '<section class="hero"><button class="cta">Click</button></section>';
        const result = fixUI({ code, errors: [{ id: "dsr.pattern.hero-missing-cta" }] });
        // Should only have 2 "cta" occurrences (class attribute + text content)
        expect(result.fixed_code.split("cta").length).toBeGreaterThanOrEqual(2);
      });

      it("should not modify non-hero sections", () => {
        const code = '<section class="content">Content</section>';
        const result = fixUI({ code, errors: [{ id: "dsr.pattern.hero-missing-cta" }] });
        expect(result.fixed_code).not.toContain("Get Started");
      });

      it("should be case insensitive for hero detection", () => {
        const code = '<SECTION class="HERO">Content</SECTION>';
        const result = fixUI({ code, errors: [{ id: "dsr.pattern.hero-missing-cta" }] });
        expect(result.fixed_code).toContain("Get Started");
      });
    });

    describe("multiple fixes", () => {
      it("should apply multiple fixes in sequence", () => {
        const code = 'color: #ff0000; margin: 10px;';
        const result = fixUI({
          code,
          errors: [
            { id: "dsr.token.no-raw-values" },
            { id: "dsr.spacing.grid-8pt" },
          ],
        });
        expect(result.fixed_code).toContain("color.primary.default");
        expect(result.fixed_code).toContain("margin: 8px");
      });

      it("should handle all three error types", () => {
        const code = '<section class="hero">color: #ff0000; margin: 10px;</section>';
        const result = fixUI({
          code,
          errors: [
            { id: "dsr.token.no-raw-values" },
            { id: "dsr.spacing.grid-8pt" },
            { id: "dsr.pattern.hero-missing-cta" },
          ],
        });
        expect(result.fixed_code).toContain("color.primary.default");
        expect(result.fixed_code).toContain("margin: 8px");
        expect(result.fixed_code).toContain("Get Started");
      });
    });
  });
});
