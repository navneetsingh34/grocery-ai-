const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, required: true },
    store: { type: String, default: '' },
    purchaseDate: { type: Date },
    rawOcrText: { type: String, default: '' },
    status: {
      type: String,
      enum: ['processing', 'parsed', 'failed'],
      default: 'processing',
      index: true,
    },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Receipt', receiptSchema);
