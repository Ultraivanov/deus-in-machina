#!/usr/bin/env node
/**
 * DSR Version Management Script
 * Handles semver versioning, git tags, and release preparation
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGE_PATH = join(ROOT, 'package.json');

/**
 * @typedef {'patch' | 'minor' | 'major' | 'prepatch' | 'preminor' | 'premajor' | 'prerelease'} BumpType
 */

/**
 * Parse semver version
 * @param {string} version
 * @returns {{major: number, minor: number, patch: number, prerelease: string[]}}
 */
function parseVersion(version) {
  const clean = version.replace(/^v/, '');
  const [main, pre] = clean.split('-');
  const [major, minor, patch] = main.split('.').map(Number);

  return {
    major: major || 0,
    minor: minor || 0,
    patch: patch || 0,
    prerelease: pre ? pre.split('.') : []
  };
}

/**
 * Format version object to string
 * @param {{major: number, minor: number, patch: number, prerelease: string[]}} version
 * @returns {string}
 */
function formatVersion(version) {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease.length > 0) {
    result += `-${version.prerelease.join('.')}`;
  }
  return result;
}

/**
 * Bump version
 * @param {string} current
 * @param {BumpType} type
 * @param {string} [prereleaseId='beta']
 * @returns {string}
 */
export function bumpVersion(current, type, prereleaseId = 'beta') {
  const version = parseVersion(current);

  switch (type) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      version.prerelease = [];
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      version.prerelease = [];
      break;
    case 'patch':
      version.patch++;
      version.prerelease = [];
      break;
    case 'premajor':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      version.prerelease = [prereleaseId, '0'];
      break;
    case 'preminor':
      version.minor++;
      version.patch = 0;
      version.prerelease = [prereleaseId, '0'];
      break;
    case 'prepatch':
      version.patch++;
      version.prerelease = [prereleaseId, '0'];
      break;
    case 'prerelease':
      if (version.prerelease.length === 0) {
        version.patch++;
        version.prerelease = [prereleaseId, '0'];
      } else {
        const lastIdx = version.prerelease.length - 1;
        const last = version.prerelease[lastIdx];
        const num = parseInt(last, 10);
        if (!isNaN(num)) {
          version.prerelease[lastIdx] = String(num + 1);
        } else {
          version.prerelease.push('0');
        }
      }
      break;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }

  return formatVersion(version);
}

/**
 * Get current version from package.json
 * @returns {string}
 */
export function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
  return pkg.version;
}

/**
 * Update version in package.json
 * @param {string} newVersion
 */
export function updatePackageVersion(newVersion) {
  const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(PACKAGE_PATH, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Create git tag
 * @param {string} version
 */
export function createGitTag(version) {
  const tag = `v${version}`;
  execSync(`git tag -a ${tag} -m "Release ${tag}"`, { cwd: ROOT, stdio: 'inherit' });
  console.log(`Created tag: ${tag}`);
}

/**
 * Push git tag
 * @param {string} version
 */
export function pushGitTag(version) {
  const tag = `v${version}`;
  execSync(`git push origin ${tag}`, { cwd: ROOT, stdio: 'inherit' });
  console.log(`Pushed tag: ${tag}`);
}

/**
 * Get git info
 * @returns {{branch: string, commit: string, tags: string[]}}
 */
export function getGitInfo() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  const tags = execSync('git tag --points-at HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

  return { branch, commit, tags };
}

/**
 * Check if working directory is clean
 * @returns {boolean}
 */
export function isWorkingDirectoryClean() {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf-8' });
    return status.trim() === '';
  } catch {
    return false;
  }
}

/**
 * Get version info for build
 * @returns {{version: string, gitBranch: string, gitCommit: string, buildTime: string}}
 */
export function getBuildInfo() {
  const version = getCurrentVersion();
  const { branch, commit } = getGitInfo();

  return {
    version,
    gitBranch: branch,
    gitCommit: commit,
    buildTime: new Date().toISOString()
  };
}

/**
 * CLI runner
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'get':
      console.log(getCurrentVersion());
      break;

    case 'bump': {
      const type = args[1] || 'patch';
      const current = getCurrentVersion();
      const next = bumpVersion(current, type);
      console.log(`${current} → ${next}`);

      if (args.includes('--apply')) {
        updatePackageVersion(next);
        console.log(`Updated package.json to ${next}`);

        if (args.includes('--tag')) {
          createGitTag(next);
        }
      }
      break;
    }

    case 'info': {
      const info = getBuildInfo();
      const git = getGitInfo();
      console.log('Version:', info.version);
      console.log('Branch:', info.gitBranch);
      console.log('Commit:', info.gitCommit);
      console.log('Build Time:', info.buildTime);
      console.log('Tags:', git.tags.join(', ') || 'none');
      break;
    }

    case 'check': {
      const clean = isWorkingDirectoryClean();
      console.log('Working directory:', clean ? 'clean' : 'dirty');
      if (!clean) {
        process.exit(1);
      }
      break;
    }

    default:
      console.log(`
DSR Version Management

Usage:
  node scripts/version.js get              Get current version
  node scripts/version.js bump [type]      Bump version (dry run)
  node scripts/version.js bump [type] --apply [--tag]  Bump and apply
  node scripts/version.js info             Show version info
  node scripts/version.js check            Check if working dir is clean

Bump types: patch, minor, major, prepatch, preminor, premajor, prerelease
      `.trim());
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  bumpVersion,
  getCurrentVersion,
  updatePackageVersion,
  createGitTag,
  pushGitTag,
  getGitInfo,
  isWorkingDirectoryClean,
  getBuildInfo,
  parseVersion,
  formatVersion
};
