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
define(["require", "exports", "N/log"], function (require, exports, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    log = __importStar(log);
    /**
     * User Event Script to add a "Print Certificate of Conformance" button on Sales Order forms
     *
     * This script adds a custom button to the Sales Order form that allows users to generate
     * and print a Certificate of Conformance document for the current sales order.
     */
    /**
     * beforeLoad event handler
     * Adds the "Print Certificate of Conformance" button to the Sales Order form
     *
     * @param {Object} context - The event context
     * @param {Record} context.newRecord - The new record
     * @param {string} context.type - The action type
     * @param {ServerWidget.Form} context.form - The form object
     */
    function beforeLoad(context) {
        try {
            // Only add button in view mode (not create or edit)
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }
            // Get the current record
            const record = context.newRecord;
            const recordId = record.id;
            // Only add button if record is saved (has an ID)
            if (!recordId) {
                return;
            }
            // Add the custom button to the form
            context.form.addButton({
                id: 'custpage_print_conformance',
                label: 'Print Certificate of Conformance',
                functionName: 'printConformanceCertificate'
            });
            // Add the client script to the form
            context.form.clientScriptModulePath = './conformance_cert_cs.js';
        }
        catch (error) {
            log.error({
                title: 'Error in beforeLoad',
                details: error.message || error.toString()
            });
        }
    }
    exports.beforeLoad = beforeLoad;
});
