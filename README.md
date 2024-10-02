# Hukum Online & PERATURAN.GO.ID Scraper

A NodeJS web scraper for downloading documents from Peraturan.go.id or Hukum Online using Playwright.

## Description

This project is a web scraper designed to automatically download PDF documents from the Peraturan.go.id website. It uses Playwright to navigate the site, locate PDF links, and download the files to a local directory.

## Features

- Automated navigation through multiple pages of Peraturan.go.id
- Automatic detection and downloading of PDF links
- Saving of downloaded files to a local 'output' directory
- Concurrent downloads with progress bars
- Resumable downloads (skips already downloaded files)
- Headless browser operation (can be toggled)

## Installation

To install this project, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/ilhamfadheel/hukum-online-scrape-playwright.git
   ```
2. Navigate to the project directory:
   ```
   cd hukum-online-scrape-playwright
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Install playwright browser dep:
    ```
    npx playwright install
    ```

## Usage

To use the scraper, run the following command:

```
npm start
```

By default, the script will start scraping from the first page of the specified section on Peraturan.go.id. You can modify the `startUrl` in the main script to begin from a different page or section.

To start from a specific page, you can pass the page number in the URL, for example:

```javascript
const startUrl = 'https://peraturan.go.id/peraturan/index.html?page=27';
```
## Configuration
You can adjust the following parameters in the script:

MAX_CONCURRENT_DOWNLOADS: Maximum number of concurrent downloads
downloadPath: The directory where files will be saved

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).