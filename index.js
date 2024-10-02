import { downloadAllFilesFromPeraturanId } from './utils/downloadFileFromPeraturanId.js';

// can use page param to start from that page ex uu?page=50
// const websiteUrl = "https://peraturan.go.id/uu";
// const websiteUrl = "https://peraturan.go.id/perppu";
// const websiteUrl = "https://peraturan.go.id/pp";
const websiteUrl = "https://peraturan.go.id/perpres?page=26";
downloadAllFilesFromPeraturanId(websiteUrl);