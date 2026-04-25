# DSR Installation Guide

> How to install and set up DSR (Design System Runtime).

---

## Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (comes with Node.js)

Verify your Node.js version:

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

---

## Installation Methods

### 1. npm (Recommended)

Install DSR globally to use the CLI from anywhere:

```bash
npm install -g deus-in-machina
```

Or install locally in your project:

```bash
npm install deus-in-machina
```

### 2. From Source

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ultraivanov/deus-in-machina.git
cd deus-in-machina
npm install
npm link  # Makes 'dsr' command available globally
```

### 3. Binary Release

Download the latest release tarball from [GitHub Releases](https://github.com/Ultraivanov/deus-in-machina/releases):

```bash
# Download and extract
curl -L -o dsr.tar.gz https://github.com/Ultraivanov/deus-in-machina/releases/download/v0.1.0/deus-in-machina-v0.1.0.tar.gz
tar -xzf dsr.tar.gz

# Link binary
ln -s $(pwd)/bin/dsr.js /usr/local/bin/dsr
```

---

## Verification

Verify the installation:

```bash
# Check version
dsr --version

# Check health
dsr health

# Run a simple command
dsr help
```

---

## Configuration

### Figma API Token

To use Figma integration, set your API token:

```bash
export FIGMA_API_KEY=your_token_here
```

Or add to your shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
echo 'export FIGMA_API_KEY=your_token_here' >> ~/.bashrc
```

### DSR Configuration

Create a config file in your project:

```bash
# Create dsr.config.js
module.exports = {
  ruleset: 'strict',
  logLevel: 'info',
  telemetry: false
};
```

### Telemetry

DSR telemetry is opt-in and disabled by default. To enable:

```bash
dsr telemetry enable
```

To check status:

```bash
dsr telemetry status
```

---

## Updating

### npm

```bash
npm update -g deus-in-machina
```

### From Source

```bash
cd deus-in-machina
git pull origin main
npm install
```

---

## Uninstallation

### npm

```bash
npm uninstall -g deus-in-machina
```

### From Source

```bash
cd deus-in-machina
npm unlink
cd ..
rm -rf deus-in-machina
```

---

## Troubleshooting

### Command not found

If `dsr` is not found after installation:

```bash
# Check npm global bin location
npm bin -g

# Add to PATH if needed
export PATH="$PATH:$(npm bin -g)"
```

### Permission errors

On Linux/macOS, you may need sudo for global installation:

```bash
sudo npm install -g deus-in-machina
```

Or change npm's default directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Node version issues

If you see "Node.js version must be >= 18":

```bash
# Using nvm (Node Version Manager)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

## Next Steps

- Read the [Quick Start Guide](./quick-start.md)
- Learn about [Rule Packs](./rule-packs.md)
- Explore [Observability](./observability.md)

---

_Last updated: 2026-04-26_
