import { chromium } from 'playwright';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as cliProgress from 'cli-progress';

export async function downloadFromWebsite(url) {
    // Use the current project's root path
    const downloadPath = path.join(process.cwd(), 'output');
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
        console.log(`Trying to download url: ${url}`);
        const downloadButton = await page.getByRole('button', { name: 'Download' });

        try {
            await downloadButton.waitFor({ state: 'visible', timeout: 5000 });
        } catch (error) {
            console.log('Download option not found, closing the task.');
            throw new Error('Download option not found');
        }

        // there is a delay before the download option is clickable
        await page.waitForTimeout(5000);
        await downloadButton.click();

        // Wait for the download to start
        const downloadPromise = page.waitForEvent('download');
        const download = await downloadPromise;

        // Create a progress bar
        const progressBar = new cliProgress.SingleBar({
            format: `Downloading ${download.suggestedFilename()} [{bar}] {percentage}% | {value}/{total} KB | Speed: {speed} KB/s`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        let downloadedBytes = 0;
        const startTime = Date.now();

        // Start the progress bar
        progressBar.start(100, 0, {
            speed: "N/A"
        });

        // Set up the progress listener
        const stream = await download.createReadStream();
        stream.on('data', chunk => {
            downloadedBytes += chunk.length;
            const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
            const speed = (downloadedBytes / 1024 / elapsedTime).toFixed(2); // in KB/s
            progressBar.update(downloadedBytes / 1024, {
                speed: speed
            });
        });
        stream.on('end', () => {
            progressBar.stop();
        });

        // Wait for the download to complete
        await download.saveAs(path.join(downloadPath, download.suggestedFilename()));

    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    } finally {
        await browser.close();
    }
}