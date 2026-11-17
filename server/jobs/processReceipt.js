const path = require('path');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const { extractText } = require('../services/ocrService');
const { parseReceiptText } = require('../services/aiParsingService');
const { normalizeProduct } = require('../services/normalizeProduct');
const { updatePatternsForUser } = require('../services/patternEngine');
const { generateRecommendations } = require('../services/recommendationService');
const { uploadDir } = require('../middleware/upload');

/**
 * Async pipeline: OCR → AI parse → items → patterns → recommendations.
 * Non-blocking from the upload response.
 */
async function processReceipt(receiptId) {
  const receipt = await Receipt.findById(receiptId);
  if (!receipt) return;

  try {
    // imageUrl is a web path like "/uploads/file.png" — on Windows that looks
    // "absolute" to path.isAbsolute, so always resolve under server uploads/.
    const imagePath = path.join(uploadDir, path.basename(receipt.imageUrl));

    const rawText = await extractText(imagePath);
    receipt.rawOcrText = rawText;
    await receipt.save();

    const parsed = await parseReceiptText(rawText);
    const purchaseDate = parsed.purchaseDate || new Date();

    receipt.store = parsed.store || '';
    receipt.purchaseDate = purchaseDate;
    receipt.status = 'parsed';
    receipt.errorMessage = '';
    await receipt.save();

    const itemDocs = parsed.items.map((item) => ({
      receiptId: receipt._id,
      userId: receipt.userId,
      productName: item.name,
      normalizedName: normalizeProduct(item.name),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      category: item.category,
      purchaseDate,
    }));

    await ReceiptItem.deleteMany({ receiptId: receipt._id });
    await ReceiptItem.insertMany(itemDocs);

    // Pattern + recommendations (best-effort; don't fail the receipt)
    try {
      await updatePatternsForUser(receipt.userId);
      await generateRecommendations(receipt.userId);
    } catch (err) {
      console.error('Pattern/recommendation step failed:', err.message);
    }
  } catch (err) {
    console.error(`Receipt ${receiptId} failed:`, err.message);
    receipt.status = 'failed';
    receipt.errorMessage = err.message || 'Processing failed';
    await receipt.save();
  }
}

module.exports = { processReceipt };
