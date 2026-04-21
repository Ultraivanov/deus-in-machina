import { describe, it, expect } from 'vitest';
import {
  normalizeColor,
  normalizeValue,
  normalizeType,
  groupVariablesByPath,
} from '../src/figma/exporter.js';
import {
  parseTokenValue,
  isAlias,
  extractAliasPath,
  parseColor,
  convertToFigmaValue,
  flattenTokens,
} from '../src/figma/importer.js';

describe('Figma Variables Sync', () => {
  describe('Exporter', () => {
    describe('normalizeColor', () => {
      const red = { r: 1, g: 0, b: 0, a: 1 };
      const redAlpha = { r: 1, g: 0, b: 0, a: 0.5 };

      it('should convert RGB to hex', () => {
        expect(normalizeColor(red, 'hex')).toBe('#ff0000');
      });

      it('should convert RGBA to hex8', () => {
        expect(normalizeColor(redAlpha, 'hex')).toBe('#ff000080');
      });

      it('should convert to rgba-css', () => {
        expect(normalizeColor(red, 'rgba-css')).toBe('rgb(255, 0, 0)');
        expect(normalizeColor(redAlpha, 'rgba-css')).toBe('rgba(255, 0, 0, 0.5)');
      });

      it('should convert to rgba-object', () => {
        expect(normalizeColor(red, 'rgba-object')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      });

      it('should convert to hsla-css', () => {
        const green = { r: 0, g: 1, b: 0, a: 1 };
        expect(normalizeColor(green, 'hsla-css')).toBe('hsl(120, 100%, 50%)');
      });

      it('should throw on unsupported color mode', () => {
        expect(() => normalizeColor(red, 'invalid')).toThrow();
      });
    });

    describe('normalizeType', () => {
      it('should map Figma types to DTCG types', () => {
        expect(normalizeType('COLOR')).toBe('color');
        expect(normalizeType('FLOAT')).toBe('number');
        expect(normalizeType('NUMBER')).toBe('number');
        expect(normalizeType('STRING')).toBe('string');
        expect(normalizeType('BOOLEAN')).toBe('boolean');
      });

      it('should handle unknown types', () => {
        expect(normalizeType('UNKNOWN')).toBe('unknown');
      });
    });

    describe('normalizeValue', () => {
      it('should normalize color values', () => {
        const color = { r: 1, g: 0, b: 0 };
        const config = { colorMode: 'hex' };
        expect(normalizeValue(color, 'COLOR', config)).toBe('#ff0000');
      });

      it('should normalize number values', () => {
        expect(normalizeValue(42, 'FLOAT', {})).toBe(42);
        expect(normalizeValue(3.14, 'NUMBER', {})).toBe(3.14);
      });

      it('should normalize string values', () => {
        expect(normalizeValue('hello', 'STRING', {})).toBe('hello');
      });

      it('should normalize boolean values', () => {
        expect(normalizeValue(true, 'BOOLEAN', {})).toBe(true);
        expect(normalizeValue(false, 'BOOLEAN', {})).toBe(false);
      });

      it('should handle aliases with variable map', () => {
        const alias = { type: 'VARIABLE_ALIAS', id: 'var-123' };
        const variableMap = new Map([['var-123', { name: 'color/primary' }]]);
        const config = {};
        expect(normalizeValue(alias, 'COLOR', config, variableMap)).toBe('{color.primary}');
      });

      it('should throw on missing variable map for alias', () => {
        const alias = { type: 'VARIABLE_ALIAS', id: 'var-123' };
        expect(() => normalizeValue(alias, 'COLOR', {})).toThrow('Variable map required');
      });
    });

    describe('groupVariablesByPath', () => {
      it('should group flat paths into nested structure', () => {
        const flat = {
          'color/primary/default': { $value: '#ff0000' },
          'color/primary/hover': { $value: '#cc0000' },
          'spacing/small': { $value: 8 },
        };
        const result = groupVariablesByPath(flat);
        expect(result).toEqual({
          color: {
            primary: {
              default: { $value: '#ff0000' },
              hover: { $value: '#cc0000' },
            },
          },
          spacing: {
            small: { $value: 8 },
          },
        });
      });
    });
  });

  describe('Importer', () => {
    describe('parseTokenValue', () => {
      it('should parse DTCG format', () => {
        const token = {
          $type: 'color',
          $value: '#ff0000',
          $description: 'Primary color',
          $extensions: { mode: {} },
        };
        expect(parseTokenValue(token)).toEqual({
          type: 'color',
          value: '#ff0000',
          description: 'Primary color',
          extensions: { mode: {} },
        });
      });

      it('should parse standard format', () => {
        const token = {
          type: 'number',
          value: 16,
        };
        expect(parseTokenValue(token)).toEqual({
          type: 'number',
          value: 16,
          description: '',
          extensions: undefined,
        });
      });

      it('should return null for non-token objects', () => {
        expect(parseTokenValue({})).toBeNull();
        expect(parseTokenValue({ name: 'test' })).toBeNull();
      });
    });

    describe('isAlias', () => {
      it('should detect alias strings', () => {
        expect(isAlias('{color.primary}')).toBe(true);
        expect(isAlias('{path.to.token}')).toBe(true);
      });

      it('should reject non-alias values', () => {
        expect(isAlias('#ff0000')).toBe(false);
        expect(isAlias(42)).toBe(false);
        expect(isAlias('not an alias')).toBe(false);
        expect(isAlias('{}')).toBe(false);
      });
    });

    describe('extractAliasPath', () => {
      it('should extract path from alias', () => {
        expect(extractAliasPath('{color.primary}')).toBe('color/primary');
        expect(extractAliasPath('{path.deep.token}')).toBe('path/deep/token');
      });
    });

    describe('parseColor', () => {
      it('should parse hex colors', () => {
        expect(parseColor('#ff0000')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
        expect(parseColor('#00ff00')).toEqual({ r: 0, g: 1, b: 0, a: 1 });
        const blueAlpha = parseColor('#0000ff80');
        expect(blueAlpha.r).toBe(0);
        expect(blueAlpha.g).toBe(0);
        expect(blueAlpha.b).toBe(1);
        expect(blueAlpha.a).toBeCloseTo(0.5, 2);
      });

      it('should parse 3-char hex', () => {
        expect(parseColor('#f00')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should parse rgba-css', () => {
        expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
        expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
      });

      it('should parse hsl-css', () => {
        const red = parseColor('hsl(0, 100%, 50%)');
        expect(red.r).toBeCloseTo(1, 1);
        expect(red.g).toBeCloseTo(0, 1);
        expect(red.b).toBeCloseTo(0, 1);
      });

      it('should parse rgba-object', () => {
        expect(parseColor({ r: 255, g: 0, b: 0, a: 1 })).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should parse hsla-object', () => {
        const red = parseColor({ h: 0, s: 100, l: 50, a: 1 });
        expect(red.r).toBeCloseTo(1, 1);
        expect(red.g).toBeCloseTo(0, 1);
        expect(red.b).toBeCloseTo(0, 1);
      });

      it('should return null for invalid colors', () => {
        expect(parseColor('invalid')).toBeNull();
        expect(parseColor('')).toBeNull();
      });
    });

    describe('convertToFigmaValue', () => {
      it('should convert hex to RGB object', () => {
        expect(convertToFigmaValue('#ff0000', 'color')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should convert numbers', () => {
        expect(convertToFigmaValue(42, 'number')).toBe(42);
        expect(convertToFigmaValue('3.14', 'number')).toBe(3.14);
      });

      it('should convert strings', () => {
        expect(convertToFigmaValue('hello', 'string')).toBe('hello');
      });

      it('should convert booleans', () => {
        expect(convertToFigmaValue(true, 'boolean')).toBe(true);
      });

      it('should resolve aliases', () => {
        const variableMap = new Map([['color/primary', { id: 'var-123' }]]);
        const result = convertToFigmaValue('{color.primary}', 'color', variableMap);
        expect(result).toEqual({ type: 'VARIABLE_ALIAS', id: 'var-123' });
      });

      it('should defer unresolved aliases', () => {
        const result = convertToFigmaValue('{missing.token}', 'color');
        expect(result).toEqual({ __alias: 'missing/token', __deferred: true });
      });
    });

    describe('flattenTokens', () => {
      it('should flatten nested token structure', () => {
        const tokens = {
          color: {
            primary: {
              default: { $value: '#ff0000', $type: 'color' },
              hover: { $value: '#cc0000', $type: 'color' },
            },
          },
          spacing: {
            small: { $value: 8, $type: 'number' },
          },
        };
        const result = flattenTokens(tokens);
        expect(result).toHaveLength(3);
        expect(result.map((r) => r.path)).toContain('color/primary/default');
        expect(result.map((r) => r.path)).toContain('color/primary/hover');
        expect(result.map((r) => r.path)).toContain('spacing/small');
      });

      it('should skip $-prefixed meta fields', () => {
        const tokens = {
          $meta: { version: '1.0' },
          color: {
            primary: { $value: '#ff0000', $type: 'color' },
          },
        };
        const result = flattenTokens(tokens);
        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('color/primary');
      });
    });
  });

  describe('Round-trip compatibility', () => {
    it('should maintain color values through export-import cycle', () => {
      const original = { r: 0.5, g: 0.25, b: 0.75, a: 1 };
      const exported = normalizeColor(original, 'hex');
      const imported = parseColor(exported);
      expect(imported.r).toBeCloseTo(original.r, 2);
      expect(imported.g).toBeCloseTo(original.g, 2);
      expect(imported.b).toBeCloseTo(original.b, 2);
      expect(imported.a).toBe(original.a);
    });

    it('should maintain type mappings bidirectionally', () => {
      expect(normalizeType('COLOR')).toBe('color');
      // Note: reverse mapping would be done separately if needed
    });

    it('should handle complex nested structures', () => {
      const flat = {
        'theme/color/brand/primary/default': {
          $type: 'color',
          $value: '#ff0000',
          $extensions: { mode: { light: '#ff0000', dark: '#cc0000' } },
        },
        'theme/color/brand/secondary': {
          $type: 'color',
          $value: '#00ff00',
        },
      };
      const grouped = groupVariablesByPath(flat);
      const flattened = flattenTokens(grouped);
      expect(flattened).toHaveLength(2);
    });
  });
});
