const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Register helper for 0-based index to 1-based index
handlebars.registerHelper('incrementIndex', function (value) {
    return parseInt(value) + 1;
});

const generateCustomPDF = async (data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', 'quotation.html');
        // Check if template exists
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateHtml);
        const html = template(data);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: 'new'
        });

        const page = await browser.newPage();

        // set content and wait for network idle to ensure images load
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10px',
                right: '10px',
                bottom: '10px',
                left: '10px'
            }
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

module.exports = { generateCustomPDF };
