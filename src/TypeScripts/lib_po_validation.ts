/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * Purchase Order Number Validation Utility Library
 * Shared validation logic for both client and server-side scripts
 */

import * as search from 'N/search';
import * as log from 'N/log';

/**
 * PO Validation Configuration Interface
 */
export interface POValidationConfig {
    pattern: RegExp;
    minLength: number;
    maxLength: number;
    formatDescription: string;
    checkUniqueness: boolean;
    allowManualEntry: boolean;
    autoPrefix: string;
    requirePrefix?: boolean;
    allowedPrefixes?: string[];
}

/**
 * Validation Result Interface
 */
export interface ValidationResult {
    isValid: boolean;
    message: string;
    errorCode?: string;
}

/**
 * Default PO Validation Configuration
 * Can be customized per company requirements
 */
export const DEFAULT_CONFIG: POValidationConfig = {
    pattern: /^PO-\d{4}-\d{4,6}$/,
    minLength: 8,
    maxLength: 20,
    formatDescription: 'PO-YYYY-NNNNNN (e.g., PO-2026-001234)',
    checkUniqueness: true,
    allowManualEntry: true,
    autoPrefix: 'PO',
    requirePrefix: false,
    allowedPrefixes: ['PO', 'PR', 'PURCH']
};

/**
 * Alternative configurations for different business needs
 */
export const SIMPLE_CONFIG: POValidationConfig = {
    pattern: /^[A-Z0-9]{8,15}$/,
    minLength: 8,
    maxLength: 15,
    formatDescription: 'Alphanumeric, 8-15 characters',
    checkUniqueness: true,
    allowManualEntry: true,
    autoPrefix: 'PO'
};

export const STRICT_CONFIG: POValidationConfig = {
    pattern: /^PO[0-9]{8}$/,
    minLength: 10,
    maxLength: 10,
    formatDescription: 'PO followed by 8 digits (e.g., PO12345678)',
    checkUniqueness: true,
    allowManualEntry: false,
    autoPrefix: 'PO',
    requirePrefix: true
};

/**
 * Validates PO number format
 */
export function validateFormat(
    poNumber: string,
    config: POValidationConfig = DEFAULT_CONFIG
): ValidationResult {
    // Check if empty
    if (!poNumber || poNumber.trim() === '') {
        return {
            isValid: false,
            message: 'PO Number is required and cannot be empty.',
            errorCode: 'PO_EMPTY'
        };
    }

    const trimmedPO = poNumber.trim();

    // Check length constraints
    if (trimmedPO.length < config.minLength) {
        return {
            isValid: false,
            message: `PO Number must be at least ${config.minLength} characters long. Current length: ${trimmedPO.length}`,
            errorCode: 'PO_TOO_SHORT'
        };
    }

    if (trimmedPO.length > config.maxLength) {
        return {
            isValid: false,
            message: `PO Number cannot exceed ${config.maxLength} characters. Current length: ${trimmedPO.length}`,
            errorCode: 'PO_TOO_LONG'
        };
    }

    // Check for invalid characters (optional - depends on requirements)
    if (/[^A-Za-z0-9\-_]/.test(trimmedPO)) {
        return {
            isValid: false,
            message: 'PO Number contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.',
            errorCode: 'PO_INVALID_CHARS'
        };
    }

    // Check prefix if required
    if (config.requirePrefix && config.allowedPrefixes && config.allowedPrefixes.length > 0) {
        const hasValidPrefix = config.allowedPrefixes.some(prefix =>
            trimmedPO.toUpperCase().startsWith(prefix)
        );

        if (!hasValidPrefix) {
            return {
                isValid: false,
                message: `PO Number must start with one of: ${config.allowedPrefixes.join(', ')}`,
                errorCode: 'PO_INVALID_PREFIX'
            };
        }
    }

    // Check pattern
    if (!config.pattern.test(trimmedPO)) {
        return {
            isValid: false,
            message: `PO Number format is invalid. Expected format: ${config.formatDescription}`,
            errorCode: 'PO_INVALID_FORMAT'
        };
    }

    return {
        isValid: true,
        message: 'Valid PO Number',
        errorCode: 'PO_VALID'
    };
}

/**
 * Checks if PO number is unique in the system
 */
export function checkUniqueness(
    poNumber: string,
    currentRecordId?: number | string,
    recordType: string = 'purchaseorder'
): boolean {
    try {
        log.debug({
            title: 'Checking PO Uniqueness',
            details: `PO#: ${poNumber}, Current ID: ${currentRecordId}`
        });

        const poSearch = search.create({
            type: recordType as unknown as search.Type,
            filters: [
                ['tranid', search.Operator.IS, poNumber],
                'AND',
                ['mainline', search.Operator.IS, 'T']
            ],
            columns: ['internalid', 'tranid']
        });

        const results = poSearch.run().getRange({ start: 0, end: 2 });

        // No existing records found
        if (!results || results.length === 0) {
            log.debug({
                title: 'PO Uniqueness Check',
                details: 'No duplicates found - PO is unique'
            });
            return true;
        }

        // If editing existing record, allow same PO number
        if (currentRecordId) {
            const recordIdStr = currentRecordId.toString();
            const isDuplicate = results.some(result => result.id !== recordIdStr);

            if (!isDuplicate) {
                log.debug({
                    title: 'PO Uniqueness Check',
                    details: 'Same record - PO is unique'
                });
                return true;
            }
        }

        log.debug({
            title: 'PO Uniqueness Check',
            details: `Duplicate found - PO already exists in record ${results[0].id}`
        });
        return false;

    } catch (e) {
        log.error({
            title: 'Error checking PO uniqueness',
            details: e
        });
        // On error, allow the operation (don't block)
        return true;
    }
}

/**
 * Generates next available PO number
 */
export function generatePONumber(
    config: POValidationConfig = DEFAULT_CONFIG,
    recordType: string = 'purchaseorder'
): string {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

        // Search for highest PO number with current prefix
        const poSearch = search.create({
            type: recordType as unknown as search.Type,
            filters: [
                ['tranid', search.Operator.STARTSWITH, `${config.autoPrefix}-${currentYear}-`],
                'AND',
                ['mainline', search.Operator.IS, 'T']
            ],
            columns: [{
                name: 'tranid',
                sort: search.Sort.DESC
            }]
        });

        const results = poSearch.run().getRange({ start: 0, end: 1 });

        let nextNumber = 1;

        if (results && results.length > 0) {
            const lastPO = results[0].getValue({ name: 'tranid' }) as string;
            log.debug({
                title: 'Last PO Found',
                details: lastPO
            });

            // Extract number from end of PO
            const matches = lastPO.match(/\d+$/);

            if (matches) {
                nextNumber = parseInt(matches[0]) + 1;
            }
        }

        // Format with leading zeros (6 digits)
        const paddedNumber = nextNumber.toString().padStart(6, '0');
        const generatedPO = `${config.autoPrefix}-${currentYear}-${paddedNumber}`;

        log.audit({
            title: 'PO Number Generated',
            details: generatedPO
        });

        return generatedPO;

    } catch (e) {
        log.error({
            title: 'Error generating PO number',
            details: e
        });

        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-8);
        return `${config.autoPrefix}-${timestamp}`;
    }
}

/**
 * Generates PO number with custom format (month-based)
 */
export function generatePONumberMonthly(prefix: string = 'PO'): string {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const searchPrefix = `${prefix}-${year}${month}-`;

        const poSearch = search.create({
            type: search.Type.PURCHASE_ORDER,
            filters: [
                ['tranid', search.Operator.STARTSWITH, searchPrefix],
                'AND',
                ['mainline', search.Operator.IS, 'T']
            ],
            columns: [{
                name: 'tranid',
                sort: search.Sort.DESC
            }]
        });

        const results = poSearch.run().getRange({ start: 0, end: 1 });

        let nextNumber = 1;

        if (results && results.length > 0) {
            const lastPO = results[0].getValue({ name: 'tranid' }) as string;
            const matches = lastPO.match(/\d+$/);

            if (matches) {
                nextNumber = parseInt(matches[0]) + 1;
            }
        }

        const paddedNumber = nextNumber.toString().padStart(4, '0');
        return `${prefix}-${year}${month}-${paddedNumber}`;

    } catch (e) {
        log.error({
            title: 'Error generating monthly PO number',
            details: e
        });

        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    }
}

/**
 * Complete validation (format + uniqueness)
 */
export function validatePONumber(
    poNumber: string,
    config: POValidationConfig = DEFAULT_CONFIG,
    currentRecordId?: number | string,
    recordType: string = 'purchaseorder'
): ValidationResult {
    // First, validate format
    const formatResult = validateFormat(poNumber, config);

    if (!formatResult.isValid) {
        return formatResult;
    }

    // Then check uniqueness if configured
    if (config.checkUniqueness) {
        const isUnique = checkUniqueness(poNumber, currentRecordId, recordType);

        if (!isUnique) {
            return {
                isValid: false,
                message: `PO Number "${poNumber}" already exists in the system. Please use a unique PO number.`,
                errorCode: 'PO_DUPLICATE'
            };
        }
    }

    return {
        isValid: true,
        message: 'PO Number is valid and unique',
        errorCode: 'PO_VALID'
    };
}

/**
 * Sanitizes PO number (removes extra spaces, converts to uppercase if needed)
 */
export function sanitizePONumber(poNumber: string, toUpperCase: boolean = true): string {
    if (!poNumber) {
        return '';
    }

    let sanitized = poNumber.trim().replace(/\s+/g, '');

    if (toUpperCase) {
        sanitized = sanitized.toUpperCase();
    }

    return sanitized;
}

/**
 * Extracts PO number components (for parsing)
 */
export function parsePONumber(poNumber: string): {
    prefix?: string;
    year?: string;
    sequence?: string;
    full: string;
} {
    const trimmed = poNumber.trim();

    // Try to match pattern: PREFIX-YYYY-NNNNNN
    const match = trimmed.match(/^([A-Z]+)-(\d{4})-(\d+)$/);

    if (match) {
        return {
            prefix: match[1],
            year: match[2],
            sequence: match[3],
            full: trimmed
        };
    }

    // Return just the full number if pattern doesn't match
    return {
        full: trimmed
    };
}
