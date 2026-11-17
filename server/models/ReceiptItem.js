const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema(
  {
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productName: { type: String, required: true },
    normalizedName: { type: String, required: true, index: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['dairy', 'produce', 'snacks', 'beverages', 'bakery', 'meat', 'pantry', 'frozen', 'household', 'other'],
      default: 'other',
    },
    purchaseDate: { type: Date },
  },
  { timestamps: false }
);

receiptItemSchema.index({ userId: 1, normalizedName: 1 });

module.exports = mongoose.model('ReceiptItem', receiptItemSchema);
