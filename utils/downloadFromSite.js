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

        // Delay before the download button is clickable
        await page.waitForTimeout(5000);
        await downloadButton.click();

        // Wait for the download to start
        const downloadPromise = page.waitForEvent('download');
        const download = await downloadPromise;

        // Get the file size in bytes from stream
        const fileSizeInBytes = await download.createReadStream().then(stream => {
            return new Promise((resolve) => {
                let size = 0;
                stream.on('data', (chunk) => {
                    size += chunk.length;
                });
                stream.on('end', () => {
                    resolve(size);
                });
            });
        });

        const fileSizeInKB = Number((fileSizeInBytes / 1024).toFixed(0));  // File size in KB

        // Create a progress bar
        const progressBar = new cliProgress.SingleBar({
            format: `Downloading ${download.suggestedFilename()} [{bar}] {percentage}% | {value}/{total} KB | Speed: {speed} MB/s`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        let downloadedBytes = 0;
        let startTime = Date.now();

        // Start the progress bar
        progressBar.start(fileSizeInKB, 0, {
            speed: "0.00",
            duration_formatted: "0s"
        });

        // Set up the progress listener
        const stream = await download.createReadStream();

        stream.on('data', chunk => {
            downloadedBytes += chunk.length;
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speedInMBps = (downloadedBytes / (1024 * 1024) / 60) / elapsedSeconds;
            progressBar.update(Math.floor(downloadedBytes / 1024), {
                speed: speedInMBps.toFixed(2),
            });
        });

        // Closing progress bar when the stream ends
        stream.on('end', () => {
            progressBar.stop();
        });

        // Wait for the download stream to finish and save the file
        await download.saveAs(path.join(downloadPath, download.suggestedFilename()));

    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    } finally {
        await browser.close();
    }
}
