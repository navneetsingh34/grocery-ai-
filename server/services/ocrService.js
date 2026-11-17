const Tesseract = require('tesseract.js');

/**
 * Extract raw text from a receipt image using Tesseract.js.
 * @param {string} imagePath Absolute path to the image file
 * @returns {Promise<string>}
 */
async function extractText(imagePath) {
  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: () => {},
  });
  const text = (result?.data?.text || '').trim();
  if (!text) {
    throw new Error('OCR returned empty text — try a clearer photo');
  }
  return text;
}

module.exports = { extractText };
