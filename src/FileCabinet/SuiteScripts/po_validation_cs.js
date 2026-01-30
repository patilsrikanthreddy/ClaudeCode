/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
define(["require", "exports", "N/ui/dialog", "N/search", "N/log"], function (require, exports, ui, search, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateLine = exports.saveRecord = exports.validateField = exports.fieldChanged = exports.pageInit = void 0;
    ui = __importStar(ui);
    search = __importStar(search);
    log = __importStar(log);
    /**
     * PO Number Validation Configuration (Client-side)
     * Must match server-side configuration
     */
    const PO_CONFIG = {
        PATTERN: /^PO-\d{4}-\d{4,6}$/,
        MIN_LENGTH: 8,
        MAX_LENGTH: 20,
        FORMAT_DESCRIPTION: 'PO-YYYY-NNNNNN (e.g., PO-2026-001234)',
        CHECK_UNIQUENESS: true
    };
    /**
     * Validates PO number format (client-side)
     */
    function validatePOFormat(poNumber) {
        if (!poNumber || poNumber.trim() === '') {
            return {
                isValid: false,
                message: 'PO Number is required.'
            };
        }
        if (poNumber.length < PO_CONFIG.MIN_LENGTH) {
            return {
                isValid: false,
                message: `PO Number must be at least ${PO_CONFIG.MIN_LENGTH} characters.`
            };
        }
        if (poNumber.length > PO_CONFIG.MAX_LENGTH) {
            return {
                isValid: false,
                message: `PO Number cannot exceed ${PO_CONFIG.MAX_LENGTH} characters.`
            };
        }
        if (!PO_CONFIG.PATTERN.test(poNumber)) {
            return {
                isValid: false,
                message: `Invalid format. Expected: ${PO_CONFIG.FORMAT_DESCRIPTION}`
            };
        }
        return {
            isValid: true,
            message: 'Valid'
        };
    }
    /**
     * Checks PO uniqueness (client-side)
     */
    function checkPOUniqueness(poNumber, currentRecordId) {
        try {
            const poSearch = search.create({
                type: search.Type.PURCHASE_ORDER,
                filters: [
                    ['tranid', search.Operator.IS, poNumber],
                    'AND',
                    ['mainline', search.Operator.IS, 'T']
                ],
                columns: ['internalid']
            });
            const results = poSearch.run().getRange({ start: 0, end: 1 });
            if (!results || results.length === 0) {
                return true;
            }
            // Allow if editing the same record
            if (currentRecordId && results[0].id === currentRecordId) {
                return true;
            }
            return false;
        }
        catch (e) {
            log.error({
                title: 'Client-side uniqueness check failed',
                details: e
            });
            return true; // Allow if check fails
        }
    }
    /**
     * Page Init - runs when page loads
     */
    function pageInit(context) {
        try {
            const currentRecord = context.currentRecord;
            log.debug({
                title: 'PO Validation Client Script Loaded',
                details: `Mode: ${context.mode}`
            });
            // Add helpful message to PO field
            if (context.mode === 'create') {
                console.log(`PO Number Format: ${PO_CONFIG.FORMAT_DESCRIPTION}`);
            }
        }
        catch (e) {
            log.error({
                title: 'Page Init Error',
                details: e
            });
        }
    }
    exports.pageInit = pageInit;
    /**
     * Field Changed - validates when PO number changes
     */
    function fieldChanged(context) {
        try {
            const currentRecord = context.currentRecord;
            const fieldId = context.fieldId;
            // Only process tranid (PO Number) field changes
            if (fieldId !== 'tranid') {
                return;
            }
            const poNumber = currentRecord.getValue({ fieldId: 'tranid' });
            if (!poNumber || poNumber.trim() === '') {
                return; // Empty is handled on save
            }
            // Validate format
            const validation = validatePOFormat(poNumber);
            if (!validation.isValid) {
                // Show warning but don't block (validation happens on save)
                currentRecord.setValue({
                    fieldId: 'tranid',
                    value: poNumber,
                    ignoreFieldChange: true
                });
                // Display warning message
                console.warn(`PO Number Validation: ${validation.message}`);
                // Optional: Show alert to user
                ui.alert({
                    title: 'PO Number Validation Warning',
                    message: validation.message
                });
            }
            else {
                console.log('PO Number format is valid');
            }
        }
        catch (e) {
            log.error({
                title: 'Field Changed Error',
                details: e
            });
        }
    }
    exports.fieldChanged = fieldChanged;
    /**
     * Validate Field - triggered when field loses focus
     */
    function validateField(context) {
        try {
            const currentRecord = context.currentRecord;
            const fieldId = context.fieldId;
            if (fieldId !== 'tranid') {
                return true;
            }
            const poNumber = currentRecord.getValue({ fieldId: 'tranid' });
            if (!poNumber || poNumber.trim() === '') {
                return true; // Allow empty, will be caught on save
            }
            // Validate format
            const validation = validatePOFormat(poNumber);
            if (!validation.isValid) {
                ui.alert({
                    title: 'Invalid PO Number',
                    message: validation.message
                });
                return false;
            }
            return true;
        }
        catch (e) {
            log.error({
                title: 'Validate Field Error',
                details: e
            });
            return true; // Allow on error
        }
    }
    exports.validateField = validateField;
    /**
     * Save Record - final validation before save
     */
    function saveRecord(context) {
        try {
            const currentRecord = context.currentRecord;
            const poNumber = currentRecord.getValue({ fieldId: 'tranid' });
            log.debug({
                title: 'Save Record Validation',
                details: `PO#: ${poNumber}`
            });
            // Check if PO number is provided
            if (!poNumber || poNumber.trim() === '') {
                ui.alert({
                    title: 'PO Number Required',
                    message: 'Please enter a valid PO Number before saving.'
                });
                return false;
            }
            // Validate format
            const validation = validatePOFormat(poNumber);
            if (!validation.isValid) {
                ui.alert({
                    title: 'Invalid PO Number Format',
                    message: validation.message
                });
                return false;
            }
            // Check uniqueness if configured
            if (PO_CONFIG.CHECK_UNIQUENESS) {
                const recordId = currentRecord.id ? currentRecord.id.toString() : undefined;
                if (!checkPOUniqueness(poNumber, recordId)) {
                    ui.alert({
                        title: 'Duplicate PO Number',
                        message: `PO Number "${poNumber}" already exists. Please use a unique PO number.`
                    });
                    return false;
                }
            }
            // All validations passed
            console.log('PO Number validation passed');
            return true;
        }
        catch (e) {
            log.error({
                title: 'Save Record Error',
                details: e
            });
            // Show error to user
            ui.alert({
                title: 'Validation Error',
                message: 'An error occurred during validation. Please contact your administrator.'
            });
            return false; // Block save on error
        }
    }
    exports.saveRecord = saveRecord;
    /**
     * Validate Line - can be used for line-level validation if needed
     */
    function validateLine(context) {
        // Add line-level validation if needed
        return true;
    }
    exports.validateLine = validateLine;
});
