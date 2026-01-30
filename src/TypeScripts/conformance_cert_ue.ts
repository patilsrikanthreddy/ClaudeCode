/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

import { EntryPoints } from 'N/types';
import * as log from 'N/log';

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
export function beforeLoad(context: EntryPoints.UserEvent.beforeLoadContext): void {
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

    } catch (error: any) {
        log.error({
            title: 'Error in beforeLoad',
            details: error.message || error.toString()
        });
    }
}
