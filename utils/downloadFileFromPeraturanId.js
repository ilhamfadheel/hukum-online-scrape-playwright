import { chromium } from 'playwright';
import path from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import * as cliProgress from 'cli-progress';
import { writeFile } from 'fs/promises';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://peraturan.go.id';
const MAX_CONCURRENT_DOWNLOADS = 5;

export async function downloadAllFilesFromPeraturanId(startUrl) {
    const downloadPath = path.join(__dirname, '../output/peraturanId/');
    if (!existsSync(downloadPath)) {
        mkdirSync(downloadPath, { recursive: true });
    }

    const existingFiles = new Set(readdirSync(downloadPath));

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();

    try {
        let currentPageNumber = parseInt(new URL(startUrl).searchParams.get('page') || '1');
        let processedCount = 0;
        let previousFileNames = new Set();

        console.log(`Starting Download with initial page number ${currentPageNumber}`);

        let currentPage = await context.newPage();

        while (true) {
            console.log(`Processing page ${currentPageNumber}`);
            // Check if the startUrl already contains a '?page=' parameter
            let pageUrl = startUrl.includes('?page=')
                ? startUrl.replace(/page=\d+/, `page=${currentPageNumber}`)
                : `${startUrl}${startUrl.includes('?') ? '&' : '?'}page=${currentPageNumber}`;

            await currentPage.goto(pageUrl, { waitUntil: 'domcontentloaded' });

            const pdfLinks = await currentPage.$$eval('li a[href$=".pdf"]', links =>
                links.map(link => ({
                    href: link.getAttribute('href'),
                    filename: link.getAttribute('href').split('/').pop()
                }))
            );

            console.log(`Found ${pdfLinks.length} PDF links on page ${currentPageNumber}`);

            const currentFileNames = new Set(pdfLinks.map(link => link.filename));

            // Check if all files on this page were also on the previous page
            if (pdfLinks.length > 0 && pdfLinks.every(link => previousFileNames.has(link.filename))) {
                console.log("All files on this page were also on the previous page. Reached the end of unique content.");
                break;
            }

            const newLinks = pdfLinks.filter(link => !existingFiles.has(link.filename));
            console.log(`Downloading ${newLinks.length} new files from page ${currentPageNumber}`);

            // Log existing files
            pdfLinks.forEach(link => {
                if (existingFiles.has(link.filename)) {
                    console.log(`File already exists: ${link.filename}`);
                }
            });

            if (newLinks.length > 0) {
                await downloadFilesFromPage(newLinks, downloadPath, existingFiles);
            }

            processedCount += pdfLinks.length;
            console.log(`Processed ${processedCount} total Peraturan so far`);

            // Update previous file names for the next iteration
            previousFileNames = currentFileNames;

            currentPageNumber++;

            // Add a small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Finished processing all pages. Total processed: ${processedCount}`);

    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    } finally {
        await browser.close();
    }
}



async function downloadFilesFromPage(links, downloadPath, existingFiles) {
    const multiBar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {filename} | {percentage}% | {value}KB/{total}KB | Speed: {speed} MB/s'
    }, cliProgress.Presets.shades_classic);

    const downloadQueue = links.filter(link => !existingFiles.has(link.filename));
    const activeDownloads = new Set();

    while (downloadQueue.length > 0 || activeDownloads.size > 0) {
        while (activeDownloads.size < MAX_CONCURRENT_DOWNLOADS && downloadQueue.length > 0) {
            const link = downloadQueue.shift();
            activeDownloads.add(link);
            downloadFile(link, downloadPath, multiBar).then(() => {
                activeDownloads.delete(link);
                existingFiles.add(link.filename);
            });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    multiBar.stop();
}

async function downloadFile(link, downloadPath, multiBar) {
    const fullUrl = `${BASE_URL}${link.href}`;
    const filePath = path.join(downloadPath, link.filename);

    try {
        console.log(`Downloading: ${fullUrl}`);

        const progressBar = multiBar.create(100, 0, {
            filename: link.filename,
            speed: "0.00"
        });

        await downloadWithProgress(fullUrl, filePath, progressBar);

        console.log(`Downloaded: ${link.filename}`);
    } catch (error) {
        console.error(`Error downloading ${link.filename}:`, error);
    }
}

function downloadWithProgress(url, filePath, progressBar) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const fileSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
            let startTime = Date.now();
            let fileData = Buffer.alloc(0);

            // Set the total size in KB
            const totalSizeKB = Math.floor(fileSize / 1024);
            progressBar.setTotal(totalSizeKB);

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                fileData = Buffer.concat([fileData, chunk]);

                const elapsedSeconds = (Date.now() - startTime) / 1000;
                const speedInMBps = (downloadedSize / (1024 * 1024)) / elapsedSeconds;
                const progressInKB = Math.floor(downloadedSize / 1024);

                progressBar.update(progressInKB, {
                    speed: speedInMBps.toFixed(2)
                });
            });

            response.on('end', async () => {
                try {
                    await writeFile(filePath, fileData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            response.on('error', (error) => {
                reject(error);
            });

        }).on('error', (error) => {
            reject(error);
        });
    });
}
