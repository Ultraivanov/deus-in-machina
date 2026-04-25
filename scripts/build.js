#!/usr/bin/env node
/**
 * DSR Build Script
 * Production build with bundling, optimization, and packaging
 */

import { readFileSync, writeFileSync, cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

/**
 * Build configuration
 */
const BUILD_CONFIG = {
  entryPoints: [
    'src/index.js',
    'src/cli.js',
    'src/figma/index.js',
    'src/ruleset/index.js'
  ],
  outDir: DIST,
  target: 'node18',
  format: 'esm'
};

/**
 * Clean dist directory
 */
function clean() {
  console.log('Cleaning dist directory...');
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true });
  }
  mkdirSync(DIST, { recursive: true });
}

/**
 * Copy static files
 */
function copyStatic() {
  console.log('Copying static files...');

  // Create directories
  mkdirSync(join(DIST, 'src', 'ruleset', 'profiles'), { recursive: true });

  // Copy profile JSON files
  const profilesSrc = join(ROOT, 'src', 'ruleset', 'profiles');
  const profilesDst = join(DIST, 'src', 'ruleset', 'profiles');

  if (existsSync(profilesSrc)) {
    cpSync(profilesSrc, profilesDst, { recursive: true });
  }

  // Copy docs
  if (existsSync(join(ROOT, 'docs'))) {
    mkdirSync(join(DIST, 'docs'), { recursive: true });
    cpSync(join(ROOT, 'docs'), join(DIST, 'docs'), { recursive: true });
  }

  // Copy examples
  if (existsSync(join(ROOT, 'examples'))) {
    mkdirSync(join(DIST, 'examples'), { recursive: true });
    cpSync(join(ROOT, 'examples'), join(DIST, 'examples'), { recursive: true });
  }
}

/**
 * Generate build info
 */
async function generateBuildInfo() {
  console.log('Generating build info...');

  const { getBuildInfo } = await import('./version.js');
  const info = getBuildInfo();

  const buildInfo = {
    ...info,
    nodeVersion: process.version,
    platform: process.platform
  };

  writeFileSync(
    join(DIST, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  return buildInfo;
}

/**
 * Create package.json for dist
 */
function createDistPackage() {
  console.log('Creating package.json for dist...');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

  // Remove dev dependencies and scripts
  const distPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main,
    bin: pkg.bin,
    type: pkg.type,
    engines: pkg.engines,
    keywords: pkg.keywords,
    author: pkg.author,
    license: pkg.license,
    repository: pkg.repository,
    bugs: pkg.bugs,
    homepage: pkg.homepage,
    dependencies: pkg.dependencies,
    exports: pkg.exports
  };

  writeFileSync(
    join(DIST, 'package.json'),
    JSON.stringify(distPkg, null, 2)
  );
}

/**
 * Verify build
 */
function verifyBuild() {
  console.log('Verifying build...');

  const checks = [
    'package.json',
    'build-info.json',
    'src'
  ];

  for (const check of checks) {
    const path = join(DIST, check);
    if (!existsSync(path)) {
      throw new Error(`Build verification failed: ${check} not found`);
    }
  }

  console.log('Build verification passed');
}

/**
 * Create tarball
 */
function createTarball() {
  console.log('Creating tarball...');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const name = `${pkg.name.replace('@', '').replace('/', '-')}-v${pkg.version}`;

  // Create tarball
  execSync(`tar -czf ${name}.tar.gz -C ${DIST} .`, {
    cwd: ROOT,
    stdio: 'inherit'
  });

  console.log(`Created: ${name}.tar.gz`);
}

/**
 * Run tests
 */
function runTests() {
  console.log('Running tests...');
  execSync('npm test', { cwd: ROOT, stdio: 'inherit' });
  console.log('Tests passed');
}

/**
 * Full build process
 */
async function build(options = {}) {
  const { skipTests = false, skipTarball = false } = options;

  try {
    // Pre-build checks
    if (!skipTests) {
      runTests();
    }

    // Clean
    clean();

    // Copy source files (no bundling for now, just copy)
    console.log('Copying source files...');
    cpSync(join(ROOT, 'src'), join(DIST, 'src'), { recursive: true });

    // Copy static files
    copyStatic();

    // Generate build info
    const buildInfo = await generateBuildInfo();

    // Create package.json
    createDistPackage();

    // Copy additional files
    const filesToCopy = ['README.md', 'LICENSE', '.npmignore'];
    for (const file of filesToCopy) {
      const src = join(ROOT, file);
      if (existsSync(src)) {
        cpSync(src, join(DIST, file));
      }
    }

    // Verify
    verifyBuild();

    // Create tarball
    if (!skipTarball) {
      createTarball();
    }

    console.log('\n✅ Build complete');
    console.log(`Version: ${buildInfo.version}`);
    console.log(`Commit: ${buildInfo.gitCommit}`);
    console.log(`Build time: ${buildInfo.buildTime}`);

    return buildInfo;
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    process.exit(1);
  }
}

/**
 * CLI runner
 */
function main() {
  const args = process.argv.slice(2);

  const options = {
    skipTests: args.includes('--skip-tests'),
    skipTarball: args.includes('--skip-tarball')
  };

  build(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { build, clean, createTarball };
