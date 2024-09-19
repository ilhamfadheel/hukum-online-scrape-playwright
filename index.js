import { chromium } from 'playwright';
import path from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadFromWebsite(url) {
    // Create the output directory if it doesn't exist
    const downloadPath = path.join(__dirname, 'output');
    if (!existsSync(downloadPath)) {
        mkdirSync(downloadPath);
    }

    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext({
        viewport: null,
        acceptDownloads: true
    });
    const page = await context.newPage();

    try {
        // Navigate to the website
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for the download option to appear and click it
        console.log('Waiting for download option to appear...');
        const downloadOptionSelector = 'button.css-wr4zx9';
        await page.waitForSelector(downloadOptionSelector, { timeout: 5000 });
        console.log('Download option found, clicking...');
        await page.click(downloadOptionSelector);

        // Wait for the download to start
        const downloadPromise = page.waitForEvent('download');
        const download = await downloadPromise;

        // Wait for the download to complete
        await download.saveAs(path.join(downloadPath, download.suggestedFilename()));

        console.log('Download completed successfully!');
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Keep the browser open for 5 seconds before closing
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Usage
const websiteUrl = "https://www.hukumonline.com/pusatdata/detail/lt66e19da238b6f/peraturan-presiden-nomor-98-tahun-2024/";
downloadFromWebsite(websiteUrl);