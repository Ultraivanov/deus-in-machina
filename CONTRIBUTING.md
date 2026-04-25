# Contributing to DSR

Thank you for your interest in contributing to Deus In Machina (DSR)! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Accept differing viewpoints

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a branch** for your changes
4. **Make your changes** following our guidelines
5. **Submit a pull request**

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/deus-in-machina.git
cd deus-in-machina
git checkout -b feature/my-feature
```

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 8
- Git

### Installation

```bash
npm install
```

### Verify Setup

```bash
npm test
```

All tests should pass before you make changes.

## Making Changes

### Branch Naming

- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `test/` — Test improvements

Examples:
- `feature/figma-variable-sync`
- `fix/color-normalization`
- `docs/api-examples`

### Code Style

- Use ES modules (`import`/`export`)
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use meaningful variable names

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Code style (formatting)
- `refactor` — Code refactoring
- `test` — Tests
- `chore` — Maintenance

Examples:
```
feat(figma): add batch export support
fix(validator): handle null values correctly
docs(api): add streaming examples
test(metrics): add counter tests
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npm test -- tests/figma-sync.test.js

# With coverage
npm test -- --coverage
```

### Writing Tests

- Add tests for new features
- Update tests for bug fixes
- Follow existing test patterns
- Aim for high coverage

Test structure:
```javascript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = process(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Checklist

Before submitting:
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Tests updated for bug fixes
- [ ] No test warnings

## Documentation

### Code Documentation

Add JSDoc for public APIs:

```javascript
/**
 * Export variables from Figma
 * @param {string} fileKey - Figma file key
 * @param {string} apiKey - Figma API token
 * @param {Object} config - Export configuration
 * @returns {Promise<Object>} Exported variables
 */
export async function exportFromFigma(fileKey, apiKey, config) {
  // ...
}
```

### Guide Documentation

When adding features, update relevant guides:

- `docs/api-reference.md` — API documentation
- `docs/quick-start.md` — Getting started
- `docs/performance.md` — Performance notes
- `docs/observability.md` — Observability info

### README Updates

Update README.md for:
- New features
- Breaking changes
- New examples

## Submitting Changes

### Pull Request Process

1. **Update documentation** for your changes
2. **Add tests** for new functionality
3. **Run all tests** and ensure they pass
4. **Update CHANGELOG.md** under `[Unreleased]`
5. **Submit PR** with clear description

### PR Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts
- [ ] Code follows style guide

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Breaking change

## Testing
- [ ] Tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## Release Process

### Version Bumping

```bash
# Patch (bug fixes)
npm run version:bump patch -- --apply

# Minor (features)
npm run version:bump minor -- --apply

# Major (breaking)
npm run version:bump major -- --apply
```

### Creating Release

```bash
# 1. Ensure all tests pass
npm test

# 2. Build
npm run build

# 3. Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

GitHub Actions will:
- Run tests
- Build artifacts
- Create GitHub Release
- Publish to npm

## Development Tips

### Project Structure

```
├── bin/           # CLI entry points
├── src/           # Source code
│   ├── figma/     # Figma integration
│   ├── ruleset/   # Rules and presets
│   └── *.js       # Core modules
├── tests/         # Test files
├── docs/          # Documentation
├── examples/      # Example projects
└── scripts/       # Build scripts
```

### Debugging

Enable debug mode:

```javascript
import { enableDebug } from './src/debug.js';

enableDebug({ verbose: true, trace: true });
```

### Useful Commands

```bash
# Run specific test
npm test -- tests/logger.test.js

# Check test coverage
npm test -- --coverage

# Build for release
npm run build

# Get current version
npm run version:get
```

## Questions?

- 💬 [Discussions](https://github.com/Ultraivanov/deus-in-machina/discussions)
- 🐛 [Issues](https://github.com/Ultraivanov/deus-in-machina/issues)

Thank you for contributing!

---

_Last updated: 2026-04-26_
