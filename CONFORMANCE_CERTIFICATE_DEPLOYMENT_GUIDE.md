# Certificate of Conformance Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Certificate of Conformance print button feature for NetSuite Sales Orders.

## Feature Description
This feature adds a custom "Print Certificate of Conformance" button to Sales Order forms that generates and prints a professional PDF certificate containing:
- Sales Order details (number, date, customer, PO number)
- Company information
- List of items with quantities and descriptions
- Certification statement
- Signature section

## Files Included

### TypeScript Source Files (src/TypeScripts/)
- `conformance_cert_ue.ts` - User Event script that adds the button to the form
- `conformance_cert_cs.ts` - Client script that handles button clicks
- `conformance_cert_sl.ts` - Suitelet that generates the PDF

### Compiled JavaScript Files (src/FileCabinet/SuiteScripts/)
- `conformance_cert_ue.js` - Compiled User Event script
- `conformance_cert_cs.js` - Compiled Client script
- `conformance_cert_sl.js` - Compiled Suitelet

## Deployment Steps

### Step 1: Upload Files to NetSuite File Cabinet

1. Log in to your NetSuite account
2. Navigate to **Documents > Files > File Cabinet**
3. Create a folder structure (recommended): **SuiteScripts/CertificateOfConformance/**
4. Upload the three compiled JavaScript files:
   - `conformance_cert_ue.js`
   - `conformance_cert_cs.js`
   - `conformance_cert_sl.js`

### Step 2: Create the Suitelet Script Record

1. Navigate to **Customization > Scripting > Scripts > New**
2. Click **Upload File** and select `conformance_cert_sl.js`
3. Click **Create Script Record**
4. Configure the Suitelet:
   - **Name**: Certificate of Conformance Generator
   - **ID**: `customscript_conformance_cert_sl` (IMPORTANT: Use this exact ID)
   - **Script File**: conformance_cert_sl.js
   - **Function**: `onRequest`
   - **Status**: Testing (change to Released after testing)
5. Click **Save**

### Step 3: Deploy the Suitelet

1. On the Suitelet script record, click the **Deployments** subtab
2. Click **Add Deployment**
3. Configure the deployment:
   - **Title**: Certificate of Conformance Deployment
   - **ID**: `customdeploy_conformance_cert_sl` (IMPORTANT: Use this exact ID)
   - **Status**: Testing (change to Released after testing)
   - **Log Level**: Debug (for initial testing, can be changed later)
   - **Execute As Role**: Administrator or appropriate role
   - **Audience**: All Roles (or restrict as needed)
4. Click **Save**

### Step 4: Create the User Event Script Record

1. Navigate to **Customization > Scripting > Scripts > New**
2. Click **Upload File** and select `conformance_cert_ue.js`
3. Click **Create Script Record**
4. Configure the User Event script:
   - **Name**: Certificate of Conformance Button
   - **ID**: `customscript_conformance_cert_ue`
   - **Script File**: conformance_cert_ue.js
   - **Before Load Function**: `beforeLoad`
   - **Status**: Testing (change to Released after testing)
5. Click **Save**

### Step 5: Deploy the User Event Script

1. On the User Event script record, click the **Deployments** subtab
2. Click **Add Deployment**
3. Configure the deployment:
   - **Title**: Sales Order Certificate Button Deployment
   - **ID**: `customdeploy_conformance_cert_ue`
   - **Status**: Testing (change to Released after testing)
   - **Record Type**: Sales Order
   - **Event Types**: Check "Before Load"
   - **Log Level**: Debug (for initial testing)
   - **Execute As Role**: Administrator or appropriate role
   - **Audience**: All Roles (or restrict as needed)
4. Click **Save**

### Step 6: Create the Client Script Record

1. Navigate to **Customization > Scripting > Scripts > New**
2. Click **Upload File** and select `conformance_cert_cs.js`
3. Click **Create Script Record**
4. Configure the Client script:
   - **Name**: Certificate of Conformance Client Handler
   - **ID**: `customscript_conformance_cert_cs`
   - **Script File**: conformance_cert_cs.js
   - **Page Init Function**: `pageInit`
   - **Status**: Testing (change to Released after testing)
5. Click **Save**

**Note**: The Client Script deployment is handled automatically by the User Event script (it's attached to the form via `clientScriptModulePath`), so no separate deployment is needed for the Client Script.

## Testing

### Test the Feature

1. Navigate to a saved Sales Order record (create a test Sales Order if needed)
2. The Sales Order should be in **View** mode (not Edit mode)
3. Look for the "Print Certificate of Conformance" button at the top of the form
4. Click the button
5. A new window/tab should open with the PDF certificate
6. Verify the PDF contains:
   - Correct Sales Order number
   - Customer name
   - Order date
   - Items and quantities
   - Company information
   - Professional formatting

### Troubleshooting

#### Button Not Appearing
- Check User Event script deployment is active
- Verify deployment is set for Sales Order record type
- Check "Before Load" event is selected
- Ensure you're in View mode (not Edit mode)
- Check Script Execution Log for errors

#### Button Clicks But Nothing Happens
- Check browser console for JavaScript errors
- Verify Client Script file path is correct in User Event script
- Check that the Suitelet script and deployment IDs match exactly:
  - Script ID: `customscript_conformance_cert_sl`
  - Deployment ID: `customdeploy_conformance_cert_sl`

#### PDF Generation Errors
- Check Suitelet execution log
- Verify the record ID is being passed correctly
- Ensure user has permission to view Sales Orders
- Check company configuration settings are accessible

#### Checking Script Execution Logs
1. Navigate to **Customization > Scripting > Script Execution Log**
2. Filter by script to see execution details and errors
3. Look for error messages and debug information

## Post-Deployment Configuration

### Customizing the Certificate

To customize the certificate appearance or content, edit `src/TypeScripts/conformance_cert_sl.ts`:

1. Modify the HTML template in the `onRequest` function
2. Update company information fields
3. Add or remove data fields
4. Customize styling (colors, fonts, layout)
5. Recompile: `npm run build`
6. Re-upload `conformance_cert_sl.js` to NetSuite
7. Refresh the Script File on the Suitelet record

### Security Considerations

1. **Permissions**: Ensure only authorized users can print certificates
2. **Audience**: Restrict script deployments to appropriate roles
3. **Data Access**: Verify users can only access their permitted Sales Orders
4. **Signature Section**: The certificate includes a blank signature section - implement a signing workflow if needed

### Moving to Production

1. Test thoroughly in a Sandbox environment first
2. Update all script deployments from "Testing" to "Released"
3. Update Log Level from "Debug" to "Error" or "Audit"
4. Document any customizations made
5. Train users on the new feature

## Script IDs Reference

For easy reference, here are the required Script IDs:

| Component | Script ID | Deployment ID |
|-----------|-----------|---------------|
| Suitelet | `customscript_conformance_cert_sl` | `customdeploy_conformance_cert_sl` |
| User Event | `customscript_conformance_cert_ue` | `customdeploy_conformance_cert_ue` |
| Client Script | `customscript_conformance_cert_cs` | N/A (auto-attached) |

**IMPORTANT**: The Client Script references the Suitelet using these exact IDs. If you use different IDs, you must update the `scriptId` and `deploymentId` values in `conformance_cert_cs.ts` (lines 51-52) and recompile.

## Development Notes

### Building from Source

To rebuild the JavaScript files from TypeScript:

```bash
# Install dependencies (first time only)
npm install

# Compile TypeScript to JavaScript
npm run build
```

Compiled files will be output to `src/FileCabinet/SuiteScripts/`

### File Locations

- **TypeScript Source**: `src/TypeScripts/conformance_cert_*.ts`
- **Compiled JavaScript**: `src/FileCabinet/SuiteScripts/conformance_cert_*.js`
- **NetSuite Upload Location**: Your choice (recommended: SuiteScripts/CertificateOfConformance/)

## Support and Maintenance

### Modifying the Certificate Template

The certificate template is defined in `conformance_cert_sl.ts` as an HTML string. Key sections:

- **Header**: Company name and certificate title
- **Certificate Info**: Sales Order details (SO number, customer, date, PO)
- **Statement**: Certification text
- **Items Table**: List of items from the Sales Order
- **Signature Section**: For manual signing

### Adding Custom Fields

To add custom Sales Order fields to the certificate:

1. Edit `conformance_cert_sl.ts`
2. Add field retrieval code after line 49:
   ```typescript
   const myCustomField = salesOrder.getValue({ fieldId: 'custbody_myfield' }) || '';
   ```
3. Add the field to the HTML template
4. Recompile and re-upload

## Version History

- **Version 1.0** - Initial release
  - Print Certificate of Conformance button on Sales Orders
  - PDF generation with company and order details
  - Professional certificate template

## Additional Resources

- NetSuite SuiteScript 2.1 API Documentation
- NetSuite PDF Generation (N/render module)
- NetSuite User Event Scripts Guide
- NetSuite Client Scripts Guide
- NetSuite Suitelets Guide

---

**Note**: This feature requires NetSuite Administrator privileges to deploy. Ensure you have appropriate permissions before beginning deployment.
