/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pageInit = void 0;
    /**
     * Client Script for Certificate of Conformance Print Button
     *
     * This script handles the button click event and opens the Suitelet
     * that generates the Certificate of Conformance PDF.
     */
    // Store record ID globally for button access
    let recordId = null;
    /**
     * Page Init function
     * Stores the current record ID
     *
     * @param {Object} context - The context object
     */
    function pageInit(context) {
        recordId = context.currentRecord.id;
    }
    exports.pageInit = pageInit;
    /**
     * Function called when the "Print Certificate of Conformance" button is clicked
     * Opens a new window with the Certificate of Conformance PDF
     */
    function printConformanceCertificate() {
        const urlModule = require('N/url');
        const dialogModule = require('N/ui/dialog');
        try {
            if (!recordId) {
                dialogModule.alert({
                    title: 'Error',
                    message: 'Unable to retrieve Sales Order ID'
                });
                return;
            }
            // Resolve the Suitelet URL
            // Note: You'll need to replace 'customscript_conformance_cert_sl' and 'customdeploy_conformance_cert_sl'
            // with the actual script and deployment IDs after deploying the Suitelet
            const suiteletUrl = urlModule.resolveScript({
                scriptId: 'customscript_conformance_cert_sl',
                deploymentId: 'customdeploy_conformance_cert_sl',
                params: {
                    recordId: recordId
                }
            });
            // Open the PDF in a new window
            const win = window;
            win.open(suiteletUrl, '_blank');
        }
        catch (error) {
            dialogModule.alert({
                title: 'Error',
                message: 'Error generating Certificate of Conformance: ' + (error.message || error.toString())
            });
        }
    }
    window.printConformanceCertificate = printConformanceCertificate;
});
