# PO Validation Examples

## Example 1: Duplicate PO Detection (Sales Orders)

### Scenario: Same Customer, Duplicate PO

```javascript
// Sales Order #1
Customer: ABC Corp (ID: 123)
PO/Check #: "PO-12345"
Result: ✅ Saves successfully
Fields Set:
  - custbody_has_dup_po: FALSE
  - custbody_dup_so_number: (empty)

// Sales Order #2 (Same Customer)
Customer: ABC Corp (ID: 123)
PO/Check #: "PO-12345"
Result: ⚠️ Saves with warning (if BLOCK_SAVE = false)
Fields Set:
  - custbody_has_dup_po: TRUE
  - custbody_dup_so_number: "SO-1001" (first SO number)

Warning Message:
"PO/Check #: PO-12345 already used on: SO-1001"
```

### Scenario: Different Customers (SAME_CUSTOMER = true)

```javascript
// Sales Order #1
Customer: ABC Corp (ID: 123)
PO/Check #: "PO-12345"
Result: ✅ Saves successfully

// Sales Order #2 (Different Customer)
Customer: XYZ Inc (ID: 456)
PO/Check #: "PO-12345"
Result: ✅ Saves successfully (no warning)
Reason: Different customer, SAME_CUSTOMER = true allows this
```

### Scenario: Customer Excluded from Check

```javascript
// Customer Record: ABC Corp
custentity_exclude_dup_check: TRUE

// Sales Orders with duplicate PO#
SO #1: PO-12345 - Customer: ABC Corp
SO #2: PO-12345 - Customer: ABC Corp
Result: ✅ Both save without warnings
Reason: Customer is excluded from duplicate checking
```

---

## Example 2: PO Format Validation (Purchase Orders)

### Valid PO Numbers (Default Pattern)

```javascript
✅ "PO-2026-000001"  // Valid: Prefix-Year-Sequence
✅ "PO-2026-001234"  // Valid: Standard format
✅ "PO-2025-999999"  // Valid: Different year
✅ "PO-2026-0001"    // Valid: Shorter sequence (4 digits minimum)
```

### Invalid PO Numbers

```javascript
❌ "PO12345"         // Missing hyphens and year
   Error: "PO Number format is invalid. Expected format: PO-YYYY-NNNNNN"

❌ "PO-26-12345"     // Year must be 4 digits
   Error: "PO Number format is invalid. Expected format: PO-YYYY-NNNNNN"

❌ "ABC-2026-001"    // Wrong prefix
   Error: "PO Number format is invalid. Expected format: PO-YYYY-NNNNNN"

❌ "PO-2026"         // No sequence number
   Error: "PO Number format is invalid. Expected format: PO-YYYY-NNNNNN"

❌ "PO-26"           // Too short
   Error: "PO Number must be at least 8 characters long."

❌ "PO-2026-ABCD"    // Letters in sequence
   Error: "PO Number format is invalid. Expected format: PO-YYYY-NNNNNN"
```

### Auto-Generated PO Numbers

```javascript
// First PO of 2026
Input: (empty)
Generated: "PO-2026-000001"

// Second PO of 2026
Input: (empty)
Generated: "PO-2026-000002"

// After PO-2026-001234 exists
Input: (empty)
Generated: "PO-2026-001235"
```

---

## Example 3: Using Validation Library

### Validate Format

```typescript
import { validateFormat, DEFAULT_CONFIG } from './lib_po_validation';

// Valid PO
const result1 = validateFormat('PO-2026-001234', DEFAULT_CONFIG);
console.log(result1);
// Output:
// {
//   isValid: true,
//   message: 'Valid PO Number',
//   errorCode: 'PO_VALID'
// }

// Invalid PO
const result2 = validateFormat('INVALID', DEFAULT_CONFIG);
console.log(result2);
// Output:
// {
//   isValid: false,
//   message: 'PO Number format is invalid. Expected format: PO-YYYY-NNNNNN',
//   errorCode: 'PO_INVALID_FORMAT'
// }
```

### Check Uniqueness

```typescript
import { checkUniqueness } from './lib_po_validation';

// Check if PO number is unique
const isUnique = checkUniqueness('PO-2026-001234');

if (!isUnique) {
    console.log('PO number already exists!');
}
```

### Complete Validation

```typescript
import { validatePONumber, DEFAULT_CONFIG } from './lib_po_validation';

const result = validatePONumber(
    'PO-2026-001234',
    DEFAULT_CONFIG,
    undefined,  // No current record ID (creating new)
    'purchaseorder'
);

if (result.isValid) {
    console.log('✅ PO number is valid and unique');
} else {
    console.error('❌ ' + result.message);
}
```

### Generate PO Number

```typescript
import { generatePONumber, DEFAULT_CONFIG } from './lib_po_validation';

// Auto-generate next PO number
const newPO = generatePONumber(DEFAULT_CONFIG);
console.log(newPO);
// Output: "PO-2026-000123" (next sequential number)

// Monthly format
import { generatePONumberMonthly } from './lib_po_validation';

const monthlyPO = generatePONumberMonthly('PO');
console.log(monthlyPO);
// Output: "PO-202601-0001" (Year+Month+Sequence)
```

---

## Example 4: Custom Patterns

### Simple Alphanumeric Pattern

```typescript
import { SIMPLE_CONFIG, validateFormat } from './lib_po_validation';

// SIMPLE_CONFIG pattern: /^[A-Z0-9]{8,15}$/

✅ validateFormat('PO12345678', SIMPLE_CONFIG)      // Valid
✅ validateFormat('ABC123XYZ', SIMPLE_CONFIG)       // Valid
✅ validateFormat('123456789012345', SIMPLE_CONFIG) // Valid (15 chars)
❌ validateFormat('PO-123', SIMPLE_CONFIG)          // Invalid: Has hyphen
❌ validateFormat('short', SIMPLE_CONFIG)           // Invalid: Too short
```

### Strict Pattern

```typescript
import { STRICT_CONFIG, validateFormat } from './lib_po_validation';

// STRICT_CONFIG pattern: /^PO[0-9]{8}$/

✅ validateFormat('PO12345678', STRICT_CONFIG)  // Valid
❌ validateFormat('PO-12345678', STRICT_CONFIG) // Invalid: Has hyphen
❌ validateFormat('PO123456', STRICT_CONFIG)    // Invalid: Only 6 digits
❌ validateFormat('PR12345678', STRICT_CONFIG)  // Invalid: Wrong prefix
```

### Custom Pattern

```typescript
import { ValidationConfig, validateFormat } from './lib_po_validation';

// Department-based PO numbers: SALES-2026-0001
const customConfig: POValidationConfig = {
    pattern: /^(SALES|MARKETING|IT)-\d{4}-\d{4}$/,
    minLength: 15,
    maxLength: 20,
    formatDescription: 'DEPT-YYYY-NNNN (e.g., SALES-2026-0001)',
    checkUniqueness: true,
    allowManualEntry: true,
    autoPrefix: 'SALES',
    requirePrefix: true,
    allowedPrefixes: ['SALES', 'MARKETING', 'IT']
};

✅ validateFormat('SALES-2026-0001', customConfig)
✅ validateFormat('MARKETING-2026-0099', customConfig)
✅ validateFormat('IT-2026-1234', customConfig)
❌ validateFormat('HR-2026-0001', customConfig)  // Invalid prefix
```

---

## Example 5: Client-Side Validation Flow

### User Creates Purchase Order

```
1. User opens new Purchase Order form
   └─> pageInit() runs
       └─> Shows format hint: "PO-YYYY-NNNNNN (e.g., PO-2026-001234)"

2. User types "PO-2026" in PO# field and tabs out
   └─> validateField() runs
       └─> ❌ Shows alert: "Invalid format. Expected: PO-YYYY-NNNNNN"
       └─> Focus stays on field

3. User corrects to "PO-2026-001234"
   └─> fieldChanged() runs
       └─> ✅ Console: "PO Number format is valid"

4. User clicks Save
   └─> saveRecord() runs
       └─> Validates format: ✅ Pass
       └─> Checks uniqueness: ❌ Duplicate found!
       └─> Shows alert: "Duplicate PO Number"
       └─> Blocks save (return false)

5. User changes to "PO-2026-001235"
   └─> saveRecord() runs
       └─> Validates format: ✅ Pass
       └─> Checks uniqueness: ✅ Unique
       └─> Allows save (return true)

6. Form submits to server
   └─> beforeSubmit() runs (server-side)
       └─> Final validation
       └─> ✅ Record saved
```

---

## Example 6: Error Handling

### Graceful Degradation

```javascript
// Search fails - allow operation
try {
    checkUniqueness('PO-2026-001234');
} catch (e) {
    log.error('Uniqueness check failed', e);
    // Return true to allow save (don't block on search errors)
    return true;
}

// Field doesn't exist - skip validation
if (!rec.getValue('otherrefnum')) {
    // No PO number provided, skip duplicate check
    return;
}

// Customer excluded - bypass validation
if (isCustomerExcluded(customerId)) {
    // Customer is excluded, clear duplicate flags
    rec.setValue({ fieldId: HAS_DUP_FIELD, value: false });
    return;
}
```

---

## Example 7: Testing Scenarios

### Test Script

```javascript
// Test duplicate detection
function testDuplicateDetection() {
    const testCases = [
        {
            name: 'Same customer, same PO',
            customer: 'ABC Corp',
            po: 'PO-12345',
            expectedDuplicate: true
        },
        {
            name: 'Different customer, same PO',
            customer: 'XYZ Inc',
            po: 'PO-12345',
            expectedDuplicate: false  // if SAME_CUSTOMER = true
        },
        {
            name: 'Same customer, different PO',
            customer: 'ABC Corp',
            po: 'PO-99999',
            expectedDuplicate: false
        }
    ];

    testCases.forEach(test => {
        console.log(`Testing: ${test.name}`);
        // Run validation...
    });
}
```

### Manual Test Checklist

```
Purchase Order Format Validation:
□ Create PO with valid format → Should save
□ Create PO with invalid format → Should show error
□ Create PO with duplicate number → Should block
□ Leave PO# empty (auto-gen enabled) → Should generate number
□ Edit existing PO (keep same number) → Should save
□ Edit existing PO (change to duplicate) → Should block

Sales Order Duplicate Detection:
□ Create SO with new PO# → Should save
□ Create SO with duplicate PO# (same customer) → Should warn
□ Create SO with duplicate PO# (diff customer) → Check SAME_CUSTOMER setting
□ Create SO for excluded customer → Should not check duplicates
□ View SO with duplicate → Should show warning banner
□ Set BLOCK_SAVE = true → Should prevent save
```

---

## Example 8: Integration Examples

### With Approval Workflow

```javascript
function beforeSubmit(context) {
    var rec = context.newRecord;
    var poNum = rec.getValue('otherrefnum');

    var dupSO = findDuplicate(rec.type, poNum, custId, rec.id);

    if (dupSO) {
        // Set approval required
        rec.setValue({
            fieldId: 'approvalstatus',
            value: '1'  // Pending Approval
        });

        // Add note for approver
        rec.setValue({
            fieldId: 'memo',
            value: 'REQUIRES APPROVAL: Duplicate PO# - Already used on ' + dupSO
        });
    }
}
```

### With Email Notification

```javascript
require(['N/email'], function(email) {
    if (dupSO) {
        email.send({
            author: -5,
            recipients: ['manager@company.com'],
            subject: 'Duplicate PO Alert - ' + poNum,
            body: `
                Duplicate PO# detected:
                - PO Number: ${poNum}
                - New Order: ${rec.getValue('tranid')}
                - Existing Order: ${dupSO}
                - Customer: ${rec.getText('entity')}

                Please review and approve.
            `
        });
    }
});
```

### With Custom Reporting

```javascript
// Create saved search for duplicate PO tracking
var dupPOSearch = search.create({
    type: search.Type.SALES_ORDER,
    filters: [
        ['custbody_has_dup_po', 'is', 'T']
    ],
    columns: [
        'tranid',
        'entity',
        'otherrefnum',
        'custbody_dup_so_number',
        'trandate'
    ]
});

// Export to CSV or display in dashboard
```

---

## Example 9: Performance Optimization

### Limit Search Results

```javascript
// Only get 1 result (we just need to know if it exists)
var results = search.create({
    type: recType,
    filters: filters,
    columns: ['tranid']
}).run().getRange(0, 1);  // ← Limit to 1 result

// Much faster than getting all results
```

### Cache Customer Exclusion

```javascript
// Cache customer exclusion status to reduce lookups
var excludedCustomers = {};

function isCustomerExcluded(custId) {
    if (excludedCustomers.hasOwnProperty(custId)) {
        return excludedCustomers[custId];
    }

    var excluded = // ... do lookup
    excludedCustomers[custId] = excluded;
    return excluded;
}
```

---

## Summary

These examples demonstrate:
- ✅ Duplicate PO detection for Sales Orders
- ✅ PO format validation for Purchase Orders
- ✅ Custom validation patterns
- ✅ Auto-generation of PO numbers
- ✅ Client and server-side validation
- ✅ Error handling and graceful degradation
- ✅ Integration with workflows and notifications
- ✅ Performance optimization techniques

For complete documentation, see **NETSUITE_PO_VALIDATION_GUIDE.md**
