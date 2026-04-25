# DSR FAQ

> Frequently asked questions about Design System Runtime.

---

## General

### What is DSR?

DSR (Design System Runtime) is a runtime layer that enforces structure and consistency across design systems. It bridges the gap between Figma designs and code implementation through automated token normalization, pattern detection, and validation.

### Is DSR free?

Yes, DSR is open source and free under the MIT license.

### What are the requirements?

- Node.js 18+
- Figma API key (for Figma integration)

---

## Installation & Setup

### How do I install DSR?

```bash
npm install -g deus-in-machina
```

Or locally in your project:

```bash
npm install deus-in-machina
```

### Where do I get a Figma API key?

1. Go to [Figma Settings](https://figma.com/settings)
2. Under "Personal Access Tokens", click "Create new token"
3. Copy the token and set it as environment variable:
   ```bash
   export FIGMA_API_KEY=your_token_here
   ```

### How do I verify the installation?

```bash
dsr --version
dsr health
```

---

## Usage

### How do I export tokens from Figma?

```bash
dsr export-variables \
  --file YOUR_FILE_KEY \
  --out tokens.json \
  --color-mode hex
```

### How do I validate tokens?

```bash
dsr validate \
  --input tokens.json \
  --ruleset strict
```

### What rulesets are available?

Built-in presets:
- `strict` — Maximum enforcement
- `relaxed` — Balanced for development
- `minimal` — Only critical issues
- `a11y` — Accessibility-focused
- `performance` — Performance optimization

### How do I create a custom ruleset?

```javascript
import { extendPreset } from 'deus-in-machina/ruleset';

const custom = extendPreset('relaxed', {
  name: 'my-team',
  tokens: { severity: 'error' }
});
```

---

## Privacy & Security

### Is my Figma data sent anywhere?

No. DSR processes Figma data locally. The only external call is to Figma's API using your key.

### Is telemetry enabled by default?

No. Telemetry is opt-in and disabled by default. No usage data is collected unless you explicitly enable it.

```bash
dsr telemetry status  # Check status
```

### How do I report a security issue?

See [SECURITY.md](../SECURITY.md) for security reporting process.

---

## Troubleshooting

### "Command not found" after installation

Add npm global bin to your PATH:

```bash
export PATH="$PATH:$(npm bin -g)"
```

### "Invalid API key" error

1. Check your API key is set:
   ```bash
   echo $FIGMA_API_KEY
   ```
2. Verify the key is valid in Figma settings
3. Ensure the key has access to the file

### High memory usage

For large files, use streaming:

```javascript
import { streamProcessTokens } from 'deus-in-machina/streaming';

await streamProcessTokens('large-file.json', {
  chunkSize: 1000,
  maxMemoryBytes: 100 * 1024 * 1024
});
```

### Tests are failing

1. Ensure Node.js 18+ is installed:
   ```bash
   node --version
   ```
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```

---

## Contributing

### How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### How do I report a bug?

[Open a bug report](../../issues/new?template=bug_report.md)

### How do I request a feature?

[Open a feature request](../../issues/new?template=feature_request.md)

---

## Roadmap

### What's next for DSR?

See [ROADMAP.md](../ROADMAP.md) for upcoming features:
- v0.2.0: GitHub Actions integration
- v0.3.0: VS Code extension
- v0.4.0: Web dashboard

---

_Last updated: 2026-04-26_
