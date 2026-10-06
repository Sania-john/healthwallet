const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const data = await pdf(fs.readFileSync(filePath));
    return data.text || '';
  }

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(filePath);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

module.exports = { extractText };