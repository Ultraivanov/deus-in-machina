/**
 * DSR Performance Benchmarks
 * Baseline benchmarks for core operations
 */

import { benchmark, profile, printBenchmark, compareBenchmarks, checkBudget } from '../src/perf.js';
import { exportVariablesToDTCG } from '../src/figma/exporter.js';
import { importTokensToFigma, flattenTokens } from '../src/figma/importer.js';
import { validateUI } from '../src/validator.js';
import { runFixLoop } from '../src/fix-loop.js';

// Performance budgets (adjust based on requirements)
const BUDGETS = {
  exportSmall: { maxDurationMs: 100, maxMemoryBytes: 1024 * 1024 }, // 100ms, 1MB
  exportMedium: { maxDurationMs: 500, maxMemoryBytes: 5 * 1024 * 1024 }, // 500ms, 5MB
  exportLarge: { maxDurationMs: 2000, maxMemoryBytes: 20 * 1024 * 1024 }, // 2s, 20MB
  normalize: { maxDurationMs: 100, maxMemoryBytes: 1024 * 1024 },
  validate: { maxDurationMs: 50, maxMemoryBytes: 512 * 1024 },
  fixLoop: { maxDurationMs: 500, maxMemoryBytes: 2 * 1024 * 1024 },
};

// Mock data generators
function generateMockVariables(count) {
  const variables = [];
  const collections = [{
    id: 'col-1',
    name: 'Colors',
    defaultModeId: 'mode-1',
    modes: [{ modeId: 'mode-1', name: 'Default' }],
  }];

  for (let i = 0; i < count; i++) {
    variables.push({
      id: `var-${i}`,
      name: `color/brand/${i}`,
      variableCollectionId: 'col-1',
      resolvedType: 'COLOR',
      valuesByMode: {
        'mode-1': { r: Math.random(), g: Math.random(), b: Math.random() },
      },
      description: `Color ${i}`,
    });
  }

  return { variables, collections };
}

function generateMockTokens(count) {
  const tokens = {};
  for (let i = 0; i < count; i++) {
    tokens[`token-${i}`] = {
      $type: 'color',
      $value: '#FF5733',
      $description: `Token ${i}`,
    };
  }
  return tokens;
}

// Export benchmarks
async function runExportBenchmarks() {
  console.log('\n=== Export Benchmarks ===\n');

  // Small file (10 variables)
  const smallData = generateMockVariables(10);
  const smallResult = await benchmark('export-small (10 vars)', async () => {
    await exportVariablesToDTCG(smallData.variables, smallData.collections, {
      colorMode: 'hex',
      useDTCGKeys: true,
    });
  }, { iterations: 10, warmupIterations: 2 });

  printBenchmark(smallResult);
  const smallBudget = checkBudget(smallResult, BUDGETS.exportSmall);
  if (!smallBudget.passed) {
    console.warn('   ⚠️ Budget violations:', smallBudget.violations);
  }

  // Medium file (100 variables)
  const mediumData = generateMockVariables(100);
  const mediumResult = await benchmark('export-medium (100 vars)', async () => {
    await exportVariablesToDTCG(mediumData.variables, mediumData.collections, {
      colorMode: 'hex',
      useDTCGKeys: true,
    });
  }, { iterations: 5, warmupIterations: 1 });

  printBenchmark(mediumResult);
  const mediumBudget = checkBudget(mediumResult, BUDGETS.exportMedium);
  if (!mediumBudget.passed) {
    console.warn('   ⚠️ Budget violations:', mediumBudget.violations);
  }

  // Large file (1000 variables)
  const largeData = generateMockVariables(1000);
  const largeResult = await benchmark('export-large (1000 vars)', async () => {
    await exportVariablesToDTCG(largeData.variables, largeData.collections, {
      colorMode: 'hex',
      useDTCGKeys: true,
    });
  }, { iterations: 3, warmupIterations: 1 });

  printBenchmark(largeResult);
  const largeBudget = checkBudget(largeResult, BUDGETS.exportLarge);
  if (!largeBudget.passed) {
    console.warn('   ⚠️ Budget violations:', largeBudget.violations);
  }

  return { small: smallResult, medium: mediumResult, large: largeResult };
}

// Token processing benchmarks
async function runTokenBenchmarks() {
  console.log('\n=== Token Processing Benchmarks ===\n');

  // Flatten tokens
  const tokens = generateMockTokens(100);
  const flattenResult = await benchmark('flatten-tokens (100)', () => {
    flattenTokens(tokens);
  }, { iterations: 50, warmupIterations: 5 });

  printBenchmark(flattenResult);

  return { flatten: flattenResult };
}

// Validation benchmarks
async function runValidationBenchmarks() {
  console.log('\n=== Validation Benchmarks ===\n');

  const testCode = `
    .button {
      color: #FF5733;
      padding: 10px 20px;
      margin: 8px;
    }
    .hero {
      background: #3366FF;
    }
  `;

  const validateResult = await benchmark('validate-ui', () => {
    validateUI({ code: testCode, rules: {} });
  }, { iterations: 20, warmupIterations: 3 });

  printBenchmark(validateResult);
  const budget = checkBudget(validateResult, BUDGETS.validate);
  if (!budget.passed) {
    console.warn('   ⚠️ Budget violations:', budget.violations);
  }

  return { validate: validateResult };
}

// Fix loop benchmarks
async function runFixLoopBenchmarks() {
  console.log('\n=== Fix Loop Benchmarks ===\n');

  const testCode = `
    .button {
      color: #FF5733;
      padding: 10px;
    }
  `;

  const fixLoopResult = await benchmark('fix-loop', async () => {
    await runFixLoop({ code: testCode, rules: {}, maxIterations: 3 });
  }, { iterations: 10, warmupIterations: 2 });

  printBenchmark(fixLoopResult);
  const budget = checkBudget(fixLoopResult, BUDGETS.fixLoop);
  if (!budget.passed) {
    console.warn('   ⚠️ Budget violations:', budget.violations);
  }

  return { fixLoop: fixLoopResult };
}

// Profile a complete workflow
async function runWorkflowProfile() {
  console.log('\n=== Complete Workflow Profile ===\n');

  const { variables, collections } = generateMockVariables(50);

  const { profile: exportProfile } = await profile('export', async () => {
    const tokens = await exportVariablesToDTCG(variables, collections, {
      colorMode: 'hex',
      useDTCGKeys: true,
    });
    return tokens;
  });

  printBenchmark(exportProfile);

  // Simulate processing
  const { profile: processProfile } = await profile('process', async () => {
    // Flatten and validate
    const tokens = await exportVariablesToDTCG(variables, collections, {
      colorMode: 'hex',
      useDTCGKeys: true,
    });
    const flat = flattenTokens(tokens);
    return flat;
  });

  printBenchmark(processProfile);
}

// Main runner
async function main() {
  console.log('🏃 DSR Performance Benchmarks');
  console.log('============================');

  const results = {
    export: await runExportBenchmarks(),
    tokens: await runTokenBenchmarks(),
    validation: await runValidationBenchmarks(),
    fixLoop: await runFixLoopBenchmarks(),
  };

  await runWorkflowProfile();

  // Save results
  const fs = await import('fs');
  const output = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    results,
  };

  fs.writeFileSync('benchmark-results.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Benchmarks complete. Results saved to benchmark-results.json');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, runExportBenchmarks, runTokenBenchmarks, runValidationBenchmarks, runFixLoopBenchmarks };
