# Build Guide

This document outlines the steps to build and publish the ntlm-sso-ory package.

## Prerequisites

- Node.js 16 or higher
- npm 7 or higher
- An npm account with publishing rights to the package

## Development Build

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build the package locally:
   ```bash
   npm run build         # Builds both CJS and ESM versions
   npm run build:cjs    # Builds only CommonJS version
   npm run build:esm    # Builds only ES modules version
   ```

The build output will be in the `dist` directory with separate `cjs` and `esm` subdirectories.

## Publishing to NPM

1. Clean previous builds:
   ```bash
   npm run clean
   ```

2. Ensure all tests pass:
   ```bash
   npm test
   ```

3. Build the package:
   ```bash
   npm run build         # Builds both CJS and ESM versions
   ```

4. Review the package contents:
   ```bash
   npm pack
   ```
   This creates a .tgz file you can inspect before publishing.

5. Publish to NPM:
   ```bash
   npm publish
   ```

## Package Structure

The published package will include:
- `dist/cjs/` - CommonJS modules and TypeScript declaration files
- `dist/esm/` - ES modules and TypeScript declaration files
- `README.md` - Package documentation
- `package.json` - Package metadata and dependencies

## Version Management

1. Update the version in package.json:
   ```bash
   npm version patch  # For bug fixes
   npm version minor  # For new features
   npm version major  # For breaking changes
   ```

2. The `prepublishOnly` script will automatically run the build before publishing.
