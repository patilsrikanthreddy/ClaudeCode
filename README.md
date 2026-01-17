# NetSuite SuiteScript Development Project

This project provides a development environment for NetSuite SuiteScript customizations with comprehensive PO/Check number validation.

## Features

- ✅ **Duplicate PO Validation** - Prevents duplicate PO/Check numbers on Sales Orders
- ✅ **PO Format Validation** - Validates Purchase Order number format and uniqueness
- ✅ **Auto-Generation** - Automatically generates sequential PO numbers
- ✅ **Client & Server Validation** - Dual-layer validation for better UX and security
- ✅ **TypeScript Support** - Type-safe SuiteScript development
- ✅ **Configurable Patterns** - Multiple validation patterns (Default, Simple, Strict)

## Project Structure

```
├── src/
│   ├── FileCabinet/
│   │   └── SuiteScripts/                     # JavaScript files for NetSuite
│   │       └── duplicate_po_validation_ue.js # Duplicate PO check (Sales Orders)
│   └── TypeScripts/                          # TypeScript source files
│       ├── po_validation_ue.ts               # PO format validation (User Event)
│       ├── po_validation_cs.ts               # PO validation (Client Script)
│       └── lib_po_validation.ts              # Shared validation library
├── examples/
│   └── po_validation_examples.md             # Usage examples
├── test/                                     # Test files
├── NETSUITE_PO_VALIDATION_GUIDE.md          # Complete deployment guide
├── DEPENDENCY_AUDIT_REPORT.md               # Dependency security audit
└── package.json                              # Project dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build TypeScript Files

```bash
npm run build
```

This compiles TypeScript files from `src/TypeScripts/` to `src/FileCabinet/SuiteScripts/`

### 3. Deploy to NetSuite

See **[NETSUITE_PO_VALIDATION_GUIDE.md](NETSUITE_PO_VALIDATION_GUIDE.md)** for complete deployment instructions.

## Available Scripts

### Duplicate PO Validation (Sales Orders)

**File:** `src/FileCabinet/SuiteScripts/duplicate_po_validation_ue.js`

Prevents duplicate PO/Check numbers on Sales Orders with configurable options:
- Check duplicates per customer or across all customers
- Warning mode or block save mode
- Customer-level exclusion
- Automatic duplicate tracking

**Author:** Srikanth Patil

### PO Format Validation (Purchase Orders)

**Files:**
- `src/TypeScripts/po_validation_ue.ts` - User Event Script
- `src/TypeScripts/po_validation_cs.ts` - Client Script
- `src/TypeScripts/lib_po_validation.ts` - Validation Library

Validates PO number format with features:
- Custom regex patterns
- Length constraints
- Uniqueness checking
- Auto-generation with sequential numbering
- Multiple configuration presets

## Configuration

### Duplicate PO Validation

Edit variables in `duplicate_po_validation_ue.js`:

```javascript
var SAME_CUSTOMER = true;   // Check duplicates per customer (true) or globally (false)
var BLOCK_SAVE = false;     // Block save (true) or warn only (false)
```

### PO Format Validation

Edit `PO_CONFIG` in `po_validation_ue.ts`:

```typescript
const PO_CONFIG = {
    PATTERN: /^PO-\d{4}-\d{4,6}$/,  // Regex pattern
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    CHECK_UNIQUENESS: true,
    ALLOW_MANUAL_ENTRY: true,
    AUTO_PREFIX: 'PO'
};
```

## Documentation

- **[NETSUITE_PO_VALIDATION_GUIDE.md](NETSUITE_PO_VALIDATION_GUIDE.md)** - Complete deployment and configuration guide
- **[examples/po_validation_examples.md](examples/po_validation_examples.md)** - Code examples and test scenarios
- **[DEPENDENCY_AUDIT_REPORT.md](DEPENDENCY_AUDIT_REPORT.md)** - Security and dependency analysis

## Development

### Writing SuiteScripts

1. Write TypeScript code in `src/TypeScripts/`
2. Build with `npm run build`
3. Upload compiled files from `src/FileCabinet/SuiteScripts/` to NetSuite
4. Create script records and deploy

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Required Custom Fields

For duplicate PO validation, create these custom fields in NetSuite:

| Field ID | Label | Type | Record Type |
|----------|-------|------|-------------|
| `custbody_has_dup_po` | Has Duplicate PO | Checkbox | Transaction |
| `custbody_dup_so_number` | Duplicate SO Number | Text | Transaction |
| `custentity_exclude_dup_check` | Exclude Duplicate Check | Checkbox | Customer |

See the guide for detailed setup instructions.

## Examples

### Valid PO Numbers (Default Pattern)

```
✅ PO-2026-000001
✅ PO-2026-001234
✅ PO-2025-999999
```

### Invalid PO Numbers

```
❌ PO12345         (Missing hyphens)
❌ PO-26-12345     (Year must be 4 digits)
❌ ABC-2026-001    (Wrong prefix)
```

See **[examples/po_validation_examples.md](examples/po_validation_examples.md)** for more examples.

## Dependencies

This project uses:
- TypeScript for type-safe development
- NetSuite SuiteScript 2.1 API
- @hitc/netsuite-types for TypeScript definitions
- ESLint for code quality
- Jest for testing

See **[DEPENDENCY_AUDIT_REPORT.md](DEPENDENCY_AUDIT_REPORT.md)** for security audit and recommendations.

## Support

For issues or questions:
1. Check the **[NETSUITE_PO_VALIDATION_GUIDE.md](NETSUITE_PO_VALIDATION_GUIDE.md)** troubleshooting section
2. Review **[examples/po_validation_examples.md](examples/po_validation_examples.md)**
3. Check NetSuite execution logs (Customization > Scripting > Script Execution Log)

## License

ISC

## Author

**Srikanth Patil**
NetSuite Developer
