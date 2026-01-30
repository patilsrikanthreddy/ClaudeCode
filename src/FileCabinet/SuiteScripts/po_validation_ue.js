/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
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
define(["require", "exports", "N/error", "N/log"], function (require, exports, error, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = void 0;
    error = __importStar(error);
    log = __importStar(log);
    /**
     * PO Number Validation Configuration
     * Customize these constants based on your business requirements
     */
    const PO_CONFIG = {
        // Regex pattern for PO format (example: PO-YYYY-NNNN)
        PATTERN: /^PO-\d{4}-\d{4,6}$/,
        // Alternative pattern (example: simple alphanumeric)
        // PATTERN: /^[A-Z0-9]{8,15}$/,
        MIN_LENGTH: 8,
        MAX_LENGTH: 20,
        // Whether PO# must be unique across all purchase orders
        CHECK_UNIQUENESS: true,
        // Whether to allow manual PO# or auto-generate
        ALLOW_MANUAL_ENTRY: true,
        // Prefix for auto-generated PO numbers
        AUTO_PREFIX: 'PO',
        // Example format requirements
        FORMAT_DESCRIPTION: 'PO-YYYY-NNNNNN (e.g., PO-2026-001234)'
    };
    /**
     * Validates PO number format
     */
    function validatePOFormat(poNumber) {
        if (!poNumber || poNumber.trim() === '') {
            return {
                isValid: false,
                message: 'PO Number is required and cannot be empty.'
            };
        }
        // Check length
        if (poNumber.length < PO_CONFIG.MIN_LENGTH) {
            return {
                isValid: false,
                message: `PO Number must be at least ${PO_CONFIG.MIN_LENGTH} characters long.`
            };
        }
        if (poNumber.length > PO_CONFIG.MAX_LENGTH) {
            return {
                isValid: false,
                message: `PO Number cannot exceed ${PO_CONFIG.MAX_LENGTH} characters.`
            };
        }
        // Check pattern
        if (!PO_CONFIG.PATTERN.test(poNumber)) {
            return {
                isValid: false,
                message: `PO Number format is invalid. Expected format: ${PO_CONFIG.FORMAT_DESCRIPTION}`
            };
        }
        return {
            isValid: true,
            message: 'Valid'
        };
    }
    /**
     * Checks if PO number is unique in the system
     */
    function isPONumberUnique(poNumber, currentRecordId) {
        try {
            // Search for existing PO with the same number
            const searchModule = require('N/search');
            const poSearch = searchModule.create({
                type: searchModule.Type.PURCHASE_ORDER,
                filters: [
                    ['tranid', searchModule.Operator.IS, poNumber],
                    'AND',
                    ['mainline', searchModule.Operator.IS, 'T']
                ],
                columns: ['internalid']
            });
            const results = poSearch.run().getRange({ start: 0, end: 1 });
            // If no results, PO number is unique
            if (!results || results.length === 0) {
                return true;
            }
            // If editing existing record, allow same PO number
            if (currentRecordId && results[0].id === currentRecordId.toString()) {
                return true;
            }
            // PO number already exists
            return false;
        }
        catch (e) {
            log.error({
                title: 'Error checking PO uniqueness',
                details: e
            });
            // If search fails, allow the operation (don't block on search errors)
            return true;
        }
    }
    /**
     * Auto-generates PO number based on year and sequence
     */
    function generatePONumber() {
        try {
            const searchModule = require('N/search');
            const currentYear = new Date().getFullYear();
            // Find the highest PO number for current year
            const poSearch = searchModule.create({
                type: searchModule.Type.PURCHASE_ORDER,
                filters: [
                    ['tranid', searchModule.Operator.STARTSWITH, `${PO_CONFIG.AUTO_PREFIX}-${currentYear}-`],
                    'AND',
                    ['mainline', searchModule.Operator.IS, 'T']
                ],
                columns: [{
                        name: 'tranid',
                        sort: searchModule.Sort.DESC
                    }]
            });
            const results = poSearch.run().getRange({ start: 0, end: 1 });
            let nextNumber = 1;
            if (results && results.length > 0) {
                const lastPO = results[0].getValue({ name: 'tranid' });
                const matches = lastPO.match(/\d+$/);
                if (matches) {
                    nextNumber = parseInt(matches[0]) + 1;
                }
            }
            // Format: PO-YYYY-NNNNNN (6 digits with leading zeros)
            const paddedNumber = nextNumber.toString().padStart(6, '0');
            return `${PO_CONFIG.AUTO_PREFIX}-${currentYear}-${paddedNumber}`;
        }
        catch (e) {
            log.error({
                title: 'Error generating PO number',
                details: e
            });
            // Fallback to timestamp-based PO number
            const timestamp = Date.now().toString().slice(-8);
            return `${PO_CONFIG.AUTO_PREFIX}-${timestamp}`;
        }
    }
    /**
     * Before Submit validation
     */
    function beforeSubmit(context) {
        try {
            const newRecord = context.newRecord;
            const poNumber = newRecord.getValue({ fieldId: 'tranid' });
            log.debug({
                title: 'PO Validation Started',
                details: `PO#: ${poNumber}, Type: ${context.type}`
            });
            // Only validate on create and edit
            if (context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT) {
                return;
            }
            // If PO number is empty, auto-generate if configured
            if (!poNumber || poNumber.trim() === '') {
                if (!PO_CONFIG.ALLOW_MANUAL_ENTRY) {
                    const generatedPO = generatePONumber();
                    newRecord.setValue({
                        fieldId: 'tranid',
                        value: generatedPO
                    });
                    log.audit({
                        title: 'PO Number Auto-Generated',
                        details: `Generated PO#: ${generatedPO}`
                    });
                    return;
                }
                else {
                    throw error.create({
                        name: 'PO_NUMBER_REQUIRED',
                        message: 'PO Number is required. Please enter a valid PO number.',
                        notifyOff: false
                    });
                }
            }
            // Validate PO format
            const formatValidation = validatePOFormat(poNumber);
            if (!formatValidation.isValid) {
                throw error.create({
                    name: 'INVALID_PO_FORMAT',
                    message: formatValidation.message,
                    notifyOff: false
                });
            }
            // Check uniqueness if configured
            if (PO_CONFIG.CHECK_UNIQUENESS) {
                const recordId = context.type === context.UserEventType.EDIT
                    ? newRecord.id
                    : undefined;
                if (!isPONumberUnique(poNumber, recordId)) {
                    throw error.create({
                        name: 'DUPLICATE_PO_NUMBER',
                        message: `PO Number "${poNumber}" already exists. Please use a unique PO number.`,
                        notifyOff: false
                    });
                }
            }
            log.audit({
                title: 'PO Validation Successful',
                details: `PO#: ${poNumber} is valid`
            });
        }
        catch (e) {
            log.error({
                title: 'PO Validation Error',
                details: e
            });
            // Re-throw the error to prevent record save
            throw e;
        }
    }
    exports.beforeSubmit = beforeSubmit;
    /**
     * After Submit - for logging/notifications
     */
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE) {
                const newRecord = context.newRecord;
                const poNumber = newRecord.getValue({ fieldId: 'tranid' });
                log.audit({
                    title: 'Purchase Order Created',
                    details: `PO#: ${poNumber}, Internal ID: ${newRecord.id}`
                });
                // Add any post-creation logic here (e.g., send notification, create related records)
            }
        }
        catch (e) {
            log.error({
                title: 'After Submit Error',
                details: e
            });
        }
    }
    exports.afterSubmit = afterSubmit;
});
