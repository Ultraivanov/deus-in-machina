# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to:

📧 **dmitry.ivanov@example.com** (replace with actual email)

Please include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Possible impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Released**: Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Next scheduled release

### Security Measures in DSR

DSR implements several security measures:

1. **No Hardcoded Secrets**: API keys must be provided via environment variables
2. **Input Sanitization**: All user inputs are validated
3. **Telemetry Opt-in**: Usage data collection is disabled by default
4. **Dependency Scanning**: Automated vulnerability scanning via GitHub Dependabot

### Best Practices for Users

1. **Protect API Keys**: Never commit Figma API keys to version control
   ```bash
   # Use environment variables
   export FIGMA_API_KEY=your_key_here
   ```

2. **Regular Updates**: Keep DSR updated to receive security patches
   ```bash
   npm update -g deus-in-machina
   ```

3. **Audit Dependencies**: Periodically check for vulnerabilities
   ```bash
   npm audit
   ```

## Security-Related Configuration

### Telemetry

Telemetry is **opt-in** and disabled by default. No data is collected without explicit user consent.

```bash
# Check telemetry status
dsr telemetry status

# Telemetry is disabled by default
# Enable only if you want to contribute usage data
dsr telemetry enable
```

### Data Handling

DSR processes the following data:
- Figma file metadata (variables, collections)
- Design tokens (colors, spacing, etc.)
- No personal information is collected

All data processing happens locally unless explicitly configured otherwise.

## Known Security Considerations

### Figma API Token

- Tokens should be treated as secrets
- Use environment variables or secure vaults
- Rotate tokens periodically

### Large File Handling

When processing large Figma files:
- Memory limits are enforced by default
- Streaming is used for files > 100MB
- Temporary files are cleaned up automatically

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.

---

Last updated: 2026-04-26
