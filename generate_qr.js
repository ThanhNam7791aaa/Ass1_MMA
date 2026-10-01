const https = require('https');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2];
const outputName = process.argv[3] || 'app_download_qr.png';

if (!targetUrl) {
  console.error('Please provide a URL to generate QR code.');
  console.log('Usage: node generate_qr.js <URL> [output_filename.png]');
  process.exit(1);
}

const encodedUrl = encodeURIComponent(targetUrl);
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&format=png&data=${encodedUrl}`;
const outputPath = path.resolve(__dirname, outputName);

console.log(`Generating QR code for: ${targetUrl}`);
const file = fs.createWriteStream(outputPath);

https.get(qrApiUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to fetch QR code: HTTP status ${response.statusCode}`);
    file.close();
    fs.unlinkSync(outputPath);
    process.exit(1);
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close(() => {
      console.log(`✅ QR code successfully created and saved to: ${outputPath}`);
    });
  });
}).on('error', (err) => {
  fs.unlink(outputPath, () => {});
  console.error('Error generating QR code:', err.message);
  process.exit(1);
});
