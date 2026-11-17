const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const { processReceipt } = require('../jobs/processReceipt');

async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Receipt image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const receipt = await Receipt.create({
      userId: req.user._id,
      imageUrl,
      status: 'processing',
    });

    // Kick off pipeline without blocking the response
    setImmediate(() => {
      processReceipt(receipt._id).catch((err) =>
        console.error('processReceipt error:', err)
      );
    });

    res.status(201).json({ receipt });
  } catch (err) {
    next(err);
  }
}

async function listReceipts(req, res, next) {
  try {
    const receipts = await Receipt.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-rawOcrText')
      .lean();
    res.json({ receipts });
  } catch (err) {
    next(err);
  }
}

async function getReceipt(req, res, next) {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const items = await ReceiptItem.find({ receiptId: receipt._id }).lean();
    res.json({ receipt, items });
  } catch (err) {
    next(err);
  }
}

async function reprocessReceipt(req, res, next) {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    receipt.status = 'processing';
    receipt.errorMessage = '';
    await receipt.save();

    setImmediate(() => {
      processReceipt(receipt._id).catch((err) =>
        console.error('processReceipt error:', err)
      );
    });

    res.json({ receipt });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadReceipt, listReceipts, getReceipt, reprocessReceipt };
