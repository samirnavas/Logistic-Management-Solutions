const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Register helper for 0-based index to 1-based index
handlebars.registerHelper('incrementIndex', function (value) {
    return parseInt(value) + 1;
});

async function htmlToPdfBuffer(html, waitUntil = 'networkidle0') {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new',
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12px',
                right: '12px',
                bottom: '12px',
                left: '12px',
            },
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

const generateCustomPDF = async (data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', 'quotation.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateHtml);
        const html = template(data);

        return await htmlToPdfBuffer(html, 'networkidle0');
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Ledger-style invoice matching admin LiveQuotationLedger + client app live_quotation_ledger.
 */
const generateInvoiceLedgerPdf = async (data) => {
    try {
        const templatePath = path.join(
            __dirname,
            '../templates',
            'quotation_invoice_ledger.html',
        );
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateHtml);
        const html = template(data);

        return await htmlToPdfBuffer(html, 'networkidle0');
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        throw error;
    }
};

module.exports = { generateCustomPDF, generateInvoiceLedgerPdf, htmlToPdfBuffer };
