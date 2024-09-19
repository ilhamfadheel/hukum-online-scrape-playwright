# Hukum Online Scraper

A NodeJS web scraper for downloading documents from Hukum Online using Playwright.

## Description

This project is a web scraper designed to automatically download documents from the Hukum Online website. It uses Playwright to navigate the site, locate the download button, and save the file to a local directory.

## Features

- Automated navigation to specified Hukum Online URLs
- Automatic clicking of download buttons
- Saving of downloaded files to a local 'output' directory
- Headless browser operation (can be toggled)

## Installation

To install this project, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/hukum-online-scrape-node.git
   ```
2. Navigate to the project directory:
   ```
   cd hukum-online-scrape-node
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

By default, the script will attempt to download from the URL specified in the `websiteUrl` variable in `index.js`. You can modify this URL to target different pages on Hukum Online.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).