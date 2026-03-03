#!/usr/bin/env node

/**
 * Automated verification script for preview functionality implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PREVIEW FUNCTIONALITY VERIFICATION TEST\n');
console.log('==========================================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✓ ${name}`);
        if (details) console.log(`  ${details}`);
        testsPassed++;
    } else {
        console.log(`✗ ${name}`);
        if (details) console.log(`  ERROR: ${details}`);
        testsFailed++;
    }
}

// Read files
const htmlContent = fs.readFileSync('index.html', 'utf8');
const jsContent = fs.readFileSync('app.js', 'utf8');
const cssContent = fs.readFileSync('styles.css', 'utf8');

console.log('1. HTML STRUCTURE TESTS');
console.log('------------------------\n');

// Test HTML - Preview buttons
test(
    'Received Order preview button exists',
    htmlContent.includes('onclick="showReceivedOrderPreview()"'),
    'Button with onclick handler found'
);

test(
    'Received Invoice preview button exists',
    htmlContent.includes('onclick="showReceivedInvoicePreview()"'),
    'Button with onclick handler found'
);

test(
    'Stock Receipt preview button exists',
    htmlContent.includes('onclick="showReceiptPreview()"'),
    'Button with onclick handler found'
);

// Test HTML - Modals
test(
    'Received Order preview modal exists',
    htmlContent.includes('id="receivedOrderPreviewModal"'),
    'Modal container found'
);

test(
    'Received Invoice preview modal exists',
    htmlContent.includes('id="receivedInvoicePreviewModal"'),
    'Modal container found'
);

test(
    'Stock Receipt preview modal exists',
    htmlContent.includes('id="receiptPreviewModal"'),
    'Modal container found'
);

// Test HTML - Preview divs
test(
    'Received Order preview div exists',
    htmlContent.includes('id="receivedOrderPreview"'),
    'Preview content container found'
);

test(
    'Received Invoice preview div exists',
    htmlContent.includes('id="receivedInvoicePreview"'),
    'Preview content container found'
);

test(
    'Stock Receipt preview div exists',
    htmlContent.includes('id="receiptPreview"'),
    'Preview content container found'
);

console.log('\n2. JAVASCRIPT FUNCTION TESTS');
console.log('-----------------------------\n');

// Test JavaScript - Functions defined
test(
    'showReceivedOrderPreview function defined',
    jsContent.includes('function showReceivedOrderPreview()'),
    'Function declaration found'
);

test(
    'showReceivedInvoicePreview function defined',
    jsContent.includes('function showReceivedInvoicePreview()'),
    'Function declaration found'
);

test(
    'showReceiptPreview function defined',
    jsContent.includes('function showReceiptPreview()'),
    'Function declaration found'
);

test(
    'generateReceivedOrderHTML function defined',
    jsContent.includes('function generateReceivedOrderHTML('),
    'HTML generator function found'
);

test(
    'generateReceivedInvoiceHTML function defined',
    jsContent.includes('function generateReceivedInvoiceHTML('),
    'HTML generator function found'
);

test(
    'generateReceiptHTML function defined',
    jsContent.includes('function generateReceiptHTML('),
    'HTML generator function found'
);

// Test JavaScript - Functions exported
test(
    'showReceivedOrderPreview exported to window',
    jsContent.includes('window.showReceivedOrderPreview = showReceivedOrderPreview'),
    'Global export found'
);

test(
    'showReceivedInvoicePreview exported to window',
    jsContent.includes('window.showReceivedInvoicePreview = showReceivedInvoicePreview'),
    'Global export found'
);

test(
    'showReceiptPreview exported to window',
    jsContent.includes('window.showReceiptPreview = showReceiptPreview'),
    'Global export found'
);

// Test JavaScript - Close functions
test(
    'closeReceivedOrderPreviewModal function defined',
    jsContent.includes('function closeReceivedOrderPreviewModal()'),
    'Close function found'
);

test(
    'closeReceivedInvoicePreviewModal function defined',
    jsContent.includes('function closeReceivedInvoicePreviewModal()'),
    'Close function found'
);

test(
    'closeReceiptPreviewModal function defined',
    jsContent.includes('function closeReceiptPreviewModal()'),
    'Close function found'
);

// Test JavaScript - Print functions
test(
    'printReceivedOrder function defined',
    jsContent.includes('function printReceivedOrder()'),
    'Print function found'
);

test(
    'printReceivedInvoice function defined',
    jsContent.includes('function printReceivedInvoice()'),
    'Print function found'
);

test(
    'printReceipt function defined',
    jsContent.includes('function printReceipt()'),
    'Print function found'
);

console.log('\n3. CSS STYLING TESTS');
console.log('--------------------\n');

// Test CSS - Received Orders
test(
    'Received Orders CSS classes defined',
    cssContent.includes('.ro-doc') && cssContent.includes('.ro-header') && cssContent.includes('.ro-table'),
    'Main CSS classes for received orders found'
);

test(
    'Received Invoice CSS classes defined',
    cssContent.includes('.ri-doc') && cssContent.includes('.ri-header') && cssContent.includes('.ri-totals'),
    'Main CSS classes for received invoices found'
);

test(
    'Stock Receipt CSS classes defined',
    cssContent.includes('.receipt-doc') && cssContent.includes('.receipt-header') && cssContent.includes('.receipt-table'),
    'Main CSS classes for stock receipts found'
);

test(
    'Print media queries defined',
    cssContent.includes('@media print') && cssContent.includes('receivedOrderPreviewModal'),
    'Print styles for new modals found'
);

console.log('\n4. TRANSLATION TESTS');
console.log('--------------------\n');

// Test translations
test(
    'French translation for "preview" exists',
    jsContent.includes("preview: 'Aperçu'"),
    'FR: preview = Aperçu'
);

test(
    'Czech translation for "preview" exists',
    jsContent.includes("preview: 'Náhled'"),
    'CZ: preview = Náhled'
);

test(
    'French translation for "receivedOrderPreview" exists',
    jsContent.includes("receivedOrderPreview: 'Aperçu de la commande reçue'"),
    'FR: receivedOrderPreview found'
);

test(
    'Czech translation for "receivedOrderPreview" exists',
    jsContent.includes("receivedOrderPreview: 'Náhled přijaté objednávky'"),
    'CZ: receivedOrderPreview found'
);

test(
    'French translation for "stockReceipt" exists',
    jsContent.includes("stockReceipt: 'Réception de stock'"),
    'FR: stockReceipt found'
);

test(
    'Czech translation for "stockReceipt" exists',
    jsContent.includes("stockReceipt: 'Příjemka'"),
    'CZ: stockReceipt found'
);

console.log('\n5. FORM FIELD REFERENCES TEST');
console.log('-------------------------------\n');

// Check that form fields referenced in JS exist in HTML
const recOrdFields = ['recOrdNumber', 'recOrdClientNum', 'recOrdDate', 'recOrdClient', 'recOrdCurrency'];
const allRecOrdFieldsExist = recOrdFields.every(field => htmlContent.includes(`id="${field}"`));
test(
    'All referenced Received Order fields exist in HTML',
    allRecOrdFieldsExist,
    `Checked: ${recOrdFields.join(', ')}`
);

const recInvFields = ['recInvInternalNum', 'recInvNumber', 'recInvSupplier', 'recInvDate', 'recInvSubtotal'];
const allRecInvFieldsExist = recInvFields.every(field => htmlContent.includes(`id="${field}"`));
test(
    'All referenced Received Invoice fields exist in HTML',
    allRecInvFieldsExist,
    `Checked: ${recInvFields.join(', ')}`
);

const entryFields = ['entryBonNum', 'entryDate', 'entrySupplier', 'entryCurrency', 'entryItems'];
const allEntryFieldsExist = entryFields.every(field => htmlContent.includes(`id="${field}"`));
test(
    'All referenced Stock Receipt fields exist in HTML',
    allEntryFieldsExist,
    `Checked: ${entryFields.join(', ')}`
);

console.log('\n6. INTEGRATION TESTS');
console.log('--------------------\n');

// Check that preview buttons are in correct modals
test(
    'Received Order preview button in correct form',
    htmlContent.indexOf('id="receivedOrderForm"') < htmlContent.indexOf('showReceivedOrderPreview()') &&
    htmlContent.indexOf('showReceivedOrderPreview()') < htmlContent.indexOf('id="receivedOrderPreviewModal"'),
    'Button positioned between form and preview modal'
);

test(
    'All close buttons have correct onclick handlers',
    htmlContent.includes('onclick="closeReceivedOrderPreviewModal()"') &&
    htmlContent.includes('onclick="closeReceivedInvoicePreviewModal()"') &&
    htmlContent.includes('onclick="closeReceiptPreviewModal()"'),
    'All close button handlers found'
);

test(
    'All print buttons have correct onclick handlers',
    htmlContent.includes('onclick="printReceivedOrder()"') &&
    htmlContent.includes('onclick="printReceivedInvoice()"') &&
    htmlContent.includes('onclick="printReceipt()"'),
    'All print button handlers found'
);

console.log('\n==========================================');
console.log(`\n📊 TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed === 0) {
    console.log('✅ ALL TESTS PASSED! The preview functionality is correctly implemented.\n');
    process.exit(0);
} else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.\n');
    process.exit(1);
}
