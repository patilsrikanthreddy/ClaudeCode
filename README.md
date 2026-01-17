# NetSuite SuiteScript Development Project

This project provides a development environment for NetSuite SuiteScript customizations.

## Project Structure

```
├── src/
│   ├── FileCabinet/
│   │   └── SuiteScripts/     # Compiled JavaScript files for NetSuite
│   └── TypeScripts/           # TypeScript source files
├── test/                      # Test files
└── package.json               # Project dependencies
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build TypeScript files:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Development

- Write your SuiteScript code in `src/TypeScripts/`
- TypeScript files will be compiled to `src/FileCabinet/SuiteScripts/`
- Use the NetSuite SDF CLI for deployment

## Dependencies

See `package.json` for the complete list of dependencies.
