/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

import { EntryPoints } from 'N/types';
import * as record from 'N/record';
import * as render from 'N/render';
import * as runtime from 'N/runtime';
import * as log from 'N/log';
import * as config from 'N/config';

/**
 * Suitelet to Generate Certificate of Conformance PDF
 *
 * This Suitelet generates a Certificate of Conformance document for a Sales Order
 * and returns it as a PDF to the user's browser.
 */

/**
 * onRequest event handler
 * Generates and returns the Certificate of Conformance PDF
 *
 * @param {Object} context - The context object
 * @param {ServerRequest} context.request - The incoming request
 * @param {ServerResponse} context.response - The outgoing response
 */
export function onRequest(context: EntryPoints.Suitelet.onRequestContext): void {
    try {
        // Get the Sales Order ID from the request parameter
        const recordId = context.request.parameters.recordId;

        if (!recordId) {
            context.response.write('Error: No Sales Order ID provided');
            return;
        }

        // Load the Sales Order record
        const salesOrder = record.load({
            type: record.Type.SALES_ORDER,
            id: recordId
        });

        // Extract Sales Order data
        const soNumber = salesOrder.getValue({ fieldId: 'tranid' }) || '';
        const customerName = salesOrder.getText({ fieldId: 'entity' }) || '';
        const orderDate = salesOrder.getValue({ fieldId: 'trandate' }) || '';
        const poNumber = salesOrder.getValue({ fieldId: 'otherrefnum' }) || '';
        const memo = salesOrder.getValue({ fieldId: 'memo' }) || '';

        // Get company information
        const companyConfig = config.load({
            type: config.Type.COMPANY_INFORMATION
        });
        const companyName = companyConfig.getValue({ fieldId: 'companyname' }) || 'Company Name';
        const address1 = companyConfig.getValue({ fieldId: 'address1' }) || '';
        const address2 = companyConfig.getValue({ fieldId: 'address2' }) || '';
        const city = companyConfig.getValue({ fieldId: 'city' }) || '';
        const state = companyConfig.getValue({ fieldId: 'state' }) || '';
        const zip = companyConfig.getValue({ fieldId: 'zip' }) || '';
        const country = companyConfig.getValue({ fieldId: 'country' }) || '';

        // Build address text
        const addressParts = [address1, address2, city, state, zip, country].filter(part => part);
        const addressText = addressParts.join(', ');

        // Get current date for certificate generation
        const currentDate = new Date().toLocaleDateString();

        // Get line items
        const lineCount = salesOrder.getLineCount({ sublistId: 'item' });
        let itemsHtml = '';

        for (let i = 0; i < lineCount; i++) {
            const itemName = salesOrder.getSublistText({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            }) || '';

            const quantity = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            }) || 0;

            const description = salesOrder.getSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                line: i
            }) || '';

            itemsHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${itemName}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
                </tr>
            `;
        }

        // Generate the HTML template for the Certificate
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #003366;
            margin: 0;
            font-size: 24px;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
        }
        .company-info {
            text-align: center;
            margin-bottom: 30px;
            font-size: 12px;
            color: #666;
        }
        .cert-info {
            margin-bottom: 30px;
        }
        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .info-label {
            display: table-cell;
            width: 180px;
            font-weight: bold;
            padding: 5px 0;
        }
        .info-value {
            display: table-cell;
            padding: 5px 0;
        }
        .statement {
            margin: 30px 0;
            padding: 20px;
            background-color: #f5f5f5;
            border-left: 4px solid #003366;
            line-height: 1.6;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th {
            background-color: #003366;
            color: white;
            padding: 10px;
            text-align: left;
            border: 1px solid #003366;
        }
        .items-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .signature-section {
            margin-top: 50px;
        }
        .signature-line {
            margin-top: 60px;
            border-top: 1px solid #333;
            width: 300px;
            padding-top: 5px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CERTIFICATE OF CONFORMANCE</h1>
        <h2>Quality Assurance Document</h2>
    </div>

    <div class="company-info">
        <strong>${companyName}</strong><br/>
        ${addressText.replace(/\n/g, '<br/>')}
    </div>

    <div class="cert-info">
        <div class="info-row">
            <div class="info-label">Certificate Date:</div>
            <div class="info-value">${currentDate}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Sales Order Number:</div>
            <div class="info-value">${soNumber}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">${customerName}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Order Date:</div>
            <div class="info-value">${orderDate}</div>
        </div>
        ${poNumber ? `
        <div class="info-row">
            <div class="info-label">Customer PO Number:</div>
            <div class="info-value">${poNumber}</div>
        </div>
        ` : ''}
    </div>

    <div class="statement">
        <p><strong>CERTIFICATION STATEMENT</strong></p>
        <p>
            This is to certify that the materials and/or products listed below have been manufactured,
            inspected, and tested in accordance with the applicable specifications, drawings, and
            quality standards. All items conform to the requirements specified in Sales Order ${soNumber}.
        </p>
        <p>
            The products have been thoroughly examined and meet all quality control standards
            established for their intended use.
        </p>
    </div>

    <h3 style="color: #003366; margin-top: 30px;">Items Covered by this Certificate:</h3>
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th style="text-align: center;">Quantity</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>

    ${memo ? `
    <div style="margin-top: 20px;">
        <strong>Additional Notes:</strong>
        <p style="margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #003366;">
            ${memo}
        </p>
    </div>
    ` : ''}

    <div class="signature-section">
        <p><strong>Authorized By:</strong></p>
        <div class="signature-line">
            <div>Signature</div>
        </div>
        <div style="margin-top: 10px;">
            <strong>Name:</strong> _______________________________
        </div>
        <div style="margin-top: 10px;">
            <strong>Title:</strong> _______________________________
        </div>
        <div style="margin-top: 10px;">
            <strong>Date:</strong> _______________________________
        </div>
    </div>

    <div class="footer">
        This certificate is issued as a formal declaration of conformance to specified requirements.<br/>
        Generated from NetSuite Sales Order ${soNumber} on ${currentDate}
    </div>
</body>
</html>
        `;

        // Create the PDF renderer
        const pdfRenderer = render.create();
        pdfRenderer.templateContent = htmlTemplate;

        // Render the PDF
        const pdfFile = pdfRenderer.renderAsPdf();

        // Write the PDF to the response
        context.response.writeFile({
            file: pdfFile,
            isInline: true
        });

    } catch (error: any) {
        log.error({
            title: 'Error generating Certificate of Conformance',
            details: error.message || error.toString()
        });
        context.response.write('Error generating Certificate of Conformance: ' + (error.message || error.toString()));
    }
}
