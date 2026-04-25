# DSR Integration Guide

> CI/CD, build tools, and platform integrations.

---

## Table of Contents

- [GitHub Actions](#github-actions)
- [GitLab CI](#gitlab-ci)
- [Docker](#docker)
- [Husky Hooks](#husky-hooks)

---

## GitHub Actions

### Basic Validation Workflow

```yaml
# .github/workflows/design-tokens.yml
name: Design Tokens Validation

on:
  push:
    paths:
      - 'tokens/**'
  pull_request:
    paths:
      - 'tokens/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g deus-in-machina
      - run: dsr validate --input tokens/design-tokens.json --ruleset strict
```

---

## GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate

validate_tokens:
  stage: validate
  image: node:18
  before_script:
    - npm install -g deus-in-machina
  script:
    - dsr validate --input tokens/design-tokens.json --ruleset strict
```

---

## Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
RUN npm install -g deus-in-machina
WORKDIR /app
COPY tokens/ ./tokens/
RUN dsr validate --input tokens/design-tokens.json --ruleset strict
CMD ["dsr", "health"]
```

---

## Husky Hooks

```javascript
// .husky/pre-commit
#!/bin/sh
npx dsr validate --input tokens/design-tokens.json --ruleset strict || exit 1
```

---

_Last updated: 2026-04-26_
