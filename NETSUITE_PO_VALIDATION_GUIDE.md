# NetSuite Purchase Order Validation - Complete Guide

## Overview

This repository contains comprehensive PO/Check number validation scripts for NetSuite, including:

1. **Duplicate PO Validation for Sales Orders** - Prevents duplicate PO/Check numbers on Sales Orders
2. **PO Format Validation for Purchase Orders** - Validates PO number format and uniqueness
3. **Shared Validation Library** - Reusable validation utilities

---

## Table of Contents

- [Scripts Overview](#scripts-overview)
- [Required Custom Fields](#required-custom-fields)
- [Script Deployment Guide](#script-deployment-guide)
- [Configuration Options](#configuration-options)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)

---

## Scripts Overview

### 1. Duplicate PO Validation (Sales Orders)

**File:** `src/FileCabinet/SuiteScripts/duplicate_po_validation_ue.js`
**Type:** User Event Script
**Record Type:** Sales Order
**Author:** Srikanth Patil

#### Features:
- ✅ Detects duplicate PO/Check numbers on Sales Orders
- ✅ Can restrict duplicates to same customer or across all customers
- ✅ Shows warning banner when viewing/editing records with duplicates
- ✅ Optional: Block save when duplicate detected
- ✅ Customer-level exclusion from duplicate checking
- ✅ Stores duplicate SO number for reference

#### How It Works:
1. **beforeSubmit**: Searches for existing Sales Orders with same PO/Check number
2. **beforeLoad**: Displays warning banner if duplicate exists
3. Updates custom fields to track duplicate status and related SO number

#### Configuration Variables:

```javascript
var SOURCE_FIELD = 'otherrefnum';        // Field containing PO/Check number
var SEARCH_FIELD = 'poastext';           // Search field for PO number
var HAS_DUP_FIELD = 'custbody_has_dup_po';       // Custom field: Has Duplicate
var DUP_NUM_FIELD = 'custbody_dup_so_number';    // Custom field: Duplicate SO Number
var EXCLUDE_FIELD = 'custentity_exclude_dup_check'; // Customer exclusion field
var SAME_CUSTOMER = true;                // Only check duplicates for same customer
var BLOCK_SAVE = false;                  // Set to true to prevent saving duplicates
```

---

### 2. Purchase Order Format Validation

**Files:**
- `src/TypeScripts/po_validation_ue.ts` - User Event Script (TypeScript)
- `src/TypeScripts/po_validation_cs.ts` - Client Script (TypeScript)
- `src/TypeScripts/lib_po_validation.ts` - Shared Validation Library

#### Features:
- ✅ Validates PO number format using regex patterns
- ✅ Enforces length constraints (min/max)
- ✅ Checks PO number uniqueness across Purchase Orders
- ✅ Auto-generates PO numbers with sequential numbering
- ✅ Client-side and server-side validation
- ✅ Multiple configuration presets (Default, Simple, Strict)
- ✅ Customizable format patterns

#### Validation Patterns:

**Default Pattern:** `PO-YYYY-NNNNNN`
- Example: `PO-2026-001234`
- Format: Prefix + Year + 6-digit sequence

**Simple Pattern:** Alphanumeric 8-15 characters
- Example: `PO12345678`

**Strict Pattern:** `PO` + 8 digits
- Example: `PO12345678`

---

## Required Custom Fields

### For Duplicate PO Validation (Sales Orders):

| Field ID | Label | Type | Level | Description |
|----------|-------|------|-------|-------------|
| `custbody_has_dup_po` | Has Duplicate PO | Checkbox | Transaction Body | Indicates if PO number is duplicate |
| `custbody_dup_so_number` | Duplicate SO Number | Text | Transaction Body | Stores the SO# that has same PO |
| `custentity_exclude_dup_check` | Exclude from Duplicate Check | Checkbox | Customer | Exclude customer from PO validation |

### Creating Custom Fields in NetSuite:

1. **Navigation:** Customization > Lists, Records, & Fields > Transaction Body Fields
2. Click **New**
3. Configure:
   - **Label:** Has Duplicate PO
   - **ID:** custbody_has_dup_po
   - **Type:** Checkbox
   - **Store Value:** Checked
   - **Applies To:** Sales Order
4. Click **Save**

Repeat for other fields.

---

## Script Deployment Guide

### Step 1: Upload Scripts to File Cabinet

1. Navigate to: **Documents > Files > File Cabinet**
2. Create folder structure:
   ```
   SuiteScripts/
   ├── duplicate_po_validation_ue.js
   ├── po_validation_ue.js
   ├── po_validation_cs.js
   └── lib_po_validation.js
   ```
3. Upload each script file

### Step 2: Deploy Duplicate PO Validation (Sales Orders)

1. Navigate to: **Customization > Scripting > Scripts > New**
2. Select script file: `duplicate_po_validation_ue.js`
3. Click **Create Script Record**
4. Configure:
   - **Name:** Duplicate PO Check - Sales Orders
   - **ID:** customscript_dup_po_check_so
   - **Owner:** Administrator

5. Click **Save**
6. Click **Deploy Script**
7. Configure Deployment:
   - **Applied to:** Sales Order
   - **Status:** Testing (then Release when ready)
   - **Log Level:** Debug (for initial testing)
   - **Execute as Role:** Administrator
   - **Audience:** All Roles

8. **Entry Points:**
   - ✅ Before Load
   - ✅ Before Submit

9. Click **Save**

### Step 3: Deploy PO Format Validation (Purchase Orders)

#### A. Compile TypeScript Files

```bash
# From project root
npm run build
```

This compiles TypeScript files to JavaScript in `src/FileCabinet/SuiteScripts/`

#### B. Deploy User Event Script

1. Upload compiled `po_validation_ue.js` to File Cabinet
2. Create Script Record
3. Configure:
   - **Name:** PO Number Format Validation
   - **ID:** customscript_po_format_validation
   - **Applied to:** Purchase Order
   - **Entry Points:** Before Submit, After Submit

#### C. Deploy Client Script

1. Upload compiled `po_validation_cs.js` to File Cabinet
2. Create Script Record
3. Configure:
   - **Name:** PO Number Client Validation
   - **ID:** customscript_po_client_validation
   - **Applied to:** Purchase Order
   - **Entry Points:** Page Init, Field Changed, Save Record, Validate Field

---

## Configuration Options

### Duplicate PO Validation Configuration

Edit variables at the top of `duplicate_po_validation_ue.js`:

```javascript
// Check duplicates only for same customer (true) or all customers (false)
var SAME_CUSTOMER = true;

// Block save when duplicate found (true) or just warn (false)
var BLOCK_SAVE = false;
```

**Scenarios:**

| SAME_CUSTOMER | BLOCK_SAVE | Behavior |
|---------------|------------|----------|
| true | false | Warns if same customer uses PO# twice (default) |
| true | true | Blocks if same customer uses PO# twice |
| false | false | Warns if ANY customer uses PO# twice |
| false | true | Blocks if ANY customer uses PO# twice |

### PO Format Validation Configuration

Edit `PO_CONFIG` in the script files:

#### Default Configuration (src/TypeScripts/po_validation_ue.ts):

```typescript
const PO_CONFIG = {
    // Regex pattern for PO format
    PATTERN: /^PO-\d{4}-\d{4,6}$/,

    // Length constraints
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,

    // Uniqueness checking
    CHECK_UNIQUENESS: true,

    // Manual entry vs auto-generation
    ALLOW_MANUAL_ENTRY: true,

    // Auto-generation prefix
    AUTO_PREFIX: 'PO',

    // Format description for error messages
    FORMAT_DESCRIPTION: 'PO-YYYY-NNNNNN (e.g., PO-2026-001234)'
};
```

#### Using Library Presets:

```typescript
import { DEFAULT_CONFIG, SIMPLE_CONFIG, STRICT_CONFIG } from './lib_po_validation';

// Use simple alphanumeric format
const validation = validateFormat(poNumber, SIMPLE_CONFIG);

// Use strict PO + 8 digits format
const validation = validateFormat(poNumber, STRICT_CONFIG);
```

---

## Testing & Validation

### Test Plan for Duplicate PO Validation

#### Test Case 1: Create Duplicate PO (Same Customer)
1. Create Sales Order #1 for Customer A with PO# "TEST001"
2. Save successfully
3. Create Sales Order #2 for Customer A with PO# "TEST001"
4. Expected: Warning banner appears (if BLOCK_SAVE = false)
5. Verify `custbody_has_dup_po` = TRUE
6. Verify `custbody_dup_so_number` = SO#1

#### Test Case 2: Different Customers
1. Create Sales Order #1 for Customer A with PO# "TEST002"
2. Create Sales Order #2 for Customer B with PO# "TEST002"
3. If SAME_CUSTOMER = true: No warning
4. If SAME_CUSTOMER = false: Warning appears

#### Test Case 3: Customer Exclusion
1. Check "Exclude from Duplicate Check" on Customer A
2. Create two Sales Orders for Customer A with same PO#
3. Expected: No warnings, both save successfully

#### Test Case 4: Blocked Save
1. Set BLOCK_SAVE = true
2. Try to create duplicate PO
3. Expected: Error message, save blocked

### Test Plan for PO Format Validation

#### Test Case 1: Valid Format
1. Create Purchase Order with PO# "PO-2026-001234"
2. Expected: Saves successfully

#### Test Case 2: Invalid Format
1. Create Purchase Order with PO# "INVALID"
2. Expected: Error message with format requirements

#### Test Case 3: Too Short
1. Create Purchase Order with PO# "PO-123"
2. Expected: Length validation error

#### Test Case 4: Duplicate PO Number
1. Create PO with "PO-2026-000001"
2. Try to create another PO with same number
3. Expected: Duplicate error

#### Test Case 5: Auto-Generation
1. Leave PO# field blank (if configured)
2. Expected: Auto-generated PO number assigned

---

## NetSuite Deployment Checklist

- [ ] Custom fields created and deployed
- [ ] Scripts uploaded to File Cabinet
- [ ] Script records created
- [ ] Deployments configured
- [ ] Test in Sandbox environment
- [ ] Verify with different user roles
- [ ] Test all edge cases
- [ ] Enable logging for initial deployment
- [ ] Document any customizations
- [ ] Train end users
- [ ] Deploy to Production
- [ ] Monitor execution logs

---

## Logging & Debugging

### Enable Debug Logging

1. Navigate to script deployment
2. Set **Log Level** to **Debug**
3. Save deployment

### View Execution Logs

1. Navigate to: **Customization > Scripting > Script Execution Log**
2. Filter by:
   - Script: Your script name
   - Type: Debug, Audit, Error
   - Date Range

### Uncomment Debug Statements

Both scripts have commented log statements:

```javascript
// Uncomment for debugging
//log.debug('beforeSubmit', 'PO#: ' + poNum + ' | Customer: ' + custId);
```

Remove `//` to enable specific debug lines.

---

## Troubleshooting

### Issue: Warning banner doesn't appear

**Possible Causes:**
1. Custom field `custbody_has_dup_po` not checked
2. beforeLoad entry point not enabled
3. User viewing in Create mode (banner only shows in View/Edit)

**Solution:**
- Check script deployment has beforeLoad enabled
- Verify custom field value is TRUE
- Check execution logs

### Issue: Duplicate not detected

**Possible Causes:**
1. SAME_CUSTOMER = true but testing with different customers
2. Search field configuration mismatch
3. Custom field permissions

**Solution:**
- Verify SAME_CUSTOMER setting matches test scenario
- Check SOURCE_FIELD and SEARCH_FIELD match NetSuite fields
- Verify script execution logs

### Issue: Script errors on save

**Possible Causes:**
1. Custom fields don't exist
2. Field IDs incorrect
3. Permissions issues

**Solution:**
- Verify all custom fields exist: `custbody_has_dup_po`, `custbody_dup_so_number`, `custentity_exclude_dup_check`
- Check field IDs match exactly (case-sensitive)
- Run script as Administrator role initially

### Issue: PO format validation not working

**Possible Causes:**
1. TypeScript not compiled to JavaScript
2. Module import issues
3. Regex pattern mismatch

**Solution:**
- Run `npm run build` to compile TypeScript
- Check compiled JavaScript exists in File Cabinet
- Test regex pattern with sample PO numbers

---

## Advanced Customization

### Custom PO Format Pattern

To change the PO format pattern, modify the regex in the configuration:

```typescript
// Example: Custom format ABC-12345
PATTERN: /^ABC-\d{5}$/,
FORMAT_DESCRIPTION: 'ABC-NNNNN (e.g., ABC-12345)'

// Example: Department-Year-Sequence
PATTERN: /^[A-Z]{2,4}-\d{4}-\d{3,6}$/,
FORMAT_DESCRIPTION: 'DEPT-YYYY-NNN (e.g., SALES-2026-001)'
```

### Different Validation by Subsidiary

Add subsidiary-specific logic:

```javascript
function beforeSubmit(context) {
    var rec = context.newRecord;
    var subsidiary = rec.getValue('subsidiary');

    // Different rules for different subsidiaries
    if (subsidiary == '1') {
        // US subsidiary - strict validation
        PATTERN = /^US-\d{8}$/;
    } else if (subsidiary == '2') {
        // UK subsidiary - different pattern
        PATTERN = /^UK-\d{6}$/;
    }

    // Continue validation...
}
```

### Email Notifications on Duplicate

Add email notification in `beforeSubmit`:

```javascript
if (dupSO) {
    // Send email notification
    email.send({
        author: -5,  // NetSuite admin
        recipients: 'manager@company.com',
        subject: 'Duplicate PO Alert',
        body: 'PO# ' + poNum + ' used on both ' + rec.getValue('tranid') + ' and ' + dupSO
    });
}
```

---

## Integration with SuiteCloud CLI

### Deploy Scripts Using SDF

```bash
# Initialize project
suitecloud project:create -i

# Add files
suitecloud file:import -p /SuiteScripts/

# Deploy
suitecloud project:deploy
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Srikanth Patil | Initial duplicate PO validation |
| 2.0 | 2026-01-17 | Claude Code | Added PO format validation, TypeScript library |

---

## Support & Maintenance

### Monitoring

Recommended monitoring schedule:
- **Daily:** Check execution logs for errors
- **Weekly:** Review duplicate PO reports
- **Monthly:** Analyze validation patterns and adjust rules

### Performance Considerations

- Searches are limited to 1 result for performance
- Uniqueness checks only run when PO# provided
- Client-side validation reduces server calls

### Future Enhancements

Potential improvements:
- [ ] Integration with approval workflows
- [ ] Advanced analytics dashboard
- [ ] Bulk PO number update utility
- [ ] API endpoints for external validation
- [ ] Machine learning for fraud detection
- [ ] Multi-language support

---

## License

ISC License - See package.json

## Author

**Srikanth Patil**
NetSuite Developer

---

## Additional Resources

- [NetSuite SuiteScript 2.1 Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4387172221.html)
- [SuiteScript 2.1 API Reference](https://system.netsuite.com/app/help/helpcenter.nl?fid=chapter_4387799597.html)
- [NetSuite SuiteCloud Developer Network](https://developers.suitecloud.com/)

---

**Last Updated:** 2026-01-17
